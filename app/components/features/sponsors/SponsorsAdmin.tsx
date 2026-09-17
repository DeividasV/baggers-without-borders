"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Upload, X, ExternalLink, Image } from "lucide-react";

interface Sponsor {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoPath: string | null;
  url: string | null;
  createdAt: string;
}

const emptyForm = { name: "", description: "", url: "" };

export function SponsorsAdmin() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Logo upload
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null); // id of sponsor being uploaded
  const [deletingLogo, setDeletingLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const activeSponsorForLogo = useRef<string | null>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const res = await fetch("/api/sponsors");
      if (!res.ok) throw new Error("Failed to load sponsors");
      setSponsors(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(sponsor: Sponsor) {
    setEditing(sponsor);
    setForm({
      name: sponsor.name,
      description: sponsor.description ?? "",
      url: sponsor.url ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const url = editing ? `/api/sponsors/${editing.id}` : "/api/sponsors";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error ?? "Save failed");
        return;
      }
      closeModal();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Delete failed");
        return;
      }
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  function triggerLogoUpload(sponsorId: string) {
    activeSponsorForLogo.current = sponsorId;
    logoInputRef.current?.click();
  }

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = activeSponsorForLogo.current;
    if (!file || !id) return;
    e.target.value = "";

    setUploadingLogo(id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/sponsors/${id}/logo`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Logo upload failed");
        return;
      }
      await load();
    } finally {
      setUploadingLogo(null);
    }
  }

  async function handleDeleteLogo(id: string) {
    setDeletingLogo(id);
    try {
      const res = await fetch(`/api/sponsors/${id}/logo`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Logo delete failed");
        return;
      }
      await load();
    } finally {
      setDeletingLogo(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-400">Sponsors</h1>
          <p className="text-gray-400 text-sm mt-1">Manage platform sponsors and donors</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-400 text-dark-950 font-medium rounded-lg text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Sponsor
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hidden file input for logo upload */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoFileChange}
      />

      {loading ? (
        <div className="text-gray-400 text-sm py-12 text-center">Loading…</div>
      ) : sponsors.length === 0 ? (
        <div className="text-gray-500 text-sm py-12 text-center border border-dark-700 rounded-lg">
          No sponsors yet. Add the first one.
        </div>
      ) : (
        <div className="border border-dark-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dark-800 text-gray-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Logo</th>
                <th className="px-4 py-3 text-left">Name / Slug</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Description</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">URL</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {sponsors.map((s) => (
                <tr key={s.id} className="bg-dark-900 hover:bg-dark-800 transition-colors">
                  {/* Logo cell */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {s.logoPath ? (
                        <img
                          src={`/api/uploads/sponsors/${s.id}.webp`}
                          alt={s.name}
                          className="h-8 w-8 object-contain rounded"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-dark-700 rounded flex items-center justify-center">
                          <Image className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => triggerLogoUpload(s.id)}
                          disabled={uploadingLogo === s.id}
                          className="text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50 flex items-center gap-1"
                          title="Upload logo"
                        >
                          <Upload className="h-3 w-3" />
                          {uploadingLogo === s.id ? "…" : "Upload"}
                        </button>
                        {s.logoPath && (
                          <button
                            onClick={() => handleDeleteLogo(s.id)}
                            disabled={deletingLogo === s.id}
                            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 flex items-center gap-1"
                            title="Remove logo"
                          >
                            <X className="h-3 w-3" />
                            {deletingLogo === s.id ? "…" : "Remove"}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Name/slug */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-200">{s.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{s.slug}</div>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3 hidden md:table-cell text-gray-400 max-w-xs truncate">
                    {s.description || <span className="text-gray-600 italic">—</span>}
                  </td>

                  {/* URL */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[160px]">{s.url}</span>
                      </a>
                    ) : (
                      <span className="text-gray-600 italic text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-dark-700 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-dark-700 rounded transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-dark-600 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-primary-400">
                {editing ? "Edit Sponsor" : "Add Sponsor"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="sponsor-name"
                  className="block text-xs text-gray-400 mb-1.5 font-medium"
                >
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="sponsor-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Sponsor name"
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label
                  htmlFor="sponsor-description"
                  className="block text-xs text-gray-400 mb-1.5 font-medium"
                >
                  Description
                </label>
                <textarea
                  id="sponsor-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description (optional)"
                  rows={3}
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="sponsor-url"
                  className="block text-xs text-gray-400 mb-1.5 font-medium"
                >
                  Website URL
                </label>
                <input
                  id="sponsor-url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com (optional)"
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500"
                />
              </div>

              {editing && (
                <p className="text-xs text-gray-500">
                  Logo can be uploaded from the sponsors table after saving.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-dark-950 font-medium rounded-lg text-sm transition-colors"
              >
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Sponsor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
