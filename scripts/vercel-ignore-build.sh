#!/usr/bin/env bash
# Vercel Ignored Build Step — chỉ build khi commit có gắn tag version.
#
# Quy ước exit code của Vercel NGƯỢC với trực giác:
#   exit 1 = build tiếp
#   exit 0 = huỷ build
#
# KHÔNG dùng `git describe --exact-match --tags HEAD`: Vercel lấy source về
# không kèm tag (clone shallow / tarball), nên mọi lệnh git tag trong môi
# trường này đều trả về rỗng — kết quả là MỌI build đều bị huỷ, kể cả commit
# đã tag đúng. Đã gặp đúng lỗi đó với v1.0.0.
# Vì vậy hỏi thẳng GitHub API, không tin vào bản sao local.

set -u

REPO="namtvn07-glitch/tarot4u_src"
SHA="${VERCEL_GIT_COMMIT_SHA:-}"

echo "commit đang xét : ${SHA:-<trống>}"
echo "tag thấy tại chỗ: [$(git tag 2>/dev/null | tr '\n' ' ')]"

if [ -z "$SHA" ]; then
  echo "=> Không có VERCEL_GIT_COMMIT_SHA. BUILD (không đoán mò)."
  exit 1
fi

# Fail-open: nếu GitHub API hỏng, thà build một commit chưa tag còn hơn im
# lặng không bao giờ deploy được và không ai biết vì sao.
if ! TAGS=$(curl -sf "https://api.github.com/repos/$REPO/tags?per_page=100"); then
  echo "=> Gọi GitHub API thất bại. BUILD cho chắc."
  exit 1
fi

if printf '%s' "$TAGS" | grep -q "\"$SHA\""; then
  echo "=> Commit có tag. BUILD."
  exit 1
fi

echo "=> Commit không có tag. HUỶ."
exit 0
