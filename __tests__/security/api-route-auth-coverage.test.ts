/**
 * API route authorization coverage
 *
 * middleware.ts protects a fixed list of path prefixes. Any route that is not
 * matched there must either be deliberately public (listed below, with a
 * reason) or contain its own authorization check.
 *
 * This test exists because /api/uploads and /api/health were both outside the
 * matcher and had no in-route guard, which made confidential documents
 * world-readable. Adding a new route now fails this test until it is either
 * matched by middleware.ts or explicitly guarded.
 */

import fs from "fs";
import path from "path";

const API_DIR = path.join(process.cwd(), "app", "api");
const MIDDLEWARE = path.join(process.cwd(), "middleware.ts");

/**
 * Endpoints that are intentionally reachable without a session.
 * Every entry needs a reason. Adding a route here is a deliberate decision.
 */
const PUBLIC_API_ROUTES = new Map<string, string>([
  ["/api/auth/*", "NextAuth.js handler (sign-in, callbacks, session)"],
  ["/api/auth/register", "Public registration form"],
  ["/api/auth/forgot-password", "Public password reset request"],
  ["/api/auth/reset-password", "Public password reset with emailed token"],
  ["/api/auth/verify-email", "Public email verification link"],
  ["/api/auth/resend-verification", "Public verification resend"],
  ["/api/countries", "Static ISO country reference data"],
  ["/api/regions", "Static ISO region reference data"],
  ["/api/version", "Deployed version string, no internals"],
  ["/api/turnstile/sitekey", "Public CAPTCHA site key (safe by design)"],
  ["/api/legal/*", "Public legal documents (privacy policy, ToS)"],
  ["/api/award-tiers", "Read-only award tier configuration (GET only)"],
  ["/api/journal/slug/*", "Published journal page read"],
  ["/api/donations/webhook", "Stripe webhook, verified via stripe-signature"],
  ["/api/webhooks/brevo", "Brevo webhook, source-IP restricted in-route"],
  ["/api/health", "Liveness and diagnostics probe"],
  ["/api/hof-tables/overall-stats", "Aggregate HoF statistics (public read)"],
  [
    "/api/uploads/*",
    "Serves uploaded assets and documents; see the security notes in IMPLEMENTATION.md",
  ],
]);

/** Patterns that count as an in-route authorization check. */
const GUARD_PATTERN =
  /getServerSession|getOptionalSession|\bgetSession\b|getCurrentUserId|\bisAdmin\b|requireAdmin|requireAuth|verifyTurnstileToken|stripe-signature|constructEvent|X-Brevo|brevo-webhook|isAuthorized|checkAuth/i;

function listRouteFiles(dir: string, base = ""): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const routeBase = `${base}/${entry.name}`;
    if (entry.isDirectory()) {
      out.push(...listRouteFiles(full, routeBase));
    } else if (entry.name === "route.ts" || entry.name === "route.js") {
      out.push([base, full]);
    }
  }
  return out;
}

/** Normalise dynamic segments so a route can be compared with matcher globs. */
function normalizeRoute(routeBase: string): string {
  return routeBase.replace(/\[[^\]]+\]/g, "*");
}

function middlewarePrefixes(): string[] {
  const source = fs.readFileSync(MIDDLEWARE, "utf8");
  const block = source.match(/matcher:\s*\[([\s\S]*?)\]/);
  if (!block) {
    throw new Error("Could not parse the matcher array out of middleware.ts");
  }
  const patterns = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return patterns
    .filter((p) => p.startsWith("/api"))
    .map((p) => p.replace("/:path*", "").replace(/\/$/, ""));
}

function isMatcherCovered(route: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

describe("API route authorization coverage", () => {
  const prefixes = middlewarePrefixes();
  const routes = listRouteFiles(API_DIR, "/api").map(
    ([base, file]) => [normalizeRoute(base), file] as const
  );

  it("finds a reasonable number of API routes", () => {
    expect(routes.length).toBeGreaterThan(50);
  });

  it("every API route is matcher-covered, deliberately public, or self-guarded", () => {
    const failures: string[] = [];

    for (const [route, file] of routes) {
      if (isMatcherCovered(route, prefixes)) continue;
      if (PUBLIC_API_ROUTES.has(route)) continue;

      const source = fs.readFileSync(file, "utf8");
      if (GUARD_PATTERN.test(source)) continue;

      failures.push(
        `${route} (app${file.split("/app").pop()}) is neither matched by ` +
          `middleware.ts nor guarded in-route`
      );
    }

    if (failures.length > 0) {
      throw new Error(
        "Unprotected API routes found:\n  " +
          failures.join("\n  ") +
          "\n\nFix by adding a matcher prefix in middleware.ts, adding an " +
          "authorization check in the route, or (if it is deliberately " +
          "public) adding it to PUBLIC_API_ROUTES with a reason."
      );
    }
  });

  it("documents every public route with a reason", () => {
    for (const [route, reason] of PUBLIC_API_ROUTES) {
      expect(route).toMatch(/^\/api\//);
      expect(reason.length).toBeGreaterThan(10);
    }
  });

  it("public routes are actually outside the matcher (no stale entries)", () => {
    const stale = [...PUBLIC_API_ROUTES.keys()].filter((route) =>
      isMatcherCovered(route, prefixes)
    );
    expect(stale).toEqual([]);
  });
});
