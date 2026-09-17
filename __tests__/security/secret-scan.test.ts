/**
 * Tests for scripts/security/scan-secrets.js
 *
 * These tests run the real scanner as a child process against throwaway
 * fixture directories, so they verify the actual exit codes and that the
 * scanner never prints a full secret value.
 *
 * IMPORTANT: every credential used below is assembled at runtime. Writing a
 * literal would make this file itself trip the scanner (which is exactly what
 * happened the first time this test was written), and the published tree must
 * pass `npm run security:secrets` cleanly.
 */

import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const SCANNER = path.join(process.cwd(), "scripts", "security", "scan-secrets.js");

/** Assemble a fake credential without leaving a matching literal in this file. */
function fake(...parts: string[]): string {
  return parts.join("");
}

const FAKE_STRIPE_LIVE = fake("sk", "_", "live", "_", "Zq7Wm3Rt9Yb2Kd5Nv8Hs1Lx4Gc6Pa");
const FAKE_TURNSTILE_SECRET = fake("0x4A", "Zq7Wm3Rt9Yb2Kd5Nv8Hs1Lx4Gc6PaTe");
const FAKE_PRIVATE_KEY_HEADER = fake("-----BEGIN ", "RSA PRIVATE KEY-----");

type ScanResult = { status: number; stdout: string; stderr: string };

function makeFixture(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bwb-secret-scan-"));
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), contents, "utf8");
  }
  return dir;
}

function scan(dir: string): ScanResult {
  try {
    const stdout = execFileSync("node", [SCANNER, "--root", dir], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const err = error as {
      status?: number;
      stdout?: string;
      stderr?: string;
    };
    return {
      status: typeof err.status === "number" ? err.status : 1,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
    };
  }
}

const created: string[] = [];

function fixture(files: Record<string, string>): string {
  const dir = makeFixture(files);
  created.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of created) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("secret scanner", () => {
  it("passes on a directory with no secrets", () => {
    const dir = fixture({ "clean.ts": "export const answer = 42;\n" });
    expect(scan(dir).status).toBe(0);
  });

  it("fails on a planted Stripe live secret key", () => {
    const dir = fixture({
      "leak.ts": `const k = "${FAKE_STRIPE_LIVE}";\n`,
    });
    const result = scan(dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Stripe live secret key");
    expect(result.stderr).toContain("leak.ts");
  });

  it("never prints the full secret value", () => {
    const dir = fixture({
      "leak.ts": `const k = "${FAKE_STRIPE_LIVE}";\n`,
    });
    const result = scan(dir);
    expect(result.status).toBe(1);
    expect(result.stderr).not.toContain(FAKE_STRIPE_LIVE);
    expect(result.stderr).toContain("[redacted]");
  });

  it("fails on a planted Turnstile-shaped secret", () => {
    const dir = fixture({
      "cfg.sh": `SECRET_KEY="${FAKE_TURNSTILE_SECRET}"\n`,
    });
    const result = scan(dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Turnstile");
  });

  it("fails on a planted private key block", () => {
    const dir = fixture({
      id_rsa: `${FAKE_PRIVATE_KEY_HEADER}\nMIIabc\n`,
    });
    const result = scan(dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Private key block");
  });

  it("allows Cloudflare public test keys", () => {
    const dir = fixture({
      "test.env": `TURNSTILE_SECRET_KEY=${fake("1x0", "000000000000000000000000000000AA")}\n`,
    });
    expect(scan(dir).status).toBe(0);
  });

  it("allows documentation placeholders", () => {
    const dir = fixture({
      "docs.md": [
        `STRIPE_SECRET_KEY=${fake("sk", "_", "live", "_", "xxxxxxxxxxxxxxxxxxxxxxxx")}`,
        `STRIPE_WEBHOOK_SECRET=${fake("whsec", "_", "xxxxxxxxxxxxxxxxxxxxxxxx")}`,
      ].join("\n"),
    });
    expect(scan(dir).status).toBe(0);
  });

  it("allows the stripe build-time placeholder", () => {
    const dir = fixture({
      "stripe.ts": `const k = process.env.K || "${fake("sk", "_test_", "placeholder_for_build")}";\n`,
    });
    expect(scan(dir).status).toBe(0);
  });
});
