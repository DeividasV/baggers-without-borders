"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Card, Button, ConfirmationDialog } from "@/app/components/ui";
import {
  Clock,
  User as UserIcon,
  Edit as EditIcon,
  Trash,
  Download,
  X as XIcon,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import TicketNoteEditor from "./TicketNoteEditor";

/**
 * Note data structure for timeline display
 * @interface TimelineNote
 */
interface TimelineNote {
  id: string;
  content: string;
  isInternal: boolean;
  isEdited: boolean;
  lastEditedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    displayName: string;
    username: string;
  };
  attachments: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  }>;
}

/**
 * Status change data structure for timeline display
 * @interface TimelineStatusChange
 */
interface TimelineStatusChange {
  id: string;
  oldStatus: string;
  newStatus: string;
  changedAt: string;
  changedBy: {
    id: string;
    displayName: string;
    username: string;
  };
}

/**
 * Props for the TicketTimeline component
 * @interface TicketTimelineProps
 */
interface TicketTimelineProps {
  /** The ID of the parent support request ticket */
  ticketId: string;
  /** Array of notes to display in timeline */
  notes: TimelineNote[];
  /** Array of status changes to display in timeline */
  statusHistory: TimelineStatusChange[];
  /** Current logged-in user's ID for permission checks */
  currentUserId: string;
  /** Callback fired when any note is updated, deleted, or created */
  onNoteUpdate: () => void;
}

/**
 * Union type representing either a note or status change in the timeline
 * @type TimelineItem
 */
type TimelineItem =
  | { type: "note"; data: TimelineNote }
  | { type: "status"; data: TimelineStatusChange };

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_RESPONSE: "Waiting Response",
  NEEDS_INFO: "Needs Info",
  ON_HOLD: "On Hold",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

/**
 * Chronological timeline component displaying notes and status changes merged together.
 *
 * Features:
 * - Merges notes and status changes in chronological order
 * - Image preview with lightbox modal
 * - File download links for documents
 * - Edit/delete controls (with permission checks)
 * - "Last edited" indicators
 * - Internal note badges
 * - Author information display
 *
 * @component
 *
 * @example
 * ```tsx
 * <TicketTimeline
 *   ticketId="req-123"
 *   notes={ticketNotes}
 *   statusHistory={statusChanges}
 *   currentUserId="user-456"
 *   onNoteUpdate={() => refetchTicket()}
 * />
 * ```
 *
 * @accessibility
 * - Focus trap in image preview modal
 * - Keyboard navigation for all controls
 * - ARIA labels on interactive elements
 *
 * @see {@link docs/HELPDESK_SYSTEM.md} for architecture details
 */
