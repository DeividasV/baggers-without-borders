"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Edit, Trash2, BookOpen } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import { JournalCardData } from "@/src/types/journal";

type IssueItem = Pick<
  JournalCardData,
  "id" | "title" | "subtitle" | "publishedAt" | "_count"
>;

interface IssueForm {
  title: string;
  subtitle: string;
  publishedAt: string;
}

const EMPTY_FORM: IssueForm = { title: "", subtitle: "", publishedAt: "" };

export default function IssuesManagement() {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IssueForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IssueItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journal/issues");
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch {
      // network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (issue: IssueItem) => {
    setEditingId(issue.id);
    setForm({
      title: issue.title,
      subtitle: issue.subtitle ?? "",
      publishedAt: issue.publishedAt ? issue.publishedAt.slice(0, 10) : "",
    });
    setError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        publishedAt: form.publishedAt || null,
      };
      const url = editingId
        ? `/api/journal/issues/${editingId}`
        : "/api/journal/issues";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      setShowForm(false);
      fetchIssues();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/journal/issues/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchIssues();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Delete failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          New Issue
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="h-10 w-10 mx-auto text-gray-600" />
          <p className="text-gray-500">No issues yet</p>
        </div>
      ) : (
        <div className="divide-y divide-dark-700 bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-dark-750 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-white text-sm">{issue.title}</p>
                {issue.subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">
                    {issue.subtitle}
                  </p>
                )}
                <div className="flex gap-3 mt-1 text-xs text-gray-600">
                  {issue.publishedAt && (
                    <span>
                      Published:{" "}
                      {new Date(issue.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                  {issue._count !== undefined && (
                    <span>
                      {issue._count.children} article
                      {issue._count.children !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button
                  onClick={() => openEdit(issue)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    setDeleteTarget(issue);
                  }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-red-900/30 hover:bg-red-900/60 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Issue" : "New Issue"}
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="journal-issue-title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Title *
            </label>
            <input
              id="journal-issue-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Issue 1 – Spring 2025"
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="journal-issue-subtitle"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Subtitle
            </label>
            <input
              id="journal-issue-subtitle"
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="Optional subtitle"
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="journal-issue-publishedAt"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Publication date
            </label>
            <input
              id="journal-issue-publishedAt"
              type="date"
              value={form.publishedAt}
              onChange={(e) =>
                setForm({ ...form, publishedAt: e.target.value })
              }
              className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Issue"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Issue"
        size="sm"
      >
        <div className="space-y-4">
          {error && (
            <p
              role="alert"
              className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}
          <p className="text-gray-300 text-sm">
            Delete <strong className="text-white">{deleteTarget?.title}</strong>
            ? Articles in this issue will be unlinked but not deleted.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
