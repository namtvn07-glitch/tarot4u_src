#!/usr/bin/env python3
"""So sánh hash nội dung nguồn kế hoạch với lần `/report` trước.

Dùng ở Step 0 của `/report` để biết file nào **phải** đọc lại toàn bộ và file
nào có thể bỏ qua vì nội dung không đổi kể từ lần chạy trước — đây là chi phí
token lớn nhất của lệnh (đọc hết 9-10 file kế hoạch mỗi lần chạy, kể cả khi
chỉ một file đổi).

Theo dõi:
  - Research/plan/*.md (nguồn chính, xem .claude/commands/report.md)
  - Research/tai-lieu-du-an-tarot-tong-hop.md nếu còn tồn tại (nguồn mâu thuẫn)

  (mặc định)  in changed / unchanged / removed, KHÔNG ghi manifest
  --commit    ghi hash hiện tại vào manifest — chạy SAU khi /report đã xử lý
              xong các file "changed" của lượt này
  --reset     xóa manifest — lần /report tiếp theo coi như chạy lần đầu,
              đọc lại toàn bộ (dùng khi nghi ngờ report.md bị lệch nguồn)
"""
import hashlib
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PLAN_DIR = ROOT / "Research" / "plan"
EXTRA_SOURCES = [ROOT / "Research" / "tai-lieu-du-an-tarot-tong-hop.md"]
MANIFEST = ROOT / ".claude" / "state" / "report-sources.json"


def sources():
    files = sorted(PLAN_DIR.glob("*.md")) if PLAN_DIR.exists() else []
    files += [p for p in EXTRA_SOURCES if p.exists()]
    return files


def rel(p: pathlib.Path) -> str:
    return str(p.relative_to(ROOT))


def hash_file(p: pathlib.Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()[:16]


def main() -> int:
    if "--reset" in sys.argv:
        if MANIFEST.exists():
            MANIFEST.unlink()
        print("đã xóa manifest — lần /report tiếp theo đọc lại toàn bộ nguồn kế hoạch")
        return 0

    current = {rel(p): hash_file(p) for p in sources()}
    prev = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}

    if "--commit" in sys.argv:
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(
            json.dumps(current, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        print(f"đã ghi manifest: {len(current)} file — {MANIFEST.relative_to(ROOT)}")
        return 0

    if not prev:
        print("CHƯA CÓ MANIFEST — coi như lần chạy đầu, đọc hết toàn bộ Research/plan/ (Step 1 gốc).")
        print(f"Sau khi /report cập nhật xong design/report.md, chạy:")
        print(f"  python3 .claude/scripts/report-cache.py --commit")
        return 0

    changed = sorted(n for n in current if current.get(n) != prev.get(n))
    unchanged = sorted(n for n in current if n not in changed)
    removed = sorted(n for n in prev if n not in current)

    print(f"changed ({len(changed)}) — PHẢI đọc lại toàn bộ:")
    for n in changed:
        print(f"  · {n}")
    if not changed:
        print("  (không có)")

    print(f"\nunchanged ({len(unchanged)}) — BỎ QUA đọc lại, không đụng vào phần report.md tương ứng:")
    for n in unchanged:
        print(f"  · {n}")
    if not unchanged:
        print("  (không có)")

    if removed:
        print(f"\nđã biến mất khỏi nguồn kế hoạch ({len(removed)}) — mọi nội dung report.md dựa trên file này cần ghi chú lại, không tự xóa:")
        for n in removed:
            print(f"  · {n}")

    print(f"\nSau khi /report cập nhật xong design/report.md cho các file 'changed', chạy:")
    print(f"  python3 .claude/scripts/report-cache.py --commit")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
