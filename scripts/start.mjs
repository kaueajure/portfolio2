import { cp, access } from "node:fs/promises";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
process.env.NODE_ENV = "production";
loadEnvConfig(process.cwd(), false);
await access(".next/standalone/server.js");
await Promise.all([
  cp("public", ".next/standalone/public", { recursive: true }),
  cp(".next/static", ".next/standalone/.next/static", { recursive: true }),
]);
process.env.HOSTNAME ??= "0.0.0.0";
await import("../.next/standalone/server.js");
