"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, CheckCircle, X } from "lucide-react";
import SearchableSelect from "@/ui/SearchableSelect";

interface AdminUser {
  id: string;
  displayName: string;
  username: string;
}

interface JournalSettings {
  journal_editor_ids: string | null;
}

interface Props {
  adminUsers: AdminUser[];
}

export default function JournalSettingsSection({ adminUsers }: Props) {
  const [settings, setSettings] = useState<JournalSettings>({
    journal_editor_ids: null,
  });
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Parsed editor IDs
  const editorIds: string[] = (() => {
    try {
      return settings.journal_editor_ids
        ? JSON.parse(settings.journal_editor_ids)
        : [];
    } catch {
      return [];
    }
  })();

  const selectedEditors = adminUsers.filter((u) => editorIds.includes(u.id));

  const availableAdminsToAdd = adminUsers
    .filter((u) => !editorIds.includes(u.id))
    .map((u) => ({
      id: u.id,
      label: u.displayName,
      subtitle: `@${u.username}`,
    }));

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journal/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          journal_editor_ids: data?.settings?.journal_editor_ids ?? null,
        });
      }
    } catch {
      // network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSetting = async (key: string, value: string) => {
    const res = await fetch("/api/journal/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error("Failed to save");
  };

  const toggleEditor = async (userId: string) => {
    const newIds = editorIds.includes(userId)
      ? editorIds.filter((id) => id !== userId)
      : [...editorIds, userId];
    setSaving(true);
    setMessage(null);
    try {
      await saveSetting("journal_editor_ids", JSON.stringify(newIds));
      setSettings((s) => ({
        ...s,
        journal_editor_ids: JSON.stringify(newIds),
      }));
      setMessage({ type: "success", text: "Editors updated" });
    } catch {
      setMessage({ type: "error", text: "Failed to update editors" });
    } finally {
      setSaving(false);
    }
  };

  const addEditor = async (userId: string) => {
    if (!userId) return;
    if (editorIds.includes(userId)) return;
    await toggleEditor(userId);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading journal settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 ${
            message.type === "success"
              ? "bg-green-900/20 border border-green-800 text-green-300"
              : "bg-red-900/20 border border-red-800 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {selectedEditors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedEditors.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleEditor(user.id)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-xs bg-primary-900/40 text-primary-300 border border-primary-800 px-2 py-1 rounded-full hover:bg-primary-900/60 transition-colors disabled:opacity-50"
                aria-label={`Remove ${user.displayName} as editor`}
                title="Click to remove editor"
              >
                {user.displayName}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        )}

        {adminUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No admin users found.</p>
        ) : (
          <div className="max-w-xl">
            <SearchableSelect
              label="Add editor"
              value={selectedAdminId}
              onChange={async (id) => {
                setSelectedAdminId("");
                await addEditor(id);
              }}
              options={availableAdminsToAdd}
              placeholder={
                availableAdminsToAdd.length === 0
                  ? "All admins are already editors"
                  : "Select an admin…"
              }
              searchPlaceholder="Search admins…"
              disabled={saving || availableAdminsToAdd.length === 0}
              showClearButton={false}
            />
            <p className="text-xs text-gray-600 mt-1">
              Editors can approve and publish Journal articles. Only ADMIN users
              can be editors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
