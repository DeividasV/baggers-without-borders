"use client";

import { useState, useEffect } from "react";
import { SITE_NAME } from "@/src/config/site";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  X,
  GitBranch,
  Heart,
  ExternalLink,
  FileCode,
  Calendar,
  Tag,
  FileText,
  Upload,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Button from "@/ui/Button";
import Badge from "@/ui/Badge";

// GitHub repo (owner/name) for commit deep links. Configure
// NEXT_PUBLIC_GITHUB_REPO in your environment; when unset the hash renders as
// plain text instead of a link.
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || "";

import ConfirmationDialog from "@/ui/ConfirmationDialog";
import FormSection from "@/ui/FormSection";
import Input from "@/ui/Input";
import Textarea from "@/ui/Textarea";
import Select from "@/ui/Select";
import TimeInput from "@/ui/TimeInput";
import FileUpload from "@/ui/FileUpload";
import AttachmentGrid from "@/ui/AttachmentGrid";
import {
  formatMinutesToHoursMinutes,
  parseHoursMinutesToMinutes,
  getBadgeVariant,
  getOptionLabel,
} from "@/src/lib/utils";
import {
  CATEGORY_OPTIONS,
  AFFECTED_AREAS_OPTIONS,
  CHANGE_REQUEST_TYPES,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from "@/src/lib/constants";
import {
  getChangeRequestErrorMessage,
  requestChangeRequestJson,
} from "@/src/lib/changeRequestClient";

type ChangeRequest = {
  id: string;
  ticketNumber?: string | null;
  ticketSlug?: string | null;
  title: string;
  description: string;
  type: string;
  priority: string;
  impact: string;
  status: string;
  plannedTime?: number | null;
  actualTime?: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    displayName: string;
    username: string;
  };
  voteSummary?: {
    totalVotes: number;
    averageVote: number | null;
  };
  currentUserVote?: number | null;
  votes?: Array<{
    id: string;
    score: number;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      displayName: string;
      username: string;
    };
  }>;
  attachments: Attachment[];
  // Git sync fields
  commitHash?: string | null;
  commitDate?: string | null;
  version?: string | null;
  category?: string | null;
  linesAdded?: number | null;
  linesDeleted?: number | null;
  filesChanged?: number | null;
  isFromGit?: boolean;
  // Enhanced breakdown fields
  technicalDetails?: string | null;
  businessValue?: string | null;
  affectedAreas?: string | null;
};

type Attachment = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
};

interface ChangeRequestFormProps {
  mode: "create" | "edit" | "view";
  requestId?: string;
}

