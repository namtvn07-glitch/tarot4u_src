"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CardSpread,
  cardSizeForWidth,
  spacePx,
  type RevealedCard,
  type SlotSpec,
} from "@/components/reading/CardSpread";
import { TOPIC_LABEL, type Topic } from "@/lib/reading";

export type { RevealedCard };

function computeTableSlots(containerWidth: number, cardW: number): SlotSpec[] {
  const gap = spacePx("--space-4", 16);
  const totalW = cardW * 3 + gap * 2;
  const startX = Math.max(spacePx("--space-3", 12), (containerWidth - totalW) / 2);
  return [0, 1, 2].map((i) => ({ left: startX + i * (cardW + gap), top: 0, rotate: 0 }));
}

export function CardSpreadPicker({
  token,
  slots,
  deepReadingStarted,
  topic,
  question,
  onDeepReading,
}: {
  token: string;
  slots: number;
  deepReadingStarted: boolean;
  topic: Topic;
  question: string;
  onDeepReading: () => void;
}) {
  const reducedMotion = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  // ≥768px: khu trải bài "phá khung" ra khỏi cột `max-w-5xl` của trang để
  // chiếm ~70% MÀN HÌNH thật, LỆCH HẲN SANG TRÁI (mép trái chỉ còn cách mép
  // trái màn hình đúng 1 khoảng gap — cùng khoảng cách panel đang chừa bên
  // phải, đối xứng). Panel ngữ cảnh chiếm phần còn lại bên phải, đo theo
  // `window.innerWidth` chứ không phải bề rộng cột nội dung. Đo 1 lần lúc
  // mount, không theo dõi resize runtime. Gộp chung 1 state object + 1 lần
  // setState — tách thành nhiều `useState` riêng bị React Compiler chặn
  // (`react-hooks/set-state-in-effect`).
  const [measure, setMeasure] = useState({
    isDesktop: false,
    containerWidth: 600,
    panelWidthNormal: 320,
    panelWidthExpanded: 480,
    deckWidthPx: null as number | null,
    deckMarginLeft: 0,
  });
  const { isDesktop, containerWidth, panelWidthNormal, panelWidthExpanded, deckWidthPx, deckMarginLeft } = measure;

  useLayoutEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    if (!desktop) {
      const w = wrapRef.current?.clientWidth;
      setMeasure((m) => ({ ...m, isDesktop: false, containerWidth: w || m.containerWidth }));
      return;
    }

    const vw = window.innerWidth;
    const gap = spacePx("--space-6", 32);
    const pNormal = Math.round(Math.min(480, Math.max(280, vw * 0.3)));
    const pExpanded = Math.round(Math.min(720, Math.max(360, vw * 0.5)));
    const leftOffset = wrapRef.current?.getBoundingClientRect().left ?? 0;
    const marginLeft = -(leftOffset - gap);
    // Panel chỉ đè lên khi mở rộng (allRevealed) — khu trải bài LUÔN tính
    // theo `pNormal` (30%), không co lại khi panel nở ra 50%, đúng yêu cầu
    // "có thể đè lên đống bài" thay vì đẩy bố cục. Mép trái = gap (đã kéo
    // sang trái), nên bề rộng tính từ đó, không phải từ `leftOffset` cũ.
    const deckW = Math.max(280, vw - gap - pNormal - gap);
    setMeasure({
      isDesktop: true,
      containerWidth: deckW,
      panelWidthNormal: pNormal,
      panelWidthExpanded: pExpanded,
      deckWidthPx: deckW,
      deckMarginLeft: marginLeft,
    });
  }, []);

  const [activeCard, setActiveCard] = useState<RevealedCard | undefined>(undefined);
  const [allRevealed, setAllRevealed] = useState(false);
  // Panel ngữ cảnh (fixed, ≥768px) có thể đè lên text Đọc sâu render bên
  // dưới nó trên trang — tự ẩn ngay khi bắt đầu Đọc sâu để nhường chỗ, vẫn
  // để nút bật lại thủ công (không ẩn cứng) cho ai muốn xem lại lá/câu hỏi.
  const [panelVisible, setPanelVisible] = useState(true);

  function handleDeepReadingStart() {
    setPanelVisible(false);
    onDeepReading();
  }

  // 3 lá đã bốc KHÔNG được để panel đè lên (khác đống bài chưa bốc — panel
  // đè lên đống đó là chủ ý). Khi panel nở 50% (`allRevealed`), nó ăn thêm
  // `panelWidthExpanded - panelWidthNormal` vào phía phải của khu trải bài —
  // trừ đúng phần đó ra khỏi bề rộng dùng để CĂN GIỮA 3 ô bàn, để chúng luôn
  // nằm trong vùng panel không với tới được, dù đang ở dạng 30% hay đã nở
  // 50%.
  const tableSlots = useMemo(() => {
    const tableCard = cardSizeForWidth(containerWidth, "table");
    const tableAreaWidth =
      isDesktop && allRevealed
        ? Math.max(280, containerWidth - (panelWidthExpanded - panelWidthNormal))
        : containerWidth;
    return computeTableSlots(tableAreaWidth, tableCard.w);
  }, [containerWidth, isDesktop, allRevealed, panelWidthExpanded, panelWidthNormal]);

  async function handlePick(_slotIndex: number, revealIndex: number): Promise<RevealedCard> {
    const res = await fetch("/api/reading/deep/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, revealIndex }),
    });
    if (!res.ok) throw new Error("reveal_failed");
    return (await res.json()) as RevealedCard;
  }

  return (
    <div>
      {/* Ở ≥768px, width được ép tường minh bằng số đo thật (xem
          useLayoutEffect) để "phá khung" ra khỏi max-w-5xl — không dùng
          Tailwind pr-* vì clientWidth của 1 phần tử LUÔN bao gồm padding
          của chính nó, sẽ tính sai `containerWidth` cho CardSpread nếu vừa
          đo vừa đặt padding trên cùng 1 phần tử (bug thật gặp lúc dựng bản
          này, đã sửa bằng cách tách hẳn "đo" và "trừ chỗ cho panel" thành 2
          bước độc lập). */}
      <div
        ref={wrapRef}
        style={{
          width: isDesktop && deckWidthPx ? deckWidthPx : undefined,
          marginLeft: isDesktop ? deckMarginLeft : undefined,
        }}
      >
        <CardSpread
          slots={slots}
          ariaLabel="Chọn 3 lá bài bất kỳ"
          containerWidth={containerWidth}
          tableSlots={tableSlots}
          onPick={handlePick}
          onActiveCardChange={setActiveCard}
          onAllPicked={() => setAllRevealed(true)}
        />
      </div>

      <ContextPanel
        topic={topic}
        question={question}
        activeCard={activeCard}
        allRevealed={allRevealed}
        deepReadingStarted={deepReadingStarted}
        onDeepReading={handleDeepReadingStart}
        isDesktop={isDesktop}
        width={allRevealed ? panelWidthExpanded : panelWidthNormal}
        reducedMotion={reducedMotion}
        visible={panelVisible}
        onToggleVisible={() => setPanelVisible((v) => !v)}
      />
    </div>
  );
}

