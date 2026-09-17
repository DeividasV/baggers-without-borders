#!/usr/bin/env node

/**
 * Secret scanner for BWB.
 *
 * Runs in two tiers:
 *   Tier 1 - pattern scan of every scanned file. Always runs, needs no secrets.
 *   Tier 2 - cross-reference: every value >= 16 chars from the local .env files
 *            is searched across the scanned tree. This is the check that caught
 *            leaked NEXTAUTH_SECRET / Turnstile / Stripe values in docs.
 *            Skipped cleanly when no .env files exist (e.g. in CI).
 *
 * Usage:
 *   node scripts/security/scan-secrets.js                 # scan the git tree
 *   node scripts/security/scan-secrets.js --root <dir>    # scan a plain directory
 *   node scripts/security/scan-secrets.js --quiet
 *
 * Exit codes: 0 = clean, 1 = findings, 2 = usage/config error.
 *
 * Never prints a full secret value: only the first 4 characters plus length.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const BLUE = "\x1b[0;34m";
const NC = "\x1b[0m";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "coverage",
  "dist",
  "build",
  "out",
  "backups",
  ".swc",
  ".turbo",
  ".vercel",
]);

const BINARY_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".bmp",
  ".avif",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".db",
  ".db-journal",
  ".sqlite",
  ".sqlite3",
  ".ods",
  ".xls",
  ".xlsx",
  ".zip",
  ".gz",
  ".tar",
  ".tgz",
  ".7z",
  ".pdf",
  ".mp4",
  ".mov",
  ".wasm",
]);

const MAX_FILE_BYTES = 2 * 1024 * 1024;

/**
 * Tier 1 patterns. Each has a name, a regex, and the capture group holding the
 * candidate value so we can report a safe prefix instead of the whole match.
 */
const PATTERNS = [
  { name: "Stripe live secret key", re: /\b(sk_live_[A-Za-z0-9]{10,})/g },
  { name: "Stripe test secret key", re: /\b(sk_test_[A-Za-z0-9]{10,})/g },
  { name: "Stripe live publishable key", re: /\b(pk_live_[A-Za-z0-9]{10,})/g },
  { name: "Stripe webhook secret", re: /\b(whsec_[A-Za-z0-9]{20,})/g },
  { name: "Brevo API key", re: /\b(xkeysib-[A-Za-z0-9-]{10,})/g },
  { name: "OpenAI project key", re: /\b(sk-proj-[A-Za-z0-9_-]{10,})/g },
  { name: "AWS access key id", re: /\b(AKIA[0-9A-Z]{12,})/g },
  { name: "GitHub token", re: /\b(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g },
  { name: "Private key block", re: /(-----BEGIN [A-Z ]*PRIVATE KEY-----)/g },
  { name: "Cloudflare Turnstile secret", re: /\b(0x4A[A-Za-z0-9]{31})/g },
  {
    name: "Password in URL",
    re: /\b((?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis|amqp):\/\/[^\s:@/]+:[^\s:@/]+@)/g,
  },
];

/**
 * Tier 1 allowlist. Every entry needs a justification - a scanner that cries
 * wolf gets disabled.
 */
const ALLOWLIST = [
  {
    // Cloudflare publishes these for testing. They always pass and are safe.
    name: "Cloudflare Turnstile public test keys",
    test: (v) => /^(1|2|3)x0{10,}/.test(v),
    reason: "Published by Cloudflare for testing.",
  },
  {
    // Build-time placeholder in src/lib/stripe.ts - not a real credential.
    name: "Stripe build placeholder",
    test: (v) => v.startsWith("sk_test_placeholder"),
    reason: "Literal build-time fallback, not a credential.",
  },
  {
    // Docs conventionally write sk_live_xxxxxxxx to show the shape.
    //
    // This allowlist is ours alone. GitHub's push protection applies its own
    // detectors to the published tree and does NOT consult it, so documentation
    // that spells out a full-length key shape is rejected at push time even
    // though this scanner accepts it. Write placeholders as
    // `STRIPE_SECRET_KEY=<paste the secret key>` instead of
    // `sk_live_xxxxxxxxxxxxxxxx`.
    name: "Documentation placeholder",
    test: (v) =>
      /^(x{6,}|X{6,})$/.test(v.slice(v.indexOf("_", 4) + 1)) || /^(x{6,})/.test(v.split("_").pop()),
    reason: "Placeholder shape in documentation.",
  },
  {
    name: "Explicit placeholder words",
    test: (v) => /REPLACE|YOUR_|_HERE|PLACEHOLDER|CHANGEME|FAKE|EXAMPLE/i.test(v),
    reason: "Contains an explicit placeholder marker.",
  },
  {
    // Values that only occur in the test/development env files and are
    // obviously synthetic (test-secret-key-for-jest-testing-only, test@...).
    name: "Synthetic test/development value",
    test: (v) =>
      /^(test|dev|dummy|sample|fake|placeholder)/i.test(v) ||
      /for[-_]jest[-_]testing/i.test(v) ||
      /@(example\.(com|org|net)|test\.|localhost)/i.test(v),
    reason: "Obvious synthetic test/development value.",
  },
  {
    // Non-secret operational values that legitimately appear in docs.
    name: "Public no-reply address",
    test: (v) => /^no-?reply@/i.test(v),
    reason: "Public no-reply sender address, published deliberately.",
  },
];

/**
 * Tier 2 skips values for these env keys: they are not credentials, or they are
 * public by design (NEXT_PUBLIC_*). DEV_EMAIL_RECIPIENT is deliberately NOT
 * skipped - a personal address there is a real privacy leak.
 */
const TIER2_SKIP_KEYS = new Set([
  "NODE_ENV",
  "PORT",
  "NEXTAUTH_URL",
  "APP_URL",
  "DATABASE_URL",
  "UPLOADS_DIR",
  "BACKUP_DIR",
  "BREVO_SENDER_EMAIL",
  "BREVO_SENDER_NAME",
]);

function shouldSkipTier2Key(key) {
  return TIER2_SKIP_KEYS.has(key) || key.startsWith("NEXT_PUBLIC_");
}

const MAX_OCCURRENCES_PER_VALUE = 5;

function isAllowed(value) {
  return ALLOWLIST.find((entry) => {
    try {
      return entry.test(value);
    } catch {
      return false;
    }
  });
}

function safeShow(value) {
  const prefix = value.slice(0, 4);
  return `"${prefix}..." (len ${value.length})`;
}

function extensionOf(filePath) {
  const base = path.basename(filePath);
  const dot = base.lastIndexOf(".");
  return dot === -1 ? "" : base.slice(dot).toLowerCase();
}

function walkDirectory(root, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkDirectory(full, out);
    } else if (entry.isFile()) {
      if (BINARY_EXT.has(extensionOf(entry.name))) continue;
      out.push(full);
    }
  }
  return out;
}

