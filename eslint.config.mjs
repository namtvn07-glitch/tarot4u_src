// Next 16 đã gỡ `next lint` — lint giờ chạy thẳng qua ESLint CLI với flat
// config (node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md).
// Repo này lên Next 16 mà chưa thêm file nào, nên `npm run lint` chỉ báo
// "Invalid project directory" và gate lint im lặng không kiểm tra gì suốt
// thời gian qua.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    // Mặc định của eslint-config-next, phải nhắc lại vì defineConfig ở đây
    // ghi đè phần ignores của nó.
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Artifact build, không phải nguồn.
    "public/**",
    "scripts/**",
  ]),
]);
