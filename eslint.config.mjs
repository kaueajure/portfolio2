import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
export default defineConfig([
  ...next,
  ...ts,
  globalIgnores([
    "legacy/**",
    ".next/**",
    "node_modules/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
