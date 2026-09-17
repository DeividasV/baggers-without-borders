import { LogsManagement } from "@/app/components/features/logs";

export default function AdminLogsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-50 mb-2">Audit Logs</h1>
        <p className="text-dark-300">
          View and filter application security events and admin actions
        </p>
      </div>

      <LogsManagement />
    </div>
  );
}