// Panel ngữ cảnh — luôn hiện từ lúc bắt đầu bốc lá (không chờ có lá active),
// vì chủ đề + câu hỏi của user phải thấy được ngay. Ở ≥768px neo CỐ ĐỊNH
// bên phải màn hình (`position:fixed`, không cuộn theo trang), rộng ~30%
// màn hình lúc đang bốc, tự nở ra ~50% VÀ ĐÈ LÊN khu trải bài khi đủ 3 lá
// (`width` do component cha tính theo `window.innerWidth`). z-index dùng
// token `--z-overlay`(300) — cao hơn hẳn ngăn xếp cục bộ của deck/lá bay
// (tối đa ~52), đủ để đè lên khi mở rộng. Ở <768px nằm trong luồng trang
// bình thường bên dưới khu bốc lá, rộng 100%.
//
// Panel này (đặc biệt khi nở 50%) có thể đè lên text Đọc sâu render ở dưới
// nó trên trang — `visible`/`onToggleVisible` cho phép ẩn hẳn nội dung panel
// (component cha tự ẩn ngay khi bấm "Đọc sâu"), nhưng nút bật/tắt luôn hiện
// độc lập với `visible` để không khoá người dùng khỏi xem lại lá/câu hỏi.
function ContextPanel({
  topic,
  question,
  activeCard,
  allRevealed,
  deepReadingStarted,
  onDeepReading,
  isDesktop,
  width,
  reducedMotion,
  visible,
  onToggleVisible,
}: {
  topic: Topic;
  question: string;
  activeCard: RevealedCard | undefined;
  allRevealed: boolean;
  deepReadingStarted: boolean;
  onDeepReading: () => void;
  isDesktop: boolean;
  width: number;
  reducedMotion: boolean;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div
      className="mt-6 w-full md:mt-0 md:fixed md:top-[calc(var(--space-8)_+_var(--space-5))] md:right-[var(--space-6)]"
      style={{
        width: isDesktop ? width : undefined,
        zIndex: isDesktop ? spacePx("--z-overlay", 300) : undefined,
        transition: isDesktop && !reducedMotion ? "width 280ms ease" : undefined,
      }}
    >
      <div className="mb-2 flex justify-end">
        <Button variant="ghost" className="px-3 py-2 text-body-sm" onClick={onToggleVisible} aria-expanded={visible}>
          {visible ? "Ẩn thông tin lá" : "Hiện thông tin lá"}
        </Button>
      </div>

      {visible && (
        // max-h trừ thêm chỗ cho nút bật/tắt phía trên (44px cao + 8px gap) so
        // với 176px gốc — giữ panel không tràn quá đáy màn hình.
        <Card className="flex max-h-none w-full flex-col gap-4 md:max-h-[calc(100vh_-_228px)] md:overflow-y-auto">
          <div>
            <p className="m-0 mb-1 text-caption font-semibold uppercase tracking-wide text-text-muted">
              {TOPIC_LABEL[topic]}
            </p>
            <p className="m-0 text-body-sm text-text">{question}</p>
          </div>

          <div className="border-t" style={{ borderColor: "var(--color-border)" }} />

          {activeCard ? (
            <div>
              <h3 className="mb-1 font-heading text-heading-3 text-text">{activeCard.nameVi}</h3>
              <span
                className="mb-3 inline-flex min-h-[28px] items-center rounded-full border px-3 text-body-sm font-semibold text-text"
                style={{ borderColor: "var(--color-border-interactive)" }}
              >
                {activeCard.orientation === "upright" ? "Xuôi" : "Ngược"}
              </span>
              <RevealText
                key={activeCard.cardId + activeCard.orientation}
                text={activeCard.base.body}
                className="m-0 mb-5 text-body text-text"
              />

              {allRevealed && !deepReadingStarted && (
                <Button className="w-full" onClick={onDeepReading}>
                  Đọc sâu cho câu hỏi của bạn
                </Button>
              )}
            </div>
          ) : (
            <p className="m-0 text-body-sm text-text-muted">Bốc 1 lá bất kỳ để xem mô tả ở đây.</p>
          )}
        </Card>
      )}
    </div>
  );
}