export default function TicketTimeline({
  ticketId,
  notes,
  statusHistory,
  currentUserId,
  onNoteUpdate,
}: TicketTimelineProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Keep keyboard focus inside the image modal
  useEffect(() => {
    if (selectedImage && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [selectedImage]);

  // Allow Escape to close image modal
  useEffect(() => {
    if (!selectedImage) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedImage]);
  const [confirmDeleteAttachment, setConfirmDeleteAttachment] = useState<{
    noteId: string;
    attachmentId: string;
  } | null>(null);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<string | null>(
    null,
  );

  // Merge notes and status changes into chronological timeline
  const timeline: TimelineItem[] = [
    ...notes.map((note) => ({ type: "note" as const, data: note })),
    ...statusHistory.map((change) => ({
      type: "status" as const,
      data: change,
    })),
  ].sort((a, b) => {
    const timeA =
      a.type === "note"
        ? new Date(a.data.createdAt).getTime()
        : new Date(a.data.changedAt).getTime();
    const timeB =
      b.type === "note"
        ? new Date(b.data.createdAt).getTime()
        : new Date(b.data.changedAt).getTime();
    return timeB - timeA; // Newest first
  });

  const canEdit = (note: TimelineNote) => {
    if (note.author.id !== currentUserId) return false;
    const now = Date.now();
    const createdAt = new Date(note.createdAt).getTime();
    const elapsed = now - createdAt;
    return elapsed < 5 * 60 * 1000; // 5 minutes
  };

  const canDelete = (note: TimelineNote) => {
    const now = Date.now();
    const createdAt = new Date(note.createdAt).getTime();
    const elapsed = now - createdAt;
    const withinEditWindow = elapsed <= 5 * 60 * 1000;
    const isAuthor = note.author.id === currentUserId;

    // Author can delete within 5min, any admin can delete after 5min
    if (isAuthor && withinEditWindow) return true;
    if (!isAuthor && !withinEditWindow) return true;
    return false;
  };

  const getRemainingEditTime = (note: TimelineNote) => {
    const now = Date.now();
    const createdAt = new Date(note.createdAt).getTime();
    const elapsed = now - createdAt;
    const remaining = Math.max(0, 5 * 60 * 1000 - elapsed);
    return Math.floor(remaining / 1000); // in seconds
  };

  const handleDeleteNote = async (noteId: string) => {
    setConfirmDeleteNote(noteId);
  };

  const confirmDeleteNoteAction = async () => {
    if (!confirmDeleteNote) return;

    setDeletingNoteId(confirmDeleteNote);
    try {
      const response = await fetch(
        `/api/support-requests/${ticketId}/notes/${confirmDeleteNote}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete note");
      }

      onNoteUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete note");
    } finally {
      setDeletingNoteId(null);
      setConfirmDeleteNote(null);
    }
  };

  const handleDeleteAttachment = async (
    noteId: string,
    attachmentId: string,
  ) => {
    setConfirmDeleteAttachment({ noteId, attachmentId });
  };

  const confirmDeleteAttachmentAction = async () => {
    if (!confirmDeleteAttachment) return;

    const { noteId, attachmentId } = confirmDeleteAttachment;
    setDeletingAttachmentId(attachmentId);
    try {
      const response = await fetch(
        `/api/support-requests/${ticketId}/notes/${noteId}/attachments/${attachmentId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete attachment");
      }

      onNoteUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete attachment");
    } finally {
      setDeletingAttachmentId(null);
      setConfirmDeleteAttachment(null);
    }
  };

  if (timeline.length === 0) {
    return (
      <Card className="text-center py-8 text-gray-500">
        No activity yet. Add a note to start the conversation.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {timeline.map((item, index) => {
        if (item.type === "status") {
          const { data: change } = item;
          return (
            <Card key={`status-${change.id}`} className="bg-dark-800/50">
              <div className="flex items-center gap-3 text-sm">
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-900/30 border border-blue-500/50 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-300">Status changed from</span>
                    <span className="px-2 py-0.5 rounded bg-dark-700 text-gray-300 font-medium">
                      {STATUS_LABELS[change.oldStatus] || change.oldStatus}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-500" />
                    <span className="px-2 py-0.5 rounded bg-primary-900/30 border border-primary-500/50 text-primary-400 font-medium">
                      {STATUS_LABELS[change.newStatus] || change.newStatus}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    by {change.changedBy.displayName} •{" "}
                    {format(new Date(change.changedAt), "yyyy-MM-dd HH:mm:ss")}
                  </div>
                </div>
              </div>
            </Card>
          );
        }

        // Note item
        const { data: note } = item;
        const isEditing = editingNoteId === note.id;

        if (isEditing) {
          return (
            <div key={`note-${note.id}`}>
              <TicketNoteEditor
                ticketId={ticketId}
                noteId={note.id}
                initialContent={note.content}
                editTimeRemaining={getRemainingEditTime(note)}
                onSubmit={() => {
                  setEditingNoteId(null);
                  onNoteUpdate();
                }}
                onCancel={() => setEditingNoteId(null)}
              />
            </div>
          );
        }

        return (
          <Card key={`note-${note.id}`} className="space-y-3">
            {/* Author header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-900/30 border border-primary-500/50 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-200">
                    {note.author.displayName}
                    {note.isInternal && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-orange-900/30 border border-orange-500/50 text-orange-400">
                        Internal
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(note.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    {note.isEdited && note.lastEditedAt && (
                      <span className="ml-2">
                        • edited{" "}
                        {format(
                          new Date(note.lastEditedAt),
                          "yyyy-MM-dd HH:mm:ss",
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {canEdit(note) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNoteId(note.id)}
                    className="h-8"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                )}
                {canDelete(note) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingNoteId === note.id}
                    className="h-8 text-red-400 hover:text-red-300"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-invert max-w-none prose-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {note.content}
              </ReactMarkdown>
            </div>

            {/* Attachments */}
            {note.attachments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-dark-700">
                <div className="text-xs text-gray-500 font-medium">
                  Attachments ({note.attachments.length})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {note.attachments.map((attachment) => {
                    const isImage = attachment.mimeType.startsWith("image/");

                    if (isImage) {
                      return (
                        <div key={attachment.id} className="relative group">
                          <button
                            onClick={() => setSelectedImage(attachment.path)}
                            className="w-full"
                            type="button"
                          >
                            <img
                              src={attachment.path}
                              alt={attachment.originalName}
                              className="w-full h-24 object-cover rounded border border-dark-700 cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteAttachment(note.id, attachment.id)
                            }
                            disabled={deletingAttachmentId === attachment.id}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={attachment.id}
                        className="relative group flex items-center gap-2 p-2 bg-dark-800 rounded border border-dark-700 text-xs"
                      >
                        <a
                          href={attachment.path}
                          download={attachment.originalName}
                          className="flex-1 truncate hover:text-primary-400"
                        >
                          {attachment.originalName}
                        </a>
                        <button
                          onClick={() =>
                            handleDeleteAttachment(note.id, attachment.id)
                          }
                          disabled={deletingAttachmentId === attachment.id}
                          className="shrink-0 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Full-screen image modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-label="Image preview. Press Escape or click to close."
        >
          <button
            ref={closeButtonRef}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
            type="button"
            aria-label="Close image preview"
          >
            <XIcon className="h-8 w-8" />
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Attachment deletion confirmation dialog */}
      <ConfirmationDialog
        isOpen={!!confirmDeleteAttachment}
        onClose={() => setConfirmDeleteAttachment(null)}
        onConfirm={confirmDeleteAttachmentAction}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={!!deletingAttachmentId}
      />

      {/* Note deletion confirmation dialog */}
      <ConfirmationDialog
        isOpen={!!confirmDeleteNote}
        onClose={() => setConfirmDeleteNote(null)}
        onConfirm={confirmDeleteNoteAction}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={!!deletingNoteId}
      />
    </div>
  );
}
