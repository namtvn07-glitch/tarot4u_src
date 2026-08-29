"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { StarField } from "@/components/ui/StarField";
import type { Orientation } from "@/lib/reading";

export interface RevealedCard {
  cardId: string;
  nameVi: string;
  image: string;
  orientation: Orientation;
  base: { body: string; summary: string; keywords: string[] };
}

export interface SlotSpec {
  left: number;
  top: number;
  rotate: number;
}

interface FlyCard {
  slotIndex: number;
  tableIndex: number;
  card: RevealedCard;
  startLeft: number;
  startTop: number;
  arrived: boolean;
  flipped: boolean;
}

// Timing tham khảo kỹ thuật của https://boitarot.com.vn/boi-tarot/ (đối
// thủ user chỉ đích danh — animate `left`/`top` CSS thật trên phần tử
// `position:absolute`, không phải transform x/y) nhưng ĐÃ RÚT NGẮN sau khi
// user phản hồi "khựng"/"chưa mượt" (Giai đoạn 4c, `.claude/brain/4c-picker-redesign/`).
// Tách khỏi CardSpreadPicker.tsx (2026-08-27, `.claude/brain/quick-read-card-spread/`)
// để dùng chung cho cả Đọc nhanh lẫn Đọc sâu — GIÁ TRỊ GIỮ NGUYÊN, không
// được đổi khi tách.
const DEAL_MS = 620;
const DEAL_EASE = "cubic-bezier(.22,.61,.36,1)";
const DEAL_STAGGER_MS = 38;
const FLY_MS = 620;
const FLIP_MS = 420;
const PRESS_MS = 150;

// Export vì CardSpreadPicker.tsx (breakout layout desktop) và ReadingStage.tsx
// cần cùng cách đọc token spacing thật thay vì mỗi nơi tự viết lại.
export function spacePx(varName: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName);
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

// Kích thước lá theo bề rộng khung chứa — giá trị tính toán bố cục phụ
// thuộc container thực tế (đối thủ dùng cỡ lá cố định 86×130px vì họ không
// có ngưỡng touch target nào ràng buộc; ở đây bắt buộc co giãn để không vỡ
// 44px tối thiểu khi màn hẹp — xem computeDeckSlots). Export để nơi gọi
// (CardSpreadPicker, ReadingStage) tự tính vị trí "bàn" bằng đúng cỡ lá này.
export function cardSizeForWidth(containerWidth: number, kind: "deck" | "table") {
  const base = containerWidth <= 400 ? 46 : containerWidth <= 640 ? 54 : containerWidth <= 900 ? 62 : 70;
  const w = Math.round(kind === "table" ? base * 1.9 : base);
  return { w, h: Math.round((w * 8) / 5) };
}

// Xếp N lá thành nhiều hàng, đè NGANG theo tỉ lệ tham khảo (targetStep ≈
// 63% cardW) nhưng chặn dưới 44px cho phần lộ ra của lá bị che (touch
// target, accessibility.md). Số hàng tính ĐỘNG theo bề rộng thật — ép cứng
// 2 hàng như đối thủ từng gây tràn ngang thật ở 375px.
function computeDeckSlots(
  count: number,
  containerWidth: number,
  cardW: number,
  cardH: number,
  topOffset: number,
): { slots: SlotSpec[]; rows: number } {
  const margin = spacePx("--space-3", 12);
  const avail = Math.max(cardW, containerWidth - margin * 2);
  const rowGapY = cardH + spacePx("--space-2", 8);
  const targetStep = Math.max(44, Math.round(cardW * 0.63));

  const perRowMax = Math.max(1, Math.floor((avail - cardW) / targetStep) + 1);
  const rows = Math.max(1, Math.ceil(count / perRowMax));
  const base = Math.floor(count / rows);
  const extra = count % rows;

  function rowSlots(n: number, rowIndex: number): SlotSpec[] {
    if (n <= 0) return [];
    const maxStepToFit = n === 1 ? targetStep : (avail - cardW) / (n - 1);
    const step = Math.max(44, Math.min(targetStep, maxStepToFit));
    const span = (n - 1) * step + cardW;
    const startX = margin + Math.max(0, (avail - span) / 2);
    const y = topOffset + rowIndex * rowGapY;
    const out: SlotSpec[] = [];
    for (let i = 0; i < n; i++) {
      out.push({ left: startX + i * step, top: y, rotate: 0 });
    }
    return out;
  }

  const out: SlotSpec[] = [];
  for (let r = 0; r < rows; r++) {
    out.push(...rowSlots(base + (r < extra ? 1 : 0), r));
  }
  return { slots: out, rows };
}