export default function ChangeForm({ mode = "create", requestId }: ChangeRequestFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = requestId;

  const [loading, setLoading] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(mode !== "create");
  const [existingRequest, setExistingRequest] = useState<ChangeRequest | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "FEATURE",
    priority: "MEDIUM",
    impact: "MEDIUM",
    status: "PENDING",
    plannedTime: "",
    actualTime: "",
    // Enhanced breakdown fields
    businessValue: "",
    affectedAreas: "",
    technicalDetails: "",
  });
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [pastedImageCount, setPastedImageCount] = useState(0);
  const [filePreviewUrls, setFilePreviewUrls] = useState<Map<string, string>>(new Map());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [voteSaving, setVoteSaving] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "error" | "info" | "success";
    message: string;
  } | null>(null);
  const [hoveredLike, setHoveredLike] = useState<number | null>(null);

  const typeOptions = [
    { value: "FEATURE", label: "Feature Request" },
    { value: "BUG", label: "Bug Report" },
    { value: "ENHANCEMENT", label: "Enhancement" },
    { value: "DOCUMENTATION", label: "Documentation" },
    { value: "OTHER", label: "Other" },
  ];

  const priorityOptions = [
    { value: "LOW", label: "Low", color: "text-green-600" },
    { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
    { value: "HIGH", label: "High", color: "text-orange-600" },
    { value: "CRITICAL", label: "Critical", color: "text-red-600" },
  ];

  const impactOptions = [
    { value: "LOW", label: "Low", color: "text-green-600" },
    { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
    { value: "HIGH", label: "High", color: "text-red-600" },
  ];

  const statusOptions = [
    { value: "PENDING", label: "Pending", color: "text-gray-600" },
    { value: "APPROVED", label: "Approved", color: "text-green-600" },
    { value: "REJECTED", label: "Rejected", color: "text-red-600" },
    { value: "IN_PROGRESS", label: "In Progress", color: "text-blue-600" },
    { value: "COMPLETED", label: "Completed", color: "text-purple-600" },
  ];

  const formatDateYmdHm = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const formatAverageVote = (value: number | null | undefined) => {
    if (value == null) {
      return "—";
    }

    return `${value.toFixed(1)}/5`;
  };

  useEffect(() => {
    if (!session) {
      return;
    }

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    if (mode !== "create" && id) {
      fetchChangeRequest(id);
    } else {
      setIsLoadingRequest(false);
    }
  }, [session, mode, id, router]);

  // Handle ESC key to close image preview
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewImage) {
        setPreviewImage(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [previewImage]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      // Revoke all object URLs when component unmounts
      filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviewUrls]);

  const fetchChangeRequest = async (requestId: string) => {
    setPageError(null);
    try {
      setIsLoadingRequest(true);
      const data = await requestChangeRequestJson<ChangeRequest>(
        `/api/change-requests/${requestId}`,
        {},
        {
          retryCount: 1,
          fallbackMessage:
            "Couldn't load this change request. Check your connection and try again, or go back to the change request list.",
        }
      );

      setExistingRequest(data);
      setFormData({
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        impact: data.impact,
        status: data.status,
        plannedTime: data.plannedTime ? formatMinutesToHoursMinutes(data.plannedTime) : "",
        actualTime: data.actualTime ? formatMinutesToHoursMinutes(data.actualTime) : "",
        businessValue: data.businessValue || "",
        affectedAreas: data.affectedAreas || "",
        technicalDetails: data.technicalDetails || "",
      });
    } catch (error) {
      console.error("Error fetching change request:", error);
      setPageError(
        getChangeRequestErrorMessage(
          error,
          "Couldn't load this change request. Check your connection and try again, or go back to the change request list."
        )
      );
    } finally {
      setIsLoadingRequest(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const url = mode === "create" ? "/api/change-requests" : `/api/change-requests/${id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const newRequest = await requestChangeRequestJson<ChangeRequest>(
        url,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            plannedTime: formData.plannedTime
              ? parseHoursMinutesToMinutes(formData.plannedTime)
              : null,
            actualTime: formData.actualTime
              ? parseHoursMinutesToMinutes(formData.actualTime)
              : null,
            businessValue: formData.businessValue || null,
            affectedAreas: formData.affectedAreas || null,
            technicalDetails: formData.technicalDetails || null,
          }),
        },
        {
          fallbackMessage:
            mode === "create"
              ? "Couldn't save this change request. Check your connection and try again."
              : "Couldn't save your changes. Check your connection and try again.",
        }
      );

      if (uploadingFiles.length > 0) {
        const failedFiles = await uploadFiles(newRequest.id);
        if (failedFiles.length > 0) {
          return;
        }
      }

      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || "/admin/changes");
    } catch (error) {
      console.error("Error saving change request:", error);
      setFeedback({
        type: "error",
        message: getChangeRequestErrorMessage(
          error,
          mode === "create"
            ? "Couldn't save this change request. Check your connection and try again."
            : "Couldn't save your changes. Check your connection and try again."
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = async (requestId: string) => {
    const failedFiles: string[] = [];

    for (const file of uploadingFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        await requestChangeRequestJson(
          `/api/change-requests/${requestId}/attachments`,
          {
            method: "POST",
            body: formData,
          },
          {
            fallbackMessage: `Change request saved, but couldn't upload ${file.name}.`,
          }
        );
      } catch (error) {
        console.error("Error uploading file:", error);
        failedFiles.push(file.name);
      }
    }

    if (failedFiles.length > 0) {
      setFeedback({
        type: "info",
        message:
          failedFiles.length === 1
            ? `Change request saved, but ${failedFiles[0]} still needs to be uploaded.`
            : `Change request saved, but ${failedFiles.length} files still need to be uploaded.`,
      });
    }

    return failedFiles;
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    try {
      await requestChangeRequestJson(
        `/api/change-requests/${id}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        },
        {
          fallbackMessage:
            "Couldn't delete this attachment. Try again, or refresh the page to check whether it still exists.",
        }
      );

      if (existingRequest) {
        setExistingRequest({
          ...existingRequest,
          attachments: existingRequest.attachments.filter((att) => att.id !== attachmentId),
        });
      }
      setFeedback({ type: "success", message: "Attachment removed." });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      setFeedback({
        type: "error",
        message: getChangeRequestErrorMessage(
          error,
          "Couldn't delete this attachment. Try again, or refresh the page to check whether it still exists."
        ),
      });
    }
  };

  const handleDeleteRequest = async () => {
    setIsDeleting(true);
    setFeedback(null);
    try {
      await requestChangeRequestJson(
        `/api/change-requests/${id}`,
        {
          method: "DELETE",
        },
        {
          fallbackMessage:
            "Couldn't delete this change request. Try again, or refresh the page to check whether it still exists.",
        }
      );

      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || "/admin/changes");
    } catch (error) {
      console.error("Error deleting change request:", error);
      setFeedback({
        type: "error",
        message: getChangeRequestErrorMessage(
          error,
          "Couldn't delete this change request. Try again, or refresh the page to check whether it still exists."
        ),
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleCopyTicket = async () => {
    const ticketValue = existingRequest?.ticketNumber || existingRequest?.id;
    if (!ticketValue) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(ticketValue);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = ticketValue;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 2000);
    } catch (error) {
      console.error("Failed to copy ticket number:", error);
    }
  };

  const handleVoteChange = async (score: number) => {
    if (!id || !existingRequest) {
      return;
    }

    setVoteSaving(true);
    setVoteError(null);

    try {
      const data = await requestChangeRequestJson<{
        voteSummary: ChangeRequest["voteSummary"];
        votes: NonNullable<ChangeRequest["votes"]>;
        currentUserVote: number | null;
      }>(
        `/api/change-requests/${id}/vote`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ score }),
        },
        {
          fallbackMessage: "Couldn't save your admin like. Try again.",
        }
      );

      setExistingRequest((current) =>
        current
          ? {
              ...current,
              voteSummary: data.voteSummary,
              votes: data.votes,
              currentUserVote: data.currentUserVote,
            }
          : current
      );
    } catch (error) {
      console.error("Error saving vote:", error);
      setVoteError(
        getChangeRequestErrorMessage(error, "Couldn't save your admin like. Try again.")
      );
    } finally {
      setVoteSaving(false);
    }
  };

  // Handle clipboard paste for images
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if the item is an image
      if (item.type.startsWith("image/")) {
        e.preventDefault(); // Prevent default paste behavior for images

        const file = item.getAsFile();
        if (file) {
          // Generate a unique filename with timestamp
          const timestamp = new Date().getTime();
          const extension = file.type.split("/")[1] || "png";
          const newFile = new File(
            [file],
            `pasted-image-${timestamp}-${pastedImageCount + imageFiles.length}.${extension}`,
            { type: file.type }
          );
          imageFiles.push(newFile);
        }
      }
    }

    // Add the pasted images to the uploading files
    if (imageFiles.length > 0) {
      // Create preview URLs first before updating files
      const newPreviewUrls = new Map(filePreviewUrls);
      imageFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        newPreviewUrls.set(file.name, url);
      });

      // Update both states - preview URLs first, then files
      setFilePreviewUrls(newPreviewUrls);
      setUploadingFiles((prev) => [...prev, ...imageFiles]);
      setPastedImageCount((prev) => prev + imageFiles.length);

      // Show a brief notification (optional)
      const count = imageFiles.length;
      const notification = document.createElement("div");
      notification.className =
        "fixed top-20 right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in";
      notification.textContent = `✓ ${count} image${count > 1 ? "s" : ""} added from clipboard`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add("animate-fade-out");
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    }
  };

  // Show loading while session is being fetched
  if (!session) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-primary-400">Loading change request form...</div>
      </div>
    );
  }

  // Redirect if not admin
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return null;
  }

  if (isLoadingRequest && mode !== "create") {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-primary-400">Loading change request...</div>
      </div>
    );
  }

  if (pageError && mode !== "create") {
    return (
      <div className="card border border-red-500/30 bg-red-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                Couldn't load this change request
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-red-100/85">{pageError}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={() => fetchChangeRequest(id || "")}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const returnTo = searchParams.get("returnTo");
                router.push(returnTo || "/admin/changes");
              }}
            >
              Back to list
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pageTitle =
    mode === "create" ? "Add a Change" : mode === "edit" ? "Update This Change" : "View Change";

  const returnTo = searchParams.get("returnTo");

  const getEditHref = () => {
    const routeId = existingRequest?.ticketSlug || existingRequest?.id;
    if (!routeId) {
      return "/admin/changes";
    }

    return returnTo
      ? `/admin/changes/${routeId}/edit?returnTo=${encodeURIComponent(returnTo)}`
      : `/admin/changes/${routeId}/edit`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-400">
              {mode === "view" ? existingRequest?.title : pageTitle}
            </h2>
            {(mode === "view" || mode === "edit") && existingRequest && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Ticket Number with copy */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary-300 font-mono">
                    {existingRequest.ticketNumber || existingRequest.id}
                  </span>
                  <button
                    type="button"
                    aria-label="Copy ticket number"
                    onClick={handleCopyTicket}
                    className="text-gray-500 hover:text-primary-300 transition-colors"
                  >
                    {copiedTicket ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                {/* Badges: Kind, Urgency, Progress */}
                {mode === "view" && (
                  <>
                    <span className="text-gray-500">•</span>
                    <Badge
                      variant={getBadgeVariant(existingRequest.type, "type")}
                      className="text-xs"
                    >
                      {getOptionLabel(existingRequest.type, CHANGE_REQUEST_TYPES)}
                    </Badge>
                    <Badge
                      variant={getBadgeVariant(existingRequest.priority, "priority")}
                      className="text-xs"
                    >
                      {getOptionLabel(existingRequest.priority, PRIORITY_OPTIONS)}
                    </Badge>
                    <Badge
                      variant={getBadgeVariant(existingRequest.status, "status")}
                      className="text-xs"
                    >
                      {getOptionLabel(existingRequest.status, STATUS_OPTIONS)}
                    </Badge>
                    <Badge variant="default" className="text-xs gap-1">
                      <Heart className="h-3 w-3 fill-current" />
                      {existingRequest.voteSummary?.totalVotes ?? 0} likes
                    </Badge>
                    <Badge variant="default" className="text-xs">
                      Avg {formatAverageVote(existingRequest.voteSummary?.averageVote)}
                    </Badge>
                  </>
                )}

                {/* Date info */}
                {mode === "view" && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-xs text-gray-400">
                      {formatDateYmdHm(existingRequest.createdAt)} by{" "}
                      {existingRequest?.createdBy?.displayName || "Unknown"}
                    </span>
                  </>
                )}
              </div>
            )}
            <p className="text-sm text-gray-400">
              {mode === "create" &&
                "Use this form to explain what should change and why it matters."}
              {mode === "edit" && "Update the details below."}
              {mode === "view" && "Review this change request and any supporting notes."}
            </p>
          </div>
          {mode === "view" && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const returnTo = searchParams.get("returnTo");
                  router.push(returnTo || "/admin/changes");
                }}
              >
                Back to list
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.push(getEditHref())}>
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>

      {feedback ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-red-500/30 bg-red-950/20 text-red-100"
              : feedback.type === "success"
                ? "border-green-500/30 bg-green-950/20 text-green-100"
                : "border-yellow-500/30 bg-yellow-900/10 text-yellow-100"
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      ) : null}

      {mode === "view" ? (
        // View Mode
        <>
          {/* Main Content Card */}
          <div className="card">
            <h3 className="text-lg font-medium text-white mb-6">Change Details</h3>

            {/* Description - Full Width */}
            <div className="space-y-6 mb-8">
              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Description
                </div>
                <div className="text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed bg-dark-700/50 p-4 rounded-lg">
                  {existingRequest?.description}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-dark-600">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 text-primary-300 fill-current" />
                      <span>Admin likes</span>
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs gap-1">
                    <Heart className="h-3 w-3 fill-current" />
                    {existingRequest?.voteSummary?.totalVotes ?? 0} likes
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    Avg {formatAverageVote(existingRequest?.voteSummary?.averageVote)}
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    Your like {existingRequest?.currentUserVote ?? "—"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={`inline-flex items-center gap-1 rounded-full border border-dark-600 bg-dark-700 px-3 py-2 ${voteSaving ? "opacity-60" : ""}`}
                    onMouseLeave={() => setHoveredLike(null)}
                  >
                    {[1, 2, 3, 4, 5].map((score) => {
                      const activeScore = hoveredLike ?? existingRequest?.currentUserVote ?? 0;
                      const isActive = score <= activeScore;

                      return (
                        <button
                          key={score}
                          type="button"
                          onMouseEnter={() => setHoveredLike(score)}
                          onFocus={() => setHoveredLike(score)}
                          onBlur={() => setHoveredLike(null)}
                          onClick={() => handleVoteChange(score)}
                          disabled={voteSaving}
                          aria-label={`Set likes to ${score} out of 5`}
                          className={`transition-colors ${voteSaving ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <Heart
                            className={`h-6 w-6 ${
                              isActive
                                ? "text-primary-300 fill-current"
                                : "text-gray-500 hover:text-primary-200"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVoteChange(0)}
                    disabled={voteSaving || existingRequest?.currentUserVote == null}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      voteSaving || existingRequest?.currentUserVote == null
                        ? "bg-dark-700 text-gray-500 border-dark-600 cursor-not-allowed"
                        : "bg-dark-700 text-gray-300 border-dark-600 hover:bg-dark-600"
                    }`}
                  >
                    Clear
                  </button>
                </div>

                {voteError && <p className="text-sm text-red-400">{voteError}</p>}

                <div className="rounded-lg border border-dark-600 bg-dark-700/30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-dark-600 text-sm text-gray-300">
                    Likes by Admin
                  </div>
                  {(existingRequest?.votes?.length ?? 0) > 0 ? (
                    <div className="divide-y divide-dark-600">
                      {existingRequest?.votes?.map((vote) => (
                        <div
                          key={vote.id}
                          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm text-white">{vote.user.displayName}</span>
                            <span className="text-xs text-gray-500">
                              Updated {formatDateYmdHm(vote.updatedAt)}
                            </span>
                          </div>
                          <Badge variant="default" className="text-xs w-fit">
                            {vote.score}/5
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-sm text-gray-500">No admin likes yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Time Info - Compact */}
            {(existingRequest?.plannedTime || existingRequest?.actualTime) && (
              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-dark-600 text-sm">
                {existingRequest?.plannedTime && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Expected:</span>
                    <span className="text-white">
                      {formatMinutesToHoursMinutes(existingRequest.plannedTime)}
                    </span>
                  </div>
                )}
                {existingRequest?.actualTime && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Spent:</span>
                    <span className="text-white">
                      {formatMinutesToHoursMinutes(existingRequest.actualTime)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Site context section - shown for all records that have it */}
          {(existingRequest?.businessValue || existingRequest?.affectedAreas) && (
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">💼 {SITE_NAME} context</h3>

              {existingRequest.businessValue && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">
                    Why This Matters
                  </div>
                  <p className="text-gray-300 leading-relaxed bg-dark-700/50 p-4 rounded-lg">
                    {existingRequest.businessValue}
                  </p>
                </div>
              )}

              {existingRequest.affectedAreas && (
                <div>
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">
                    Where This Helps
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      try {
                        const areas = JSON.parse(existingRequest.affectedAreas);
                        return areas.map((area: string) => {
                          const areaOption = AFFECTED_AREAS_OPTIONS.find((a) => a.value === area);
                          return (
                            <span
                              key={area}
                              className="px-3 py-1.5 bg-primary-900/30 text-primary-300 text-sm rounded-full border border-primary-700/30"
                            >
                              {areaOption?.icon} {areaOption?.label || area}
                            </span>
                          );
                        });
                      } catch {
                        return (
                          <span className="text-gray-400 text-sm">
                            {existingRequest.affectedAreas}
                          </span>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Git Information Section - Only show for git-sourced records */}
          {existingRequest?.isFromGit && (
            <div className="card border border-primary-700/30">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="h-5 w-5 text-primary-400" />
                <h3 className="text-lg font-medium text-white">Imported from Git</h3>
              </div>

              {/* Git Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {existingRequest.commitHash && (
                  <div className="p-3 bg-dark-700/50 rounded-lg">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
                      Commit
                    </div>
                    {GITHUB_REPO ? (
                      <a
                        href={`https://github.com/${GITHUB_REPO}/commit/${existingRequest.commitHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 font-mono text-sm"
                      >
                        {existingRequest.commitHash.substring(0, 7)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-300 font-mono text-sm">
                        {existingRequest.commitHash.substring(0, 7)}
                      </span>
                    )}
                  </div>
                )}

                {existingRequest.commitDate && (
                  <div className="p-3 bg-dark-700/50 rounded-lg">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Date
                    </div>
                    <div className="text-white text-sm">
                      {new Date(existingRequest.commitDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                )}

                {existingRequest.version && (
                  <div className="p-3 bg-dark-700/50 rounded-lg">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
                      <Tag className="h-3 w-3 inline mr-1" />
                      Version
                    </div>
                    <div className="text-white text-sm font-mono">v{existingRequest.version}</div>
                  </div>
                )}

                {existingRequest.category && (
                  <div className="p-3 bg-dark-700/50 rounded-lg">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
                      Category
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        CATEGORY_OPTIONS.find((c) => c.value === existingRequest.category)?.color ||
                        "text-gray-400"
                      }`}
                    >
                      {CATEGORY_OPTIONS.find((c) => c.value === existingRequest.category)?.label ||
                        existingRequest.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Code Stats */}
              {(existingRequest.linesAdded ||
                existingRequest.linesDeleted ||
                existingRequest.filesChanged) && (
                <div className="flex items-center gap-6 p-3 bg-dark-700/50 rounded-lg mb-4">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <FileCode className="h-3 w-3 inline mr-1" />
                    Files Changed:
                  </div>
                  <div className="flex gap-4 text-sm">
                    {existingRequest.filesChanged != null && (
                      <span className="text-white">
                        <span className="text-gray-400">Files:</span> {existingRequest.filesChanged}
                      </span>
                    )}
                    {existingRequest.linesAdded != null && (
                      <span className="text-green-400">+{existingRequest.linesAdded}</span>
                    )}
                    {existingRequest.linesDeleted != null && (
                      <span className="text-red-400">-{existingRequest.linesDeleted}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Extra Notes */}
              {existingRequest.technicalDetails && (
                <div>
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">
                    🔧 Extra Notes
                  </div>
                  <code className="block bg-dark-900 text-gray-300 text-xs p-3 rounded-lg font-mono whitespace-pre-wrap border border-dark-600">
                    {existingRequest.technicalDetails}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Attachments Section */}
          {existingRequest?.attachments && existingRequest.attachments.length > 0 && (
            <FormSection title={`Attachments (${existingRequest.attachments.length})`}>
              <AttachmentGrid
                attachments={existingRequest.attachments}
                onPreviewClick={(url, name) => setPreviewImage({ url, name })}
                editable={false}
              />
            </FormSection>
          )}
        </>
      ) : (
        // Create/Edit Form
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <FormSection
            title="About This Change"
            description="Give this change a short name and explain it in plain language"
          >
            <div className="space-y-6">
              <Input
                type="text"
                label="Short Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                onPaste={handlePaste as any}
                placeholder="A short title that tells people what is changing"
                required
                disabled={loading}
              />

              <Textarea
                label="What should change?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                onPaste={handlePaste}
                rows={8}
                maxLength={3000}
                showCharCount
                className="min-h-64"
                placeholder="Describe the change in plain language. You can include:&#10;• What is not working or what should be improved&#10;• Who this helps&#10;• What a good outcome looks like&#10;• Any useful background details&#10;&#10;Tip: You can paste screenshots directly here"
                required
                disabled={loading}
                helperText={
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      A clear explanation helps volunteers pick this up faster
                    </div>
                    <div className="shrink-0 bg-primary-900/30 text-primary-300 px-2 py-1 rounded border border-primary-700/30">
                      📋 Paste screenshots here
                    </div>
                  </div>
                }
              />
            </div>
          </FormSection>

          {/* Classification Section */}
          <FormSection title="Type, Urgency & Progress">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Select
                label="Change Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={typeOptions}
                required
                disabled={loading}
              />

              <Select
                label="Urgency"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={priorityOptions}
                required
                disabled={loading}
              />

              <Select
                label="Reach"
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                options={impactOptions}
                required
                disabled={loading}
              />

              {mode === "edit" && (
                <Select
                  label="Progress"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={statusOptions}
                  required
                  disabled={loading}
                />
              )}
            </div>
          </FormSection>

          {/* Time Tracking Section */}
          <FormSection title="Time">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TimeInput
                label="Expected Time"
                value={formData.plannedTime}
                onChange={(value) => setFormData({ ...formData, plannedTime: value })}
                disabled={loading}
              />

              <TimeInput
                label="Time Spent"
                value={formData.actualTime}
                onChange={(value) => setFormData({ ...formData, actualTime: value })}
                placeholder="e.g., 2h 30m or 150"
                helperText="Use hours and minutes, or just total minutes"
                disabled={loading}
              />
            </div>
          </FormSection>

          {/* Site context section */}
          <FormSection
            title={`${SITE_NAME} context`}
            description="Optional notes about who this helps and anything useful to know"
          >
            <div className="space-y-6">
              <Textarea
                label="Why This Matters"
                value={formData.businessValue}
                onChange={(e) => setFormData({ ...formData, businessValue: e.target.value })}
                rows={4}
                maxLength={600}
                showCharCount
                className="min-h-36"
                placeholder={`How does this help ${SITE_NAME}, members, volunteers, or partner organisations? For example: 'Saves admin time' or 'Makes it easier for members to find results'`}
                disabled={loading}
              />

              <Textarea
                label="Extra Notes"
                value={formData.technicalDetails}
                onChange={(e) => setFormData({ ...formData, technicalDetails: e.target.value })}
                rows={4}
                maxLength={1200}
                showCharCount
                className="min-h-40"
                placeholder="Anything else that would help the next person understand this change"
                disabled={loading}
              />

              <Input
                type="text"
                label="Where This Helps"
                value={formData.affectedAreas}
                onChange={(e) => setFormData({ ...formData, affectedAreas: e.target.value })}
                placeholder="Examples: member sign-up, hall of fame tables, admin pages"
                disabled={loading}
                helperText="You can list one or more areas, separated by commas"
              />
            </div>
          </FormSection>

          {/* File Upload Section */}
          <FormSection title="Files & Screenshots">
            <div className="space-y-6">
              {/* Combined Attachments Grid - Existing + New */}
              {((existingRequest?.attachments?.length ?? 0) > 0 || uploadingFiles.length > 0) && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-300">
                    {mode === "edit" && existingRequest?.attachments?.length
                      ? `Attachments (${existingRequest.attachments.length}${
                          uploadingFiles.length > 0 ? ` + ${uploadingFiles.length} new` : ""
                        }):`
                      : uploadingFiles.length > 0
                        ? `Files to upload (${uploadingFiles.length}):`
                        : ""}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Existing Attachments */}
                    {mode === "edit" &&
                      existingRequest?.attachments?.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="group relative bg-dark-600 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
                        >
                          {attachment.mimeType.startsWith("image/") ? (
                            <div
                              className="aspect-square cursor-pointer bg-dark-400 overflow-hidden relative group border border-gray-600 hover:border-primary-500 transition-all rounded"
                              onClick={() =>
                                setPreviewImage({
                                  url: `/api${attachment.path}`,
                                  name: attachment.originalName,
                                })
                              }
                            >
                              <img
                                src={`/api${attachment.path}`}
                                alt={attachment.originalName}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 text-white text-xs px-3 py-1 bg-primary-600 rounded">
                                  View Full
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-square flex flex-col items-center justify-center p-3 bg-dark-500">
                              <FileText className="h-8 w-8 text-primary-400 mb-2" />
                              <div className="text-xs text-gray-400 text-center truncate w-full px-2">
                                {attachment.mimeType.includes("pdf")
                                  ? "PDF"
                                  : attachment.mimeType.includes("word")
                                    ? "DOC"
                                    : attachment.mimeType.includes("text")
                                      ? "TXT"
                                      : "FILE"}
                              </div>
                            </div>
                          )}
                          <div className="p-2 bg-dark-600">
                            <div className="text-xs font-medium text-white truncate">
                              {attachment.originalName}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </div>
                            <div className="flex space-x-2 mt-1">
                              <a
                                href={`/api${attachment.path}`}
                                download={attachment.originalName}
                                className="text-xs text-primary-400 hover:text-primary-300"
                              >
                                Download
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                className="text-xs text-red-400 hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* New Files to Upload - with NEW badge */}
                    {uploadingFiles.map((file, index) => (
                      <div
                        key={`new-${index}-${file.name}`}
                        className="group relative bg-dark-600 rounded-lg overflow-hidden ring-2 ring-green-500/50 hover:ring-green-500 transition-all"
                      >
                        {/* NEW Badge */}
                        <div className="absolute top-2 left-2 z-20 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          NEW
                        </div>
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = uploadingFiles.filter((_, i) => i !== index);
                            setUploadingFiles(newFiles);
                          }}
                          className="absolute top-2 right-2 z-20 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove file"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </button>

                        {file.type.startsWith("image/") ? (
                          <div
                            className="aspect-square cursor-pointer bg-dark-400 overflow-hidden relative"
                            onClick={() => {
                              const url = filePreviewUrls.get(file.name);
                              if (url) {
                                setPreviewImage({ url, name: file.name });
                              }
                            }}
                          >
                            {filePreviewUrls.has(file.name) ? (
                              <img
                                src={filePreviewUrls.get(file.name)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onLoad={() => console.log("Image loaded:", file.name)}
                                onError={(e) => {
                                  console.error(
                                    "Image failed to load:",
                                    file.name,
                                    filePreviewUrls.get(file.name)
                                  );
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xs text-gray-400">Loading...</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 text-white text-xs px-3 py-1 bg-primary-600 rounded">
                                View Full
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-square flex flex-col items-center justify-center p-3 bg-dark-500">
                            <FileText className="h-8 w-8 text-primary-400 mb-2" />
                            <div className="text-xs text-gray-400 text-center truncate w-full px-2">
                              {file.type.includes("pdf")
                                ? "PDF"
                                : file.type.includes("word")
                                  ? "DOC"
                                  : file.type.includes("text")
                                    ? "TXT"
                                    : "FILE"}
                            </div>
                          </div>
                        )}
                        <div className="p-2 bg-dark-600">
                          <div className="text-xs font-medium text-white truncate">{file.name}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {(file.size / 1024).toFixed(1)} KB
                          </div>
                          <div className="text-xs text-green-400 mt-1">Pending upload</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload Drop Zone */}
              <div className="border-2 border-dashed border-dark-500 rounded-xl p-8 text-center hover:border-primary-500 transition-all duration-200">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files);
                      // Create preview URLs first
                      const newPreviewUrls = new Map(filePreviewUrls);
                      newFiles.forEach((file) => {
                        if (file.type.startsWith("image/")) {
                          const url = URL.createObjectURL(file);
                          newPreviewUrls.set(file.name, url);
                        }
                      });
                      setFilePreviewUrls(newPreviewUrls);
                      setUploadingFiles((prev) => [...prev, ...newFiles]);
                    }
                  }}
                  className="hidden"
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  id="file-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-4"
                >
                  <div className="p-4 bg-dark-600 rounded-full">
                    <Upload className="h-12 w-12 text-primary-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-medium text-gray-300">
                      Add files here or drag them in
                    </div>
                    <div className="text-sm text-gray-400">
                      Screenshots, documents, or anything else that helps explain the change
                    </div>
                    <div className="text-xs text-gray-500">
                      Images, PDF, TXT, DOC, DOCX (max 10MB each)
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </FormSection>

          {/* Action Buttons Section */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-400">
                {mode === "edit" && "Save your updates or go back without changing anything"}
                {mode === "create" && "Save this change or go back"}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {mode === "edit" && existingRequest && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (mode === "create") {
                      const returnTo = searchParams.get("returnTo");
                      router.push(returnTo || "/admin/changes");
                    } else {
                      router.push(`/admin/changes/${existingRequest?.id}`);
                    }
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Change"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-all"
            title="Close (ESC)"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="max-w-7xl max-h-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-white text-center bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              <div className="font-medium">{previewImage.name}</div>
              <div className="text-xs text-gray-300 mt-1">Click outside or press ESC to close</div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteRequest}
        title="Delete This Change"
        message={`Are you sure you want to delete "${existingRequest?.title}"?\n\nThis cannot be undone. Any files linked to this change will also be removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={<Trash2 className="h-6 w-6 text-red-400" />}
        loading={isDeleting}
      />
    </div>
  );
}
