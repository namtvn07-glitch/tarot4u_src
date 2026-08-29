#!/usr/bin/env python3
"""Ráp design/report.md vào template/gdd_template.md → design/index.html.

Hai chế độ:
  (mặc định)  index.html đã có → chỉ thay khối markdown + dấu thời gian,
              giữ nguyên phần vỏ HTML kể cả khi nó đã được chỉnh tay
  --rebuild   dựng lại toàn bộ từ template (xóa mọi chỉnh sửa tay ở phần vỏ)
  --dry-run   in ra sẽ làm gì, không ghi file

Template giữ nguyên; chỉ ba marker được thay:
  GDD_TITLE, GDD_GENERATED_AT, GDD_MARKDOWN

Markdown nằm trong <script type="text/markdown"> nên trình duyệt không thực thi —
ký tự < > ${} ` an toàn. Thứ duy nhất phải chặn là chuỗi đóng thẻ script.
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "template" / "gdd_template.md"
SOURCE = ROOT / "design" / "report.md"
OUTPUT = ROOT / "design" / "index.html"

TITLE = "Web Tarot AI — Báo cáo dự án"

# Template là file dùng chung cho nhiều tài liệu, nên không sửa nó — đổi nhãn ở
# bước ráp. Mỗi cặp bắt buộc phải khớp; lệch một chuỗi là template đã đổi và
# build dừng thay vì im lặng cho ra trang sai nhãn.
REBRAND = [
    (
        "Source of truth: Unity/design/gdd/gdd-sheet/gdd-sheet.md",
        "Source of truth: design/report.md",
    ),
    ("Regenerate via slash command: /publish-gdd", "Regenerate via slash command: /report"),
    ('<span class="brand">♨ GDD Sheet</span>', '<span class="brand">🔮 Tarot Report</span>'),
    ('.hero::after { content: "♨";', '.hero::after { content: "🔮";'),
    (
        'Game Design Document · bản sheet 7 mục · grounded từ code',
        'Báo cáo tiến độ · 10 mục · đối chiếu ngược với repo',
    ),
    (
        '<span class="chip">Self-contained · GitHub Pages</span>',
        '<span class="chip">📁 Nguồn: Research/plan/</span>',
    ),
    (
        "nguồn <code>Unity/design/gdd/gdd-sheet/gdd-sheet.md</code> · regenerate bằng <code>/publish-gdd</code>",
        "nguồn <code>design/report.md</code> · dữ liệu gốc <code>Research/plan/</code> · regenerate bằng <code>/report</code>",
    ),
]

# A11y: template chỉ đặt `title` cho các control và mở sơ đồ bằng click. Bổ sung
# tên cho screen reader + vùng thông báo số kết quả. Không đổi gì về hình ảnh.
A11Y = [
    (
        '<input id="search" type="search" placeholder="Tìm trong tài liệu… (Enter)" autocomplete="off" />',
        '<input id="search" type="search" placeholder="Tìm trong tài liệu… (Enter)"'
        ' aria-label="Tìm trong tài liệu" autocomplete="off" />',
    ),
    (
        '<span id="search-count"></span>',
        '<span id="search-count" role="status" aria-live="polite"></span>',
    ),
    (
        '<button type="button" class="iconbtn" id="s-prev" title="Kết quả trước (Shift+Enter)">↑</button>',
        '<button type="button" class="iconbtn" id="s-prev" title="Kết quả trước (Shift+Enter)"'
        ' aria-label="Kết quả trước">↑</button>',
    ),
    (
        '<button type="button" class="iconbtn" id="s-next" title="Kết quả sau (Enter)">↓</button>',
        '<button type="button" class="iconbtn" id="s-next" title="Kết quả sau (Enter)"'
        ' aria-label="Kết quả sau">↓</button>',
    ),
    (
        '<button type="button" class="iconbtn" id="theme-btn" title="Đổi sáng/tối">🌙</button>',
        '<button type="button" class="iconbtn" id="theme-btn" title="Đổi sáng/tối"'
        ' aria-label="Đổi giao diện sáng/tối">🌙</button>',
    ),
]

# Topbar của template tràn ngang dưới ~560px: brand + ô tìm kiếm + 3 nút cộng lại
# rộng hơn viewport, làm cả trang cuộn ngang ở 375px. Breakpoint 880px của template
# mới chỉ thu ô input xuống 110px, chưa đủ. Bổ sung ở đây thay vì sửa template —
# template còn dùng cho tài liệu khác.
NARROW_CSS = """
  <style>
    /* Vá tràn ngang topbar ở màn hẹp — xem .claude/scripts/build-report.py */
    @media (max-width: 560px) {
      .topbar { gap: 6px; padding: 0 10px; }
      .topbar .brand { font-size: .88rem; overflow: hidden; text-overflow: ellipsis; }
      .search-box { flex: 1 1 auto; min-width: 0; }
      .search-box input { width: 100%; min-width: 0; }
    }
  </style>