// Điểm gốc "chồng bài" ở góc — lá nào cũng bắt đầu xếp gần đây trước khi
// trải ra slot của nó, mô phỏng độ dày cỗ bài. `* 0.5`/`* 0.4`/`(index % 5) - 2`
// là hệ số dàn "lệch" thuần trang trí (mô phỏng cỗ bài không xếp thẳng hàng
// tuyệt đối) — cố ý không phải token, không có bước ramp nào biểu diễn được
// một hiệu ứng lệch ngẫu nhiên kiểu này.
function stackOrigin(index: number, containerWidth: number, dealTopOffset: number): SlotSpec {
  const baseLeft = Math.min(containerWidth * 0.18, 160);
  return {
    left: baseLeft + index * 0.5,
    top: dealTopOffset + spacePx("--space-3", 12) + index * 0.4,
    rotate: ((index % 5) - 2) * 0.4,
  };
}

// Component "ngu" thuần visual: trải `slots` lá úp, để user tự bấm chọn tới
// khi đủ `tableSlots.length` lá — không biết gì về token ký, credits, hay
// luồng gọi API cụ thể (đó là việc của `onPick`, do nơi gọi cung cấp). Dùng
// chung cho Đọc nhanh (`ReadingStage.tsx`, 1 lá) và Đọc sâu
// (`CardSpreadPicker.tsx`, 3 lá) — xem `.claude/brain/quick-read-card-spread/`.
export function CardSpread({
  slots,
  ariaLabel,
  containerWidth,
  tableSlots,
  onPick,
  onActiveCardChange,
  onAllPicked,
}: {
  slots: number;
  ariaLabel: string;
  containerWidth: number;
  tableSlots: SlotSpec[];
  // revealIndex = số lá đã bốc xong TRƯỚC lá này (0-indexed, theo THỨ TỰ
  // bấm) — Đọc sâu cần số này để hỏi đúng lá theo thứ tự trong token đã ký;
  // Đọc nhanh có thể bỏ qua tham số này.
  onPick: (slotIndex: number, revealIndex: number) => Promise<RevealedCard>;
  onActiveCardChange?: (card: RevealedCard | undefined) => void;
  onAllPicked?: (cards: RevealedCard[]) => void;
}) {
  const reducedMotion = !!useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  // Nút "lá bay tới bàn" mount SAU khi nút deck (đang giữ focus) unmount —
  // nếu không dời focus sang đây, nó rơi thẳng về <body> mỗi lần bốc lá
  // (design-review 2026-08-27, phát hiện 🔴, đã có sẵn từ trước lúc tách
  // file này nhưng giờ mới sửa vì đã chạm đúng chỗ). Map theo slotIndex vì
  // key của nút flying dùng slotIndex, không phải tableIndex.
  const flyingButtonRefs = useRef(new Map<number, HTMLButtonElement>());
  // Mỗi slot chỉ bốc được đúng 1 lần (đã bốc thì lọc khỏi deck, không bốc lại
  // được) nên mỗi giá trị set vào đây trong suốt vòng đời component là duy
  // nhất — không cần reset về null sau khi dùng, tránh setState trong effect
  // (React Compiler `react-hooks/set-state-in-effect` chặn pattern đó).
  const [focusSlotIndex, setFocusSlotIndex] = useState<number | null>(null);

  useEffect(() => {
    if (focusSlotIndex === null) return;
    flyingButtonRefs.current.get(focusSlotIndex)?.focus({ preventScroll: true });
  }, [focusSlotIndex]);

  const [dealt, setDealt] = useState(false);
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => setDealt(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const [flying, setFlying] = useState<FlyCard[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);

  const pickedSlotIndexes = new Set(flying.map((p) => p.slotIndex));
  const allPicked = flying.length >= tableSlots.length;

  const layout = useMemo(() => {
    const deckCard = cardSizeForWidth(containerWidth, "deck");
    const tableCard = cardSizeForWidth(containerWidth, "table");
    const dealTopOffset = tableCard.h + spacePx("--space-5", 24);
    const { slots: deckSlots, rows } = computeDeckSlots(slots, containerWidth, deckCard.w, deckCard.h, dealTopOffset);
    const rowGapY = deckCard.h + spacePx("--space-2", 8);
    const containerHeight = Math.round(dealTopOffset + rows * rowGapY + spacePx("--space-4", 16));
    return { deckCard, tableCard, containerHeight, deckSlots, dealTopOffset };
  }, [containerWidth, slots]);

  const activePick = flying.find((p) => p.slotIndex === activeSlot) ?? flying[flying.length - 1];

  // onActiveCardChange/onAllPicked là callback do nơi gọi truyền — cố ý
  // không đưa vào dependency array, chỉ muốn effect chạy lại khi CHÍNH lá
  // đang active (hoặc trạng thái allPicked) đổi, không phải mỗi khi cha
  // re-render tạo callback mới.
  useEffect(() => {
    onActiveCardChange?.(activePick?.card);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePick?.card]);

  // `onAllPicked` KHÔNG bắn qua effect theo dõi `allPicked` — biến đó đổi
  // NGAY khi `setFlying` thêm phần tử (trước khi bay/lật kịp chạy), nếu bắn
  // callback ngay lúc đó thì nơi gọi (vd. ReadingStage ẩn khu trải bài khi
  // "success") sẽ cắt ngang animation đang bay/lật giữa chừng. Bắn đúng lúc
  // trong `handlePick`, sau khi lá cuối cùng đã lật xong hẳn — xem dưới.

  async function handlePick(slotIndex: number, event: MouseEvent<HTMLButtonElement>) {
    if (pickedSlotIndexes.has(slotIndex) || allPicked || loadingSlot !== null) return;
    // Đặt loading NGAY LẬP TỨC (trước await) — lá được bấm nhấc lên + sáng
    // lên trong PRESS_MS (150ms) tại chỗ, phản hồi tức thì bất kể mạng chậm
    // cỡ nào. Đo được: không có bước này, độ trễ round-trip khiến cả khu
    // vực trông như "khựng" — bấm xong không có gì xảy ra trong nửa giây.
    setLoadingSlot(slotIndex);
    setError(null);

    // Ghi lại vị trí thật của lá NGAY LÚC bấm — nếu bấm giữa lúc đang trải
    // (chưa "settled"), lá bay sẽ xuất phát đúng từ chỗ nó đang ở.
    const btnRect = event.currentTarget.getBoundingClientRect();
    const hostRect = rootRef.current?.getBoundingClientRect();
    const startLeft = btnRect.left - (hostRect?.left ?? 0);
    const startTop = btnRect.top - (hostRect?.top ?? 0);

    try {
      const revealIndex = flying.length;
      const card = await onPick(slotIndex, revealIndex);
      const tableIndex = revealIndex;
      const isLastPick = revealIndex + 1 >= tableSlots.length;
      // `flying` ở đây là closure CŨ (chưa có lá vừa bốc) — tự nối thêm để
      // có đủ danh sách lá theo đúng thứ tự khi báo `onAllPicked`.
      const allCardsInOrder = [...flying.map((f) => f.card), card];

      setFlying((prev) => [...prev, { slotIndex, tableIndex, card, startLeft, startTop, arrived: false, flipped: false }]);
      setActiveSlot(slotIndex);
      // Nút deck sắp unmount (thay bằng nút "lá bay") — dời focus sang đó
      // ngay khi nó xuất hiện, đừng để rơi về <body>.
      setFocusSlotIndex(slotIndex);

      if (reducedMotion) {
        setFlying((prev) => prev.map((p) => (p.slotIndex === slotIndex ? { ...p, arrived: true, flipped: true } : p)));
        if (isLastPick) onAllPicked?.(allCardsInOrder);
      } else {
        // 2 nhịp: vẽ ở vị trí xuất phát trước (frame này), rồi mới đổi sang
        // toạ độ đích ở nhịp sau — CSS transition mới có cái để nội suy.
        // Lật mặt chỉ bắt đầu SAU KHI đã bay xong hẳn (40ms trigger + FLY_MS
        // bay + 30ms đệm) — không còn chồng lấn 2 animation.
        setTimeout(() => {
          setFlying((prev) => prev.map((p) => (p.slotIndex === slotIndex ? { ...p, arrived: true } : p)));
        }, 40);
        setTimeout(() => {
          setFlying((prev) => prev.map((p) => (p.slotIndex === slotIndex ? { ...p, flipped: true } : p)));
          // Nếu đây là lá cuối, chờ thêm FLIP_MS để hiệu ứng lật chạy xong
          // HẲN trên màn hình rồi mới báo cho nơi gọi — tránh bị cắt ngang
          // giữa lúc đang lật (vd. nếu nơi gọi ẩn cả khu trải bài khi xong).
          if (isLastPick) {
            setTimeout(() => onAllPicked?.(allCardsInOrder), FLIP_MS);
          }
        }, 40 + FLY_MS + 30);
      }
    } catch {
      setError("Không mở được lá này. Vui lòng thử lại.");
    } finally {
      setLoadingSlot(null);
    }
  }

  return (
    <>
      <div
        ref={rootRef}
        className="relative"
        style={{ width: "100%", height: layout.containerHeight, overflow: "visible" }}
        role="group"
        aria-label={ariaLabel}
      >
        {/* Ambience tĩnh — KHÔNG đụng timing deal/fly/flip (xem
            calestial-redesign/implementation-plan.md Layer 4). */}
        <StarField density="sparse" />
        {Array.from({ length: slots }).map((_, i) => {
          if (pickedSlotIndexes.has(i)) return null;
          const slot = layout.deckSlots[i];
          const origin = stackOrigin(i, containerWidth, layout.dealTopOffset);
          const pos = reducedMotion || dealt ? slot : origin;
          const isLoading = loadingSlot === i;

          return (
            <button
              key={i}
              type="button"
              // Nút đang tự nó "loading" (vừa bấm) KHÔNG bị disable — nếu
              // disable, trình duyệt tự blur nó về <body> ngay lập tức, mất
              // focus suốt khoảng chờ mạng (~250-600ms) trước khi nút flying
              // kịp mount để nhận lại focus. Các nút KHÁC vẫn khoá bình
              // thường để không bốc chồng lá trong lúc chờ.
              disabled={allPicked || (loadingSlot !== null && loadingSlot !== i)}
              onClick={(e) => handlePick(i, e)}
              aria-label={`Chọn lá thứ ${i + 1}`}
              className="absolute min-h-[44px] min-w-[44px] cursor-pointer overflow-hidden rounded-md shadow-md disabled:cursor-default"
              style={{
                left: pos.left,
                top: pos.top,
                width: layout.deckCard.w,
                height: layout.deckCard.h,
                transition: reducedMotion
                  ? undefined
                  : `left ${DEAL_MS}ms ${DEAL_EASE} ${i * DEAL_STAGGER_MS}ms, top ${DEAL_MS}ms ${DEAL_EASE} ${i * DEAL_STAGGER_MS}ms`,
                border: "1px solid var(--color-border)",
                // z-index cục bộ nhỏ, KHÔNG dùng số lớn tuỳ tiện — panel ngữ
                // cảnh (nếu có) dùng token `--z-overlay`(300), toàn bộ ngăn
                // xếp cục bộ ở đây phải nằm hẳn dưới mốc đó.
                zIndex: isLoading ? 40 : i,
              }}
            >
              <div
                className="relative h-full w-full"
                style={{
                  transform: isLoading
                    ? `rotate(${pos.rotate}deg) translateY(-6px) scale(1.05)`
                    : `rotate(${pos.rotate}deg)`,
                  transition: reducedMotion ? undefined : `transform ${PRESS_MS}ms ease-out`,
                  filter: isLoading ? "brightness(1.15)" : undefined,
                }}
              >
                <Image src="/_placeholder-doi-thu/card-back.jpg" alt="" fill sizes="90px" className="object-cover" />
                {isLoading && (
                  <span
                    aria-hidden={!reducedMotion}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "var(--color-scrim)" }}
                  >
                    {reducedMotion ? (
                      <span className="text-caption font-semibold" style={{ color: "var(--color-on-scrim)" }}>
                        Đang mở…
                      </span>
                    ) : (
                      <span
                        className="h-4 w-4 animate-spin rounded-full"
                        style={{
                          border: "2px solid color-mix(in srgb, var(--color-on-scrim) 40%, transparent)",
                          borderTopColor: "var(--color-on-scrim)",
                        }}
                      />
                    )}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {flying.map((p) => {
          const target = tableSlots[p.tableIndex];
          const pos = p.arrived ? target : { left: p.startLeft, top: p.startTop };
          const isActive = p.slotIndex === activeSlot;
          const orientationLabel = p.card.orientation === "upright" ? "xuôi" : "ngược";

          return (
            <button
              key={p.slotIndex}
              type="button"
              ref={(el) => {
                if (el) flyingButtonRefs.current.set(p.slotIndex, el);
                else flyingButtonRefs.current.delete(p.slotIndex);
              }}
              onClick={() => setActiveSlot(p.slotIndex)}
              aria-label={`Lá ${p.card.nameVi}, rút ${orientationLabel}${isActive ? ", đang xem" : ""}`}
              aria-pressed={isActive}
              className="absolute cursor-pointer overflow-hidden rounded-md shadow-lg"
              style={{
                left: pos.left,
                top: pos.top,
                width: layout.tableCard.w,
                height: layout.tableCard.h,
                perspective: 900,
                transition: reducedMotion ? undefined : `left ${FLY_MS}ms ${DEAL_EASE}, top ${FLY_MS}ms ${DEAL_EASE}`,
                outline: isActive ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                outlineOffset: 2,
                zIndex: 50 + p.tableIndex,
              }}
            >
              {reducedMotion ? (
                <div className="relative h-full w-full">
                  <div
                    className="absolute inset-0"
                    style={{ opacity: p.flipped ? 0 : 1, transition: `opacity ${DEAL_MS}ms linear` }}
                  >
                    <Image src="/_placeholder-doi-thu/card-back.jpg" alt="" fill sizes="140px" className="object-cover" />
                  </div>
                  <div
                    className="absolute inset-0"
                    style={{ opacity: p.flipped ? 1 : 0, transition: `opacity ${DEAL_MS}ms linear` }}
                  >
                    <Image src={p.card.image} alt="" fill sizes="140px" className="object-cover" />
                  </div>
                </div>
              ) : (
                <div
                  className="relative h-full w-full"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: p.flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transition: `transform ${FLIP_MS}ms ease`,
                  }}
                >
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                    <Image src="/_placeholder-doi-thu/card-back.jpg" alt="" fill sizes="140px" className="object-cover" />
                  </div>
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <Image src={p.card.image} alt="" fill sizes="140px" className="object-cover" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-body-sm" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </>
  );
}
