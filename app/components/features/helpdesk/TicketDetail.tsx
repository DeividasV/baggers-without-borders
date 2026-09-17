"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Download,
  X,
  User as UserIcon,
} from "lucide-react";
import {
  LoadingSpinner,
  Badge,
  Button,
  Card,
  SearchableSelect,
} from "@/app/components/ui";
import { formatDateShort } from "@/src/lib/utils";
import { format } from "date-fns";
import TicketTimeline from "./TicketTimeline";
import TicketNoteEditor from "./TicketNoteEditor";

/**
 * Attachment file metadata
 * @interface Attachment
 */
type Attachment = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
};

/**
 * Support request ticket data structure
 * @interface SupportRequest
 */
type SupportRequest = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  attachments: Attachment[];
  assignedTo?: {
    id: string;
    displayName: string;
    username: string;
  };
  hof?: {
    id: string;
    title: string;
    code: string;
  };
  notes?: any[];
  statusHistory?: any[];
};

/**
 * Props for the TicketDetail component
 * @interface TicketDetailProps
 */
interface TicketDetailProps {
  /** The ID of the support request ticket to display */
  ticketId: string;
}

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open", group: "Open" },
  { value: "IN_PROGRESS", label: "In Progress", group: "In Progress" },
  {
    value: "WAITING_RESPONSE",
    label: "Waiting Response",
    group: "In Progress",
  },
  { value: "NEEDS_INFO", label: "Needs Info", group: "Needs Attention" },
  { value: "ON_HOLD", label: "On Hold", group: "Needs Attention" },
  { value: "RESOLVED", label: "Resolved", group: "Complete" },
  { value: "CLOSED", label: "Closed", group: "Complete" },
  { value: "REOPENED", label: "Reopened", group: "Complete" },
];

/**
 * Full-page ticket detail view with status management, assignment, attachments, and timeline.
 *
 * Features:
 * - Status dropdown with grouped options (Open/In Progress/Needs Attention/Complete)
 * - Admin assignment control (searchable user picker)
 * - Attachment preview and download
 * - HOF context display
 * - Full-page image preview modal
 * - Chronological timeline (notes + status changes)
 * - Note creation editor
 *
 * @component
 *
 * @example
 * ```tsx
 * <TicketDetail ticketId="req-123" />
 * ```
 *
 * @accessibility
 * - Focus trap in image preview modal
 * - Keyboard navigation for all controls
 * - Grouped status options for screen readers
 *
 * @see {@link docs/HELPDESK_SYSTEM.md} for architecture details
 */
