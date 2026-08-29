"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "confirming" | "deleting" | "error";

export function DeleteReadingButton({
  readingId,
  label,
}: {
  readingId: string;
  label: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  async function handleConfirm() {
    setStatus("deleting");
    const res = await fetch(`/api/readings/${readingId}`, { method: "DELETE" });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    router.refresh();
  }

  if (status === "confirming" || status === "deleting") {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={status === "deleting"}
          aria-label={`Xác nhận xoá ${label}`}
        >
          {status === "deleting" ? "Đang xoá…" : "Xác nhận"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStatus("idle")}
          disabled={status === "deleting"}
        >
          Huỷ
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        aria-label={`Xoá ${label}`}
        onClick={() => setStatus("confirming")}
      >
        🗑
      </Button>
      {status === "error" && (
        <span role="alert" className="text-body-sm text-danger">
          Không xoá được, thử lại.
        </span>
      )}
    </div>
  );
}
