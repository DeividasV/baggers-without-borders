"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Trash2,
  Star,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { JournalPhotoData, photoUrl } from "@/src/types/journal";
import Modal from "@/app/components/ui/Modal";

interface PhotoUploaderProps {
  journalId: string;
  photos: JournalPhotoData[];
  coverPhotoId: string | null;
  onChange: (photos: JournalPhotoData[], coverPhotoId: string | null) => void;
}

interface EditingPhoto {
  id: string;
  originalName: string;
  title: string;
  caption: string;
  attribution: string;
  setAsCover: boolean;
  isCurrentCover: boolean;
}

export default function PhotoUploader({
  journalId,
  photos,
  coverPhotoId,
  onChange,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JournalPhotoData | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<EditingPhoto | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setUploadError(null);
    setUploading(true);
    const uploaded: JournalPhotoData[] = [];

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("journalId", journalId);

      try {
        const res = await fetch("/api/journal/photos", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setUploadError(err.error ?? "Upload failed");
          setUploading(false);
          return;
        }
        const photo: JournalPhotoData = await res.json();
        uploaded.push(photo);
      } catch {
        setUploadError("Upload failed");
        setUploading(false);
        return;
      }
    }

    const newPhotos = [...photos, ...uploaded];
    const newCover =
      coverPhotoId ?? (newPhotos.length > 0 ? newPhotos[0].id : null);
    onChange(newPhotos, newCover);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/journal/photos/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setDeleteError(err.error ?? "Delete failed");
        return;
      }

      const newPhotos = photos.filter((p) => p.id !== deleteTarget.id);
      const newCover =
        coverPhotoId === deleteTarget.id
          ? (newPhotos[0]?.id ?? null)
          : coverPhotoId;
      onChange(newPhotos, newCover);
      setDeleteTarget(null);
    } catch {
      setDeleteError("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const setCover = async (
    photoId: string,
    nextPhotos: JournalPhotoData[] = photos,
  ) => {
    const previousCover = coverPhotoId;

    // Optimistically update UI (keeping the latest photo metadata)
    onChange(nextPhotos, photoId);

    // Persist immediately so the change isn't lost if the user navigates away without saving
    try {
      const res = await fetch(`/api/journal/${journalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhotoId: photoId }),
      });

      if (!res.ok) {
        // Roll back the optimistic cover selection
        onChange(nextPhotos, previousCover ?? null);
      }
    } catch {
      onChange(nextPhotos, previousCover ?? null);
    }
  };

  const movePhoto = async (index: number, direction: "up" | "down") => {
    const newPhotos = [...photos];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newPhotos.length) return;
    [newPhotos[index], newPhotos[swapIndex]] = [
      newPhotos[swapIndex],
      newPhotos[index],
    ];
    const reordered = newPhotos.map((p, i) => ({ ...p, order: i }));
    onChange(reordered, coverPhotoId);
    await Promise.all([
      fetch(`/api/journal/photos/${reordered[index].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered[index].order }),
      }),
      fetch(`/api/journal/photos/${reordered[swapIndex].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered[swapIndex].order }),
      }),
    ]);
  };

  const markImageError = (photoId: string) => {
    setImageErrors((prev) =>
      prev[photoId] ? prev : { ...prev, [photoId]: true },
    );
  };

  const startEdit = (photo: JournalPhotoData) => {
    setEditError(null);
    const isCover = photo.id === coverPhotoId;
    setEditingPhoto({
      id: photo.id,
      originalName: photo.originalName,
      title: photo.title ?? "",
      caption: photo.caption ?? "",
      attribution: photo.attribution ?? "",
      setAsCover: isCover,
      isCurrentCover: isCover,
    });
  };

  const saveEdit = async () => {
    if (!editingPhoto) return;
    setEditError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/journal/photos/${editingPhoto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingPhoto.title || null,
          caption: editingPhoto.caption || null,
          attribution: editingPhoto.attribution || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setEditError(err.error ?? "Save failed");
        return;
      }

      const updated: JournalPhotoData = await res.json();
      const nextPhotos = photos.map((p) => (p.id === updated.id ? updated : p));
      onChange(nextPhotos, coverPhotoId);

      if (editingPhoto.setAsCover && coverPhotoId !== editingPhoto.id) {
        await setCover(editingPhoto.id, nextPhotos);
      }

      setEditingPhoto(null);
    } catch {
      setEditError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        id="journal-photo-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {uploadError && (
        <div
          role="alert"
          className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2"
        >
          {uploadError}
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo, index) => {
          const isCover = photo.id === coverPhotoId;
          return (
            <div
              key={photo.id}
              className={`relative rounded-lg overflow-hidden border-2 transition-colors flex flex-col ${
                isCover ? "border-primary-500" : "border-dark-700"
              }`}
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-4/3 bg-dark-900 cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => startEdit(photo)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") startEdit(photo);
                }}
                aria-label={`Edit photo: ${photo.title ?? photo.originalName}`}
              >
                {imageErrors[photo.id] ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-500">
                    <Upload className="h-8 w-8 opacity-60" />
                    <span className="text-xs">Preview unavailable</span>
                  </div>
                ) : (
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                  <img
                    src={photoUrl(photo.id)}
                    alt={photo.title ?? photo.originalName}
                    className="w-full h-full object-cover"
                    onError={() => markImageError(photo.id)}
                  />
                )}

                {/* Cover badge */}
                {isCover && (
                  <div className="absolute top-1.5 left-1.5 bg-primary-600 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-white fill-white" />
                    <span className="text-white text-[10px] font-medium">
                      Cover
                    </span>
                  </div>
                )}

                {/* Sort + menu buttons — always visible */}
                <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void movePhoto(index, "up");
                    }}
                    disabled={index === 0}
                    className="p-2 bg-dark-900/80 hover:bg-dark-700 text-gray-300 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                    aria-label="Move photo up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void movePhoto(index, "down");
                    }}
                    disabled={index === photos.length - 1}
                    className="p-2 bg-dark-900/80 hover:bg-dark-700 text-gray-300 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                    aria-label="Move photo down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Info + action row */}
              <div
                className="px-2 py-1.5 bg-dark-900 flex items-start justify-between gap-1 min-h-8 cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => startEdit(photo)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") startEdit(photo);
                }}
                aria-label={`Edit photo details: ${photo.title ?? photo.originalName}`}
              >
                <div className="min-w-0 flex-1">
                  {photo.title && (
                    <p className="text-xs text-gray-200 truncate font-medium">
                      {photo.title}
                    </p>
                  )}
                  {photo.caption && (
                    <p className="text-xs text-gray-500 truncate">
                      {photo.caption}
                    </p>
                  )}
                  {photo.attribution && (
                    <p className="text-[10px] text-gray-600 truncate">
                      © {photo.attribution}
                    </p>
                  )}
                  {!photo.title && !photo.caption && !photo.attribution && (
                    <p className="text-xs text-gray-600 italic truncate">
                      {photo.originalName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Upload placeholder tile (always last) */}
        <button
          type="button"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          aria-label="Upload journal photos"
          className="relative rounded-lg overflow-hidden border-2 border-dashed border-dark-700 hover:border-primary-500 bg-dark-900/40 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900"
        >
          <div className="aspect-4/3 flex flex-col items-center justify-center gap-1.5 p-3">
            <Upload className="h-7 w-7 text-gray-500" />
            <p className="text-sm text-gray-300 font-medium">
              {uploading ? "Uploading…" : "Upload"}
            </p>
            <p className="text-xs text-gray-600 text-center">
              {uploading ? "Please wait" : "Drop or click"}
            </p>
          </div>
          <div className="px-2 py-1.5 bg-dark-900 min-h-8 flex items-center justify-center">
            <p className="text-[10px] text-gray-600">JPEG/PNG/WebP/GIF</p>
          </div>
        </button>
      </div>

      {/* Edit metadata modal */}
      {editingPhoto && (
        <Modal
          isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          title={editingPhoto.title || editingPhoto.originalName}
          size="lg"
        >
          <div className="space-y-4">
            {/* Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <div className="aspect-4/3 overflow-hidden rounded-xl bg-dark-900 border border-dark-700">
                  {imageErrors[editingPhoto.id] ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-500">
                      <Upload className="h-10 w-10 opacity-60" />
                      <span className="text-xs">Preview unavailable</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                    <img
                      src={photoUrl(editingPhoto.id)}
                      alt={editingPhoto.title || editingPhoto.originalName}
                      className="w-full h-full object-cover"
                      onError={() => markImageError(editingPhoto.id)}
                    />
                  )}
                </div>
              </div>

              <div className="md:col-span-1 space-y-4">
                {editError && (
                  <p
                    role="alert"
                    className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2"
                  >
                    {editError}
                  </p>
                )}

                <div>
                  <label
                    htmlFor="journal-photo-title"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Title
                  </label>
                  <input
                    id="journal-photo-title"
                    data-autofocus
                    type="text"
                    value={editingPhoto.title}
                    onChange={(e) =>
                      setEditingPhoto({
                        ...editingPhoto,
                        title: e.target.value,
                      })
                    }
                    placeholder="Photo title"
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="journal-photo-caption"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="journal-photo-caption"
                    value={editingPhoto.caption}
                    onChange={(e) =>
                      setEditingPhoto({
                        ...editingPhoto,
                        caption: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Brief description or caption"
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="journal-photo-attribution"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Attribution / Credit
                  </label>
                  <input
                    id="journal-photo-attribution"
                    type="text"
                    value={editingPhoto.attribution}
                    onChange={(e) =>
                      setEditingPhoto({
                        ...editingPhoto,
                        attribution: e.target.value,
                      })
                    }
                    placeholder="Photographer / source"
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {editingPhoto.isCurrentCover ? (
                    <div className="flex items-center gap-2 text-sm text-primary-400">
                      <Star className="h-4 w-4 fill-primary-400" /> Current
                      cover photo
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 text-sm text-gray-300 select-none">
                      <input
                        type="checkbox"
                        checked={editingPhoto.setAsCover}
                        onChange={(e) =>
                          setEditingPhoto({
                            ...editingPhoto,
                            setAsCover: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-dark-600 bg-dark-900 text-primary-500 focus:ring-primary-500"
                      />
                      Set as cover photo
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingPhoto(null);
                      const photo = photos.find(
                        (p) => p.id === editingPhoto!.id,
                      );
                      if (photo) setDeleteTarget(photo);
                    }}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete photo
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setEditingPhoto(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (deleting) return;
          setDeleteTarget(null);
        }}
        title="Delete photo"
        size="sm"
      >
        <div className="space-y-4">
          {deleteError && (
            <p
              role="alert"
              className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2"
            >
              {deleteError}
            </p>
          )}
          <p className="text-gray-300 text-sm">
            Delete{" "}
            <strong className="text-white">
              {deleteTarget?.title ?? deleteTarget?.originalName}
            </strong>
            ? This cannot be undone.
          </p>
          {deleteTarget?.id === coverPhotoId && (
            <p className="text-yellow-400 text-sm bg-yellow-900/20 border border-yellow-800 rounded-lg px-3 py-2">
              This is the current cover photo. Deleting it will remove the
              cover.
            </p>
          )}
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
              {deleting ? "Deleting..." : "Delete photo"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
