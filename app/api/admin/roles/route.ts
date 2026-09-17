import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

/**
 * GET /api/admin/roles
 * Returns available system roles and their permissions
 * Admin-only endpoint (protected by middleware)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Additional safety check (middleware already validates)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    // Define available system roles and their descriptions
    const roles = [
      {
        id: "USER",
        name: "User",
        description: "Standard user with limited access",
        permissions: [
          "view_own_profile",
          "edit_own_profile",
          "view_hof_tables",
          "submit_hof_data",
        ],
        isSystemRole: true,
      },
      {
        id: "CLERK",
        name: "Clerk",
        description: "Can manage user data and submissions",
        permissions: [
          "view_user_profiles",
          "edit_user_profiles",
          "manage_hof_entries",
          "approve_changes",
          "view_audit_logs",
        ],
        isSystemRole: true,
      },
      {
        id: "ADMIN",
        name: "Administrator",
        description: "Full system access and management",
        permissions: [
          "view_all_profiles",
          "edit_all_profiles",
          "manage_users",
          "manage_roles",
          "manage_hofs",
          "manage_configuration",
          "view_audit_logs",
          "manage_system_settings",
        ],
        isSystemRole: true,
      },
    ];

    return NextResponse.json({ data: roles, total: roles.length });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}