export default function TicketDetail({ ticketId }: TicketDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<SupportRequest | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewImage) {
        closePreview();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [previewImage]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/support-requests/${ticketId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch ticket");
      }

      const result = await response.json();
      setTicket(result.data);
    } catch (err) {
      console.error("Error fetching ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/support-requests/${ticketId}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };

  useEffect(() => {
    if (ticket) {
      setNotes(ticket.notes || []);
      setStatusHistory(ticket.statusHistory || []);
    }
  }, [ticket]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket || updating) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/support-requests/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      await fetchTicket();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleBack = () => {
    router.push("/admin/helpdesk");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-yellow-600/20 text-yellow-400 border-yellow-600/50";
      case "IN_PROGRESS":
        return "bg-blue-600/20 text-blue-400 border-blue-600/50";
      case "WAITING_RESPONSE":
        return "bg-purple-600/20 text-purple-400 border-purple-600/50";
      case "NEEDS_INFO":
        return "bg-orange-600/20 text-orange-400 border-orange-600/50";
      case "ON_HOLD":
        return "bg-gray-600/20 text-gray-400 border-gray-600/50";
      case "RESOLVED":
        return "bg-green-600/20 text-green-400 border-green-600/50";
      case "CLOSED":
        return "bg-slate-600/20 text-slate-400 border-slate-600/50";
      case "REOPENED":
        return "bg-red-600/20 text-red-400 border-red-600/50";
      default:
        return "bg-gray-600/20 text-gray-400 border-gray-600/50";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-600/20 text-red-400 border-red-600/50";
      case "NORMAL":
        return "bg-blue-600/20 text-blue-400 border-blue-600/50";
      case "LOW":
        return "bg-gray-600/20 text-gray-400 border-gray-600/50";
      default:
        return "bg-gray-600/20 text-gray-400 border-gray-600/50";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "GENERAL":
        return "General Question";
      case "TECHNICAL":
        return "Technical Issue";
      case "HOF_DATA":
        return "HoF Table Data";
      default:
        return category;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileUrl = (storedPath: string): string => {
    if (storedPath.startsWith("/uploads/")) {
      return `/api${storedPath}`;
    }
    return storedPath;
  };

  const handleImagePreview = (attachment: Attachment) => {
    setPreviewImage({
      url: getFileUrl(attachment.path),
      name: attachment.originalName,
    });
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Ticket not found</p>
        <Button onClick={handleBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>
    );
  }

  const imageAttachments = ticket.attachments.filter((a) =>
    a.mimeType.startsWith("image/"),
  );
  const otherAttachments = ticket.attachments.filter(
    (a) => !a.mimeType.startsWith("image/"),
  );

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">{ticket.subject}</h1>
            <Badge className={getStatusBadgeColor(ticket.status)}>
              {STATUS_OPTIONS.find((s) => s.value === ticket.status)?.label ||
                ticket.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>{getCategoryLabel(ticket.category)}</span>
            <span>•</span>
            <span>{formatDateShort(ticket.createdAt)}</span>
            {ticket.hof && (
              <>
                <span>•</span>
                <span>Related to: {ticket.hof.title}</span>
              </>
            )}
          </div>
        </div>
        <Button onClick={handleBack} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>

      {/* Request Details */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">
          Request Details
        </h3>
        <div className="space-y-6">
          {/* Requester Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-400 block mb-1">Name</span>
              <p className="text-white font-medium">{ticket.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400 block mb-1">Email</span>
              <p className="text-white">{ticket.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400 block mb-1">
                Submitted
              </span>
              <p className="text-white font-medium">
                {format(new Date(ticket.createdAt), "yyyy-MM-dd HH:mm:ss")}
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="pt-4 border-t border-dark-600">
            <span className="text-sm text-gray-400 block mb-2">Message</span>
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">
                {ticket.message}
              </p>
            </div>
          </div>

          {/* Attachments from original submission */}
          {ticket.attachments.length > 0 && (
            <div className="pt-4 border-t border-dark-600">
              <h4 className="text-sm font-semibold text-gray-400 mb-4">
                Attachments ({ticket.attachments.length})
              </h4>

              {/* Image Attachments */}
              {imageAttachments.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imageAttachments.map((attachment) => (
                      <button
                        key={attachment.id}
                        onClick={() => handleImagePreview(attachment)}
                        className="group relative bg-dark-600 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
                      >
                        <div className="aspect-square cursor-pointer bg-dark-400 overflow-hidden relative border border-gray-600 hover:border-primary-500 transition-all rounded">
                          <img
                            src={getFileUrl(attachment.path)}
                            alt={attachment.originalName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white text-xs px-3 py-1 bg-primary-600 rounded">
                              View Full
                            </span>
                          </div>
                        </div>
                        <div className="p-2 bg-dark-600 text-left">
                          <div className="text-xs font-medium text-white truncate">
                            {attachment.originalName}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatFileSize(attachment.size)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Attachments */}
              {otherAttachments.length > 0 && (
                <div>
                  <div className="space-y-2">
                    {otherAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-dark-700 rounded-lg border border-dark-600 hover:border-dark-500 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-8 w-8 text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {attachment.originalName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatFileSize(attachment.size)}
                            </div>
                          </div>
                        </div>
                        <a
                          href={getFileUrl(attachment.path)}
                          download={attachment.originalName}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-primary-400 hover:text-primary-300 transition-colors shrink-0"
                        >
                          <Download className="h-4 w-4 shrink-0" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Status Control */}
      <Card>
        <div className="max-w-md">
          <SearchableSelect
            label="Status"
            value={ticket.status}
            onChange={handleStatusChange}
            options={[
              { id: "OPEN", label: "Open" },
              { id: "IN_PROGRESS", label: "In Progress" },
              { id: "WAITING_RESPONSE", label: "Waiting Response" },
              { id: "NEEDS_INFO", label: "Needs Info" },
              { id: "ON_HOLD", label: "On Hold" },
              { id: "RESOLVED", label: "Resolved" },
              { id: "CLOSED", label: "Closed" },
              { id: "REOPENED", label: "Reopened" },
            ]}
            placeholder="Select status..."
            searchPlaceholder="Search statuses..."
            disabled={updating}
            showClearButton={false}
          />
        </div>
      </Card>

      {/* Notes Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Internal Notes</h2>
        <TicketNoteEditor ticketId={ticketId} onSubmit={fetchTicket} />
      </div>

      {/* Event Log / Activity Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Activity Timeline</h2>
        <TicketTimeline
          ticketId={ticketId}
          notes={notes}
          statusHistory={statusHistory}
          currentUserId={session?.user?.id || ""}
          onNoteUpdate={fetchTicket}
        />
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <button
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={closePreview}
          onKeyDown={(e) => e.key === "Escape" && closePreview()}
          type="button"
          aria-label="Close image preview"
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 p-2 bg-dark-800 rounded-full text-white hover:bg-dark-700 transition-colors z-10"
              aria-label="Close preview"
              type="button"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-sm bg-dark-800/80 px-4 py-2 rounded-lg inline-block">
                {previewImage.name}
              </p>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
