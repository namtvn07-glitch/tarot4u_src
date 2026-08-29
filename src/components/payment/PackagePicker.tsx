import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { PACK_IDS, PACKS, type PackId } from "@/lib/orders";

const vndFormatter = new Intl.NumberFormat("vi-VN");

export function PackagePicker({
  disabled,
  pendingPackId,
  onSelect,
}: {
  disabled: boolean;
  pendingPackId: PackId | null;
  onSelect: (packId: PackId) => void;
}) {
  return (
    <div role="group" aria-label="Chọn gói credits" className="grid gap-4 sm:grid-cols-3">
      {PACK_IDS.map((packId, index) => {
        const pack = PACKS[packId];
        const perCredit = Math.round(pack.amountVnd / pack.credits);
        const isPending = pendingPackId === packId;
        // "popular" là gói duy nhất đáng nổi bật — khớp tinh thần "Popular"
        // badge của Pricing Plan gốc, KHÔNG dùng glow làm tín hiệu duy nhất:
        // vẫn giữ badge chữ "Phổ biến nhất" bên dưới.
        const isPopular = packId === "popular";
        return (
          <FadeIn key={packId} delay={index * 0.08} className="h-full">
            <Card
              as="article"
              variant={isPopular ? "highlighted" : "default"}
              className="flex h-full flex-col items-center gap-2 text-center"
            >
              {isPopular && (
                <span className="mb-1 rounded-full bg-accent px-3 py-1 text-caption font-bold text-on-accent uppercase">
                  Phổ biến nhất
                </span>
              )}
              <h3 className="m-0 font-heading text-heading-3 text-text">{pack.label}</h3>
              <p className="m-0 font-heading text-heading-1 text-accent">
                {vndFormatter.format(pack.amountVnd)}đ
              </p>
              <p className="m-0 text-caption text-text-muted">
                {pack.credits} credits · ~{vndFormatter.format(perCredit)}đ/credit
              </p>
              <Button
                className="mt-3 w-full"
                disabled={disabled || pendingPackId !== null}
                onClick={() => onSelect(packId)}
              >
                {isPending ? "Đang tạo đơn…" : "Chọn"}
              </Button>
            </Card>
          </FadeIn>
        );
      })}
    </div>
  );
}
