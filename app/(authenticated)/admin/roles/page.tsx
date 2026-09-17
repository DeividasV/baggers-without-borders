import { Shield, Lock, Users } from "lucide-react";

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
};

async function fetchRoles() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100"}/api/admin/roles`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
}

export default async function RolesPage() {
  const roles = await fetchRoles();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-white">Roles</h1>
        </div>
        <p className="text-gray-300">
          Manage system roles and permissions for users
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-dark-900 border border-dark-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Roles</p>
              <p className="text-2xl font-bold text-white">{roles.length}</p>
            </div>
            <Users className="h-8 w-8 text-primary-500" />
          </div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">System Roles</p>
              <p className="text-2xl font-bold text-white">
                {roles.filter((r: Role) => r.isSystemRole).length}
              </p>
            </div>
            <Lock className="h-8 w-8 text-primary-500" />
          </div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Max Permissions</p>
              <p className="text-2xl font-bold text-white">
                {Math.max(0, ...roles.map((r: Role) => r.permissions.length))}
              </p>
            </div>
            <Shield className="h-8 w-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      {roles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {roles.map((role: Role) => (
            <div
              key={role.id}
              className="bg-dark-900 border border-dark-700 rounded-lg p-6"
            >
              {/* Role Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {role.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {role.description}
                  </p>
                </div>
                {role.isSystemRole && (
                  <span className="inline-block px-2 py-1 bg-primary-900/30 border border-primary-500/30 text-primary-400 text-xs font-medium rounded">
                    System Role
                  </span>
                )}
              </div>

              {/* Permissions List */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Permissions ({role.permissions.length})
                </p>
                <div className="space-y-1">
                  {role.permissions.map((permission: string) => (
                    <div
                      key={permission}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <span className="inline-block w-1.5 h-1.5 bg-primary-500 rounded-full shrink-0" />
                      <span>{permission.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role ID */}
              <div className="mt-6 pt-6 border-t border-dark-700">
                <p className="text-xs text-gray-500">
                  Role ID:{" "}
                  <span className="font-mono text-gray-400">{role.id}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-900 border border-dark-700 rounded-lg p-12 text-center">
          <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No roles found</p>
        </div>
      )}
    </main>
  );
}