function listFiles(root) {
  if (root) {
    return walkDirectory(root);
  }
  const tracked = execSync("git ls-files", {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .trim()
    .split("\n")
    .filter(Boolean);
  return tracked
    .filter((f) => !BINARY_EXT.has(extensionOf(f)))
    .map((f) => path.resolve(f))
    .filter((f) => {
      try {
        return fs.statSync(f).isFile();
      } catch {
        return false;
      }
    });
}

function readText(absPath, displayPath) {
  let stat;
  try {
    stat = fs.statSync(absPath);
  } catch {
    return null;
  }
  if (stat.size > MAX_FILE_BYTES) return null;
  try {
    return { text: fs.readFileSync(absPath, "utf8"), display: displayPath };
  } catch {
    return null;
  }
}

function readEnvValues(root) {
  const dir = root || process.cwd();
  const nodeEnv = process.env.NODE_ENV || "development";
  const candidates = [
    ".env",
    ".env.local",
    `.env.${nodeEnv}`,
    `.env.${nodeEnv}.local`,
    ".env.development",
    ".env.production",
    ".env.test",
  ];
  const values = [];
  const seen = new Set();
  for (const rel of candidates) {
    const filePath = path.join(dir, rel);
    let text;
    try {
      text = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      const raw = match[2].trim().replace(/^["']|["']$/g, "");
      // Ignore obvious non-secrets: URLs, paths, booleans, short values.
      if (raw.length < 16) continue;
      if (/^(https?:|file:|\.|\/)/.test(raw)) continue;
      if (/^(true|false|development|production|test|staging)$/i.test(raw)) continue;
      const dedupe = `${rel}:${key}:${raw}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      values.push({ source: rel, key, value: raw });
    }
  }
  return values;
}

function main() {
  const args = process.argv.slice(2);
  const quiet = args.includes("--quiet");
  const rootFlag = args.indexOf("--root");
  const root = rootFlag !== -1 ? path.resolve(args[rootFlag + 1]) : null;

  if (rootFlag !== -1 && !root) {
    console.error("--root requires a directory argument");
    process.exit(2);
  }

  if (!quiet) {
    console.log(`${BLUE}================================${NC}`);
    console.log(`${BLUE}   BWB Secret Scan${NC}`);
    console.log(`${BLUE}================================${NC}`);
    console.log(`Scanning: ${root ? root : "git tracked files"}\n`);
  }

  const findings = [];
  const files = listFiles(root);
  const contents = [];
  for (const abs of files) {
    const display = root ? path.relative(root, abs) : path.relative(process.cwd(), abs);
    const read = readText(abs, display);
    if (read) contents.push({ display, text: read.text });
  }

  // ---- Tier 1: pattern scan -------------------------------------------------
  for (const { display, text } of contents) {
    const lines = text.split("\n");
    for (const { name, re } of PATTERNS) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(text)) !== null) {
        const value = match[1];
        const lineNumber = text.slice(0, match.index).split("\n").length;
        const line = lines[lineNumber - 1] || "";
        // Skip if the whole line is clearly a template/example reference.
        if (/\.env\.example/.test(display)) continue;
        const allow = isAllowed(value);
        if (allow) continue;
        // Never echo a full candidate value, even in the contextual excerpt.
        const redactedExcerpt = line
          .trim()
          .split(value)
          .join(`${value.slice(0, 4)}...[redacted]`)
          .slice(0, 120);
        findings.push({
          tier: 1,
          name,
          file: display,
          line: lineNumber,
          value,
          excerpt: redactedExcerpt,
        });
      }
    }
  }

  // ---- Tier 2: live env value cross-reference -------------------------------
  let envChecked = 0;
  let envSkipped = 0;
  let tier2Skipped = false;
  if (!root) {
    const envValues = readEnvValues(null);
    if (envValues.length === 0) {
      tier2Skipped = true;
    } else {
      for (const { source, key, value } of envValues) {
        if (shouldSkipTier2Key(key) || isAllowed(value)) {
          envSkipped++;
          continue;
        }
        envChecked++;
        let occurrences = 0;
        let truncated = false;
        for (const { display, text } of contents) {
          let index = text.indexOf(value);
          while (index !== -1) {
            if (occurrences >= MAX_OCCURRENCES_PER_VALUE) {
              truncated = true;
              break;
            }
            const lineNumber = text.slice(0, index).split("\n").length;
            findings.push({
              tier: 2,
              name: `Live value from ${source} (${key})`,
              file: display,
              line: lineNumber,
              value,
              excerpt: "",
            });
            occurrences++;
            index = text.indexOf(value, index + 1);
          }
          if (truncated) break;
        }
        if (truncated) {
          findings.push({
            tier: 2,
            name: `Live value from ${source} (${key})`,
            file: "(additional occurrences suppressed)",
            line: 0,
            value,
            excerpt: "",
          });
        }
      }
    }
  }

  // ---- Report ---------------------------------------------------------------
  if (findings.length === 0) {
    if (!quiet) {
      console.log(`${GREEN}✅ No secrets found.${NC}`);
      if (tier2Skipped) {
        console.log(`${YELLOW}   Tier 2 skipped: no .env files present (expected in CI).${NC}`);
      } else if (!root) {
        console.log(`   Tier 1 patterns: ${PATTERNS.length}`);
        console.log(
          `   Tier 2 live values checked: ${envChecked} (${envSkipped} benign/public skipped)`
        );
      }
      console.log(`   Files scanned: ${contents.length}\n`);
    }
    process.exit(0);
  }

  console.error(`${RED}❌ Secret scan failed: ${findings.length} finding(s)${NC}\n`);
  for (const f of findings) {
    console.error(`  ${RED}[Tier ${f.tier}]${NC} ${f.name}`);
    console.error(`      ${f.file}:${f.line}`);
    console.error(`      value: ${safeShow(f.value)}`);
    if (f.excerpt) console.error(`      line:  ${f.excerpt}`);
    console.error("");
  }
  console.error(`${YELLOW}Remediate by removing the value and rotating the credential.${NC}`);
  console.error(`${YELLOW}Never commit a real secret; use .env (gitignored) instead.${NC}\n`);
  process.exit(1);
}

main();