"""

# Hai vá chạy sau code của template, không sửa file gốc:
#
# 1. Bàn phím — template chỉ mở sơ đồ toàn màn bằng click.
#
# 2. Render lại sơ đồ khi đổi theme. `renderMermaid()` của template gọi
#    `mermaid.run({querySelector:"pre.mermaid"})` cho nhiều phần tử cùng lúc; ở
#    lần chạy thứ hai mermaid 10.9 gom **mọi** sơ đồ vào phần tử đầu tiên và bỏ
#    trống các phần tử sau (đo được: 22n + 12n → 34n + 0n). Vá này phát hiện
#    trạng thái hỏng đó rồi dựng lại từng sơ đồ một bằng `mermaid.render()`.
ENHANCE_PATCH = """
  <script>
    (function () {
      "use strict";
      var content = document.getElementById("content");
      var busy = false, seq = 0, timer = null;

      function decorate() {
        content.querySelectorAll("pre.mermaid").forEach(function (el, i) {
          if (!el.id) el.id = "mmd-" + i;
          if (el.getAttribute("tabindex") === null) {
            el.setAttribute("tabindex", "0");
            el.setAttribute("role", "button");
            el.setAttribute("aria-label", "Mở sơ đồ toàn màn hình");
          }
          if (el.querySelector("svg") && !el.querySelector(".mm-hint")) {
            var s = document.createElement("small");
            s.className = "mm-hint";
            s.textContent = "⤢ bấm hoặc Enter để xem toàn màn · pan & zoom";
            el.appendChild(s);
          }
        });
      }

      // Hỏng = có sơ đồ không vẽ ra node nào. Chỉ kiểm tra sự tồn tại của <svg>
      // là không đủ: phần tử bị gộp vẫn giữ lại một <svg> rỗng.
      function isBroken() {
        var pres = content.querySelectorAll("pre.mermaid");
        if (!pres.length) return false;
        return Array.prototype.some.call(pres, function (el) {
          return el.querySelectorAll("svg .node, svg .nodeLabel").length === 0;
        });
      }

      function rebuild() {
        if (busy || typeof mermaid === "undefined") return;
        busy = true;
        var dark = document.documentElement.getAttribute("data-theme") === "dark";
        mermaid.initialize({ startOnLoad: false, theme: dark ? "dark" : "default", securityLevel: "loose" });
        var pres = Array.prototype.slice.call(content.querySelectorAll("pre.mermaid"));
        var i = 0;
        (function step() {
          if (i >= pres.length) { busy = false; decorate(); return; }
          var el = pres[i++], src = el.getAttribute("data-src") || "";
          mermaid.render("mmd-svg-" + (seq++), src).then(function (res) {
            el.innerHTML = res.svg;
            step();
          })["catch"](function () { step(); });
        })();
      }

      content.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter" && ev.key !== " ") return;
        var pre = ev.target.closest("pre.mermaid");
        if (!pre) return;
        ev.preventDefault();
        pre.click();
      });

      new MutationObserver(function () {
        if (busy) return;
        clearTimeout(timer);
        timer = setTimeout(function () {
          if (isBroken()) rebuild(); else decorate();
        }, 200);
      }).observe(content, { childList: true, subtree: true });

      decorate();
    })();
  </script>
