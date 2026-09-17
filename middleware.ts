import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { requiresAdminRole } from "@/src/lib/routeAuthz";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // The role rule lives in src/lib/routeAuthz.ts so that it can be unit-tested:
    // the coverage test in __tests__/security only checks that a route is
    // matcher-covered or carries some guard, never that the role is right.
    // See __tests__/unit/routeAuthz.test.ts and IMPLEMENTATION.md §6.3.
    if (requiresAdminRole(path, req.method)) {
      if (token?.role !== "ADMIN") {
        if (path.startsWith("/api/")) {
          // API routes return 403 JSON
          return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }
        // UI routes redirect to home
        return NextResponse.redirect(new URL("/home", req.url));
      }
    }

    // User-specific API routes - allow user to access their own data or admin
    // Exclude accept-consents which is a general endpoint for any authenticated user
    if (path.match(/^\/api\/users\/[^/]+/) && !path.startsWith("/api/users/accept-consents")) {
      const userId = path.split("/")[3];
      const isOwner = token?.sub === userId;
      const isAdmin = token?.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden - Access denied" }, { status: 403 });
      }
    }

    // My-bags routes - must be authenticated
    if (path.startsWith("/my-bags") || path.startsWith("/api/my-bags")) {
      if (!token?.sub) {
        if (path.startsWith("/api/")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    // Admin routes
    "/admin/:path*",
    "/api/admin/:path*",

    // Admin API routes (requires role check, not just auth)
    "/api/users/:path*",
    "/api/backup/:path*",
    "/api/consent-types/:path*",
    "/api/interests/:path*",
    "/api/hofs/:path*",
    "/api/years/:path*",
    "/api/hof-entries/:path*",
    "/api/change-requests/:path*",
    // Note: /api/support-requests is excluded from matcher to allow public POST
    "/api/app-settings/:path*",
    "/api/documents/:path*",

    // User routes
    "/my-bags/:path*",
    "/api/my-bags/:path*",
    "/profile/:path*",

    // Authenticated routes
    "/home",
    "/home/:path*",
    "/consent-prompt",
  ],
};