// Chữ hiện lần lượt theo từng từ khi đổi lá đang xem — `key` ở nơi gọi
// (cardId+orientation) buộc component remount mỗi lần đổi lá, kích hoạt lại
// animation từ đầu (Framer chỉ chạy `initial→animate` lúc mount, không phải
// mỗi khi prop đổi). Tổng thời gian chạy CỐ ĐỊNH (~700ms) bất kể đoạn văn
// dài hay ngắn — chia đều cho số từ — để lá mô tả dài (một số bài ~200 từ)
// không kéo dài animation tới vài giây.
//
// Bản hiện có `aria-hidden` (chỉ để xem, tách từ thành nhiều <span> có thể
// làm trình đọc màn hình đọc rời rạc/lặp) + 1 bản sao đầy đủ dạng `sr-only`
// hiện ngay lập tức, không chờ animation — screen reader không phải đợi
// hết hiệu ứng mới nghe được nội dung.
const REVEAL_TOTAL_MS = 700;
const REVEAL_WORD_DURATION_MS = 260;
const REVEAL_MAX_STAGGER_MS = 30;

function RevealText({ text, className }: { text: string; className?: string }) {
  const reducedMotion = !!useReducedMotion();

  if (reducedMotion) {
    return <p className={className}>{text}</p>;
  }

  const chunks = text.split(/(\s+)/);
  const wordCount = chunks.filter((c) => c.trim().length > 0).length;
  const perWordDelayMs = wordCount > 0 ? Math.min(REVEAL_MAX_STAGGER_MS, REVEAL_TOTAL_MS / wordCount) : 0;

  let wordIndex = -1;
  return (
    <>
      <p className={className} aria-hidden="true">
        {chunks.map((chunk, i) => {
          if (!chunk.trim()) return chunk;
          wordIndex++;
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: REVEAL_WORD_DURATION_MS / 1000,
                delay: (wordIndex * perWordDelayMs) / 1000,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{ display: "inline-block" }}
            >
              {chunk}
            </motion.span>
          );
        })}
      </p>
      <p className="sr-only">{text}</p>
    </>
  );
}
