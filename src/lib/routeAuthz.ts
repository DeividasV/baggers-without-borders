/**
 * Which API paths require the ADMIN role.
 *
 * Extracted from `middleware.ts` so the rule can be unit-tested directly. The
 * existing coverage test in `__tests__/security/api-route-auth-coverage.test.ts`
 * only checks that a route is matcher-covered or carries *some* guard — it never
 * inspects the role (FEATURES.md §9 item 2), so a wrong rule here would pass CI.
 *
 * The rule:
 *   - `/admin`, `/api/admin` and `/api/change-requests` are admin-only.
 *   - `/api/backup`, `/api/documents` and `/api/hof-entries` are admin-only for
 *     every method. None has a member-facing read: the backup family exposes
 *     archives and the archive password, and the other two back admin screens.
 *   - The `/api/users` collection is admin-only. `/api/users/<id>/...` is
 *     handled by the owner-or-admin rule in the middleware, and
 *     `/api/users/accept-consents` stays open to any session.
 *   - `/api/hofs`, `/api/years`, `/api/consent-types`, `/api/interests` and
 *     `/api/app-settings` expose a member-facing *collection* GET (the profile
 *     interest picker, the member consents screen, the contact form and the
 *     funding bar). Everything else — every write, and every `/:id` sub-path —
 *     requires ADMIN.
 */

const ADMIN_ONLY_API = ["/api/backup", "/api/documents", "/api/hof-entries"];

const MEMBER_READABLE_COLLECTION_API = [
  "/api/hofs",
  "/api/years",
  "/api/consent-types",
  "/api/interests",
  "/api/app-settings",
];

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** True for an admin-only family, whatever the method. */
export function isAdminOnlyApi(pathname: string): boolean {
  return ADMIN_ONLY_API.some((prefix) => pathname.startsWith(prefix));
}

/**
 * True when the request is a read of exactly the collection path — not a
 * sub-path — of one of the member-readable families.
 */
export function isMemberReadableCollection(pathname: string, method: string): boolean {
  return (
    READ_METHODS.has(method.toUpperCase()) &&
    MEMBER_READABLE_COLLECTION_API.some(
      (prefix) => pathname === prefix || pathname === `${prefix}/`
    )
  );
}

/** True for `/api/users` itself; sub-paths keep the owner-or-admin rule. */
export function isUserCollection(pathname: string): boolean {
  return pathname === "/api/users" || pathname === "/api/users/";
}

/** The middleware's role rule, as a pure function of path and method. */
export function requiresAdminRole(pathname: string, method: string): boolean {
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return true;
  }
  if (pathname.startsWith("/api/change-requests")) {
    return true;
  }
  if (isAdminOnlyApi(pathname)) {
    return true;
  }
  if (isUserCollection(pathname)) {
    return true;
  }
  if (MEMBER_READABLE_COLLECTION_API.some((p) => pathname.startsWith(p))) {
    return !isMemberReadableCollection(pathname, method);
  }
  return false;
}
