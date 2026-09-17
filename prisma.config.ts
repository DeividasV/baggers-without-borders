import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// The Prisma CLI runs outside Next.js, so nothing has loaded .env.local for it.
// Load the same cascade as scripts/shared/prisma-client.js, in the same order,
// so the CLI, the Node scripts and the app agree on DATABASE_URL. Values already
// present in process.env always win (override: false).
const nodeEnv = process.env.NODE_ENV || "development";
for (const file of [".env", ".env.local", `.env.${nodeEnv}`, `.env.${nodeEnv}.local`]) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false });
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
});