"""


def generated_at() -> str:
    return subprocess.run(
        ["date", "+%Y-%m-%d %H:%M"], capture_output=True, text=True, check=True
    ).stdout.strip()


MD_OPEN = '<script id="md" type="text/markdown">'
MD_CLOSE = "</script>"
STAMP_RE = re.compile(r'(<span class="chip">📅 )([^<]*)(</span>)')
FOOTER_STAMP_RE = re.compile(r"(<footer class=\"gen-footer\">Generated )([^·]*)( ·)")


def build_from_template(markdown: str, stamp: str) -> str:
    """Dựng trang mới từ template. Chỉ chạy khi index.html chưa có, hoặc --rebuild."""
    html = TEMPLATE.read_text(encoding="utf-8")

    replacements = {
        "<!--GDD_TITLE-->": TITLE,
        "<!--GDD_GENERATED_AT-->": stamp,
        "<!--GDD_MARKDOWN-->": markdown,
    }
    for marker, value in replacements.items():
        if marker not in html:
            raise SystemExit(f"template thiếu marker {marker}")
        html = html.replace(marker, value)

    for old, new in REBRAND + A11Y:
        if old not in html:
            raise SystemExit(f"template đã đổi, không tìm thấy: {old[:70]}…")
        html = html.replace(old, new)

    html = html.replace("</head>", NARROW_CSS + "</head>")
    return html.replace("</body>", ENHANCE_PATCH + "</body>")


def update_in_place(html: str, markdown: str, stamp: str) -> str:
    """Thay đúng khối markdown + dấu thời gian, giữ nguyên phần vỏ HTML.

    Vỏ trang có thể đã được chỉnh tay. Dựng lại từ template sẽ xóa sạch những
    chỉnh sửa đó, nên mặc định chỉ đụng vào hai chỗ này.
    """
    start = html.find(MD_OPEN)
    if start < 0:
        raise SystemExit(f"index.html không có khối {MD_OPEN} — chạy lại với --rebuild")
    body_start = start + len(MD_OPEN)
    end = html.find(MD_CLOSE, body_start)
    if end < 0:
        raise SystemExit("index.html thiếu thẻ đóng của khối markdown — cần --rebuild")

    html = html[:body_start] + markdown + html[end:]
    html = STAMP_RE.sub(lambda m: m.group(1) + stamp + m.group(3), html, count=1)
    html = FOOTER_STAMP_RE.sub(lambda m: m.group(1) + stamp + m.group(3), html, count=1)
    return html


def main() -> int:
    rebuild = "--rebuild" in sys.argv
    dry_run = "--dry-run" in sys.argv

    for path in (TEMPLATE, SOURCE):
        if not path.exists():
            print(f"thiếu file: {path}", file=sys.stderr)
            return 1

    # Chỉ chuỗi này mới thoát được khỏi <script>; mọi ký tự khác vô hại.
    markdown = SOURCE.read_text(encoding="utf-8").replace("</script", "<\\/script")
    stamp = generated_at()

    existing = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
    fresh = rebuild or not existing.strip()

    if fresh:
        html = build_from_template(markdown, stamp)
        mode = "dựng mới từ template" if not rebuild else "dựng lại (--rebuild)"
    else:
        html = update_in_place(existing, markdown, stamp)
        mode = "cập nhật tại chỗ (giữ nguyên vỏ HTML)"

    if html == existing:
        print(f"{OUTPUT.relative_to(ROOT)} không có thay đổi")
        return 0

    if dry_run:
        print(f"[dry-run] sẽ {mode} · {len(html) - len(existing):+d} ký tự")
        return 0

    OUTPUT.write_text(html, encoding="utf-8")
    print(f"đã {mode}: {OUTPUT.relative_to(ROOT)} · nguồn report.md · build {stamp}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
