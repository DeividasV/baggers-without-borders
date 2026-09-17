/**
 * The middleware's role rule.
 *
 * The coverage test in __tests__/security proves a route is matcher-covered or
 * carries some guard; it never inspects the role (FEATURES.md §9 item 2). These
 * tests pin the actual rule so that a mistake in it fails CI.
 */

import {
  isAdminOnlyApi,
  isMemberReadableCollection,
  isUserCollection,
  requiresAdminRole,
} from "@/src/lib/routeAuthz";

describe("requiresAdminRole — admin-only families, every method", () => {
  const paths = [
    "/api/backup",
    "/api/backup/some.zip",
    "/api/backup/password",
    "/api/documents",
    "/api/documents/abc",
    "/api/documents/abc/content",
    "/api/documents/abc/stats",
    "/api/change-requests",
    "/api/change-requests/abc/vote",
    "/api/admin/logs",
    "/api/admin/members/check-email",
    "/admin",
    "/admin/members",
  ];

  it.each(paths)("%s requires ADMIN for GET", (p) => {
    expect(requiresAdminRole(p, "GET")).toBe(true);
  });

  it.each(paths)("%s requires ADMIN for DELETE", (p) => {
    expect(requiresAdminRole(p, "DELETE")).toBe(true);
  });
});

describe("requiresAdminRole — /api/users collection vs sub-paths", () => {
  it("requires ADMIN for the collection, both methods", () => {
    expect(requiresAdminRole("/api/users", "GET")).toBe(true);
    expect(requiresAdminRole("/api/users", "POST")).toBe(true);
  });

  it("leaves sub-paths to the owner-or-admin rule", () => {
    expect(requiresAdminRole("/api/users/abc", "GET")).toBe(false);
    expect(requiresAdminRole("/api/users/abc/consents", "POST")).toBe(false);
  });

  it("leaves accept-consents open to any session", () => {
    expect(requiresAdminRole("/api/users/accept-consents", "POST")).toBe(false);
  });
});

describe("requiresAdminRole — member-readable collections", () => {
  const collections = [
    "/api/hofs",
    "/api/years",
    "/api/consent-types",
    "/api/interests",
    "/api/app-settings",
  ];

  it.each(collections)("%s: collection GET stays a session read", (p) => {
    expect(requiresAdminRole(p, "GET")).toBe(false);
    expect(requiresAdminRole(p, "HEAD")).toBe(false);
  });

  it.each(collections)("%s: collection writes require ADMIN", (p) => {
    expect(requiresAdminRole(p, "POST")).toBe(true);
    expect(requiresAdminRole(p, "PUT")).toBe(true);
    expect(requiresAdminRole(p, "PATCH")).toBe(true);
    expect(requiresAdminRole(p, "DELETE")).toBe(true);
  });

  it("requires ADMIN for sub-path reads, including bulk data operations", () => {
    expect(requiresAdminRole("/api/years/2025", "GET")).toBe(true);
    expect(requiresAdminRole("/api/years/2025/member-data-summary", "GET")).toBe(true);
    expect(requiresAdminRole("/api/years/2025/import-member-data", "POST")).toBe(true);
    expect(requiresAdminRole("/api/hofs/abc", "GET")).toBe(true);
    expect(requiresAdminRole("/api/interests/abc", "GET")).toBe(true);
    expect(requiresAdminRole("/api/consent-types/abc", "GET")).toBe(true);
    expect(requiresAdminRole("/api/app-settings/anything", "GET")).toBe(true);
  });

  it("ignores a trailing slash on the collection", () => {
    expect(requiresAdminRole("/api/hofs/", "GET")).toBe(false);
    expect(requiresAdminRole("/api/hofs/", "POST")).toBe(true);
  });
});

describe("requiresAdminRole — everything else is not role-checked here", () => {
  it.each([
    ["/api/my-bags", "GET"],
    ["/api/my-bags/abc", "PUT"],
    ["/profile", "GET"],
    ["/home", "GET"],
    ["/consent-prompt", "GET"],
    ["/api/hof-tables", "GET"],
    ["/api/journal", "GET"],
    ["/api/countries", "GET"],
  ])("%s %s", (p, m) => {
    expect(requiresAdminRole(p, m)).toBe(false);
  });
});

describe("helpers", () => {
  it("classifies the admin-only families", () => {
    expect(isAdminOnlyApi("/api/backup/password")).toBe(true);
    expect(isAdminOnlyApi("/api/documents/abc/copy")).toBe(true);
    expect(isAdminOnlyApi("/api/hof-entries/abc")).toBe(true);
    expect(isAdminOnlyApi("/api/hofs")).toBe(false);
  });

  it("treats only the exact collection as member-readable", () => {
    expect(isMemberReadableCollection("/api/interests", "GET")).toBe(true);
    expect(isMemberReadableCollection("/api/interests", "POST")).toBe(false);
    expect(isMemberReadableCollection("/api/interests/abc", "GET")).toBe(false);
  });

  it("matches the user collection exactly", () => {
    expect(isUserCollection("/api/users")).toBe(true);
    expect(isUserCollection("/api/users/abc")).toBe(false);
    expect(isUserCollection("/api/users/accept-consents")).toBe(false);
  });
});
