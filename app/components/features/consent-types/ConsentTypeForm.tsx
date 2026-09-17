"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  X,
  Trash2,
  FileText,
  UserPlus,
  Edit,
} from "lucide-react";
import Button from "@/ui/Button";
import DatePicker from "@/ui/DatePicker";
import MarkdownTextarea from "@/ui/MarkdownTextarea";
import MarkdownViewer from "@/ui/MarkdownViewer";
import Switch from "@/ui/Switch";
import ConfirmationDialog from "@/ui/ConfirmationDialog";
import AssignConsentDialog from "./AssignConsentDialog";
import { formatDateYMD } from "@/src/lib/utils";

type ConsentType = {
  id: string;
  title: string;
  description: string;
  internalNotes?: string | null;
  status: string;
  dateIntroduced: string;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  _count: {
    attachments: number;
    userConsents: number;
  };
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

interface ConsentTypeFormProps {
  mode: "create" | "edit" | "view";
  consentTypeId?: string;
}

export default function ConsentTypeForm({
  mode = "create",
  consentTypeId,
}: ConsentTypeFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [existingConsentType, setExistingConsentType] =
    useState<ConsentType | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    internalNotes: "",
    status: "ACTIVE",
    dateIntroduced: new Date().toISOString().split("T")[0],
  });
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const hasInitialized = useRef(false);

  const statusOptions = [
    { value: "ACTIVE", label: "Active", color: "text-green-600" },
    { value: "INACTIVE", label: "Inactive", color: "text-gray-600" },
  ];

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required.";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters.";
    }

    if (!formData.dateIntroduced) {
      newErrors.dateIntroduced = "Date introduced is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mark field as touched
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  useEffect(() => {
    // Only run once on mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (!session) return;
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    if (mode !== "create" && consentTypeId) {
      fetchConsentType(consentTypeId);
    }
  }, []); // Empty dependency array - only run once on mount

  const fetchConsentType = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/consent-types/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExistingConsentType(data);
        setFormData({
          title: data.title,
          description: data.description,
          internalNotes: data.internalNotes || "",
          status: data.status,
          dateIntroduced: new Date(data.dateIntroduced)
            .toISOString()
            .split("T")[0],
        });
      } else {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/consent-types");
      }
    } catch (error) {
      console.error("Error fetching consent type:", error);
      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || "/admin/consent-types");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      setTouched({
        title: true,
        description: true,
        dateIntroduced: true,
      });
      return;
    }

    setLoading(true);

    try {
      const url =
        mode === "create"
          ? "/api/consent-types"
          : `/api/consent-types/${consentTypeId}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newConsentType = await response.json();

        // Handle file uploads
        if (uploadingFiles.length > 0) {
          await uploadFiles(newConsentType.id);
        }

        // Clear errors and show success
        setErrors({});
        setTouched({});
        setShowSuccess(true);

        // Navigate after a brief delay
        setTimeout(() => {
          router.push(`/admin/consent-types/${newConsentType.id}`);
        }, 1000);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving consent type:", error);
      alert("Failed to save consent type");
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = async (id: string) => {
    for (const file of uploadingFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        await fetch(`/api/consent-types/${id}/attachments`, {
          method: "POST",
          body: formData,
        });
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadingFiles((prev) => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/consent-types/${consentTypeId}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        if (existingConsentType) {
          setExistingConsentType({
            ...existingConsentType,
            attachments: existingConsentType.attachments.filter(
              (att) => att.id !== attachmentId
            ),
          });
        }
      } else {
        alert("Failed to delete attachment");
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      alert("Failed to delete attachment");
    }
  };

  const handleDeleteConsentType = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/consent-types/${consentTypeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/consent-types");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting consent type:", error);
      alert("Failed to delete consent type");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-primary-400">Loading page...</div>
      </div>
    );
  }

  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return null;
  }

  if (loading && mode !== "create") {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-primary-400">Loading consent type...</div>
      </div>
    );
  }

  const pageTitle =
    mode === "create"
      ? "Create Consent Type"
      : mode === "edit"
      ? "Edit Consent Type"
      : "View Consent Type";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-400">
              {mode === "view" ? existingConsentType?.title : pageTitle}
            </h2>
            <p className="text-sm text-gray-400">
              {mode === "create" &&
                "Create a new consent type with documentation"}
              {mode === "edit" && "Modify the consent type details"}
              {mode === "view" && "Review the consent type information"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {mode === "view" ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const returnTo = searchParams.get("returnTo");
                    router.push(returnTo || "/admin/consent-types");
                  }}
                >
                  Back to List
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAssignDialog(true)}
                  icon={<UserPlus className="h-4 w-4" />}
                >
                  Assign
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/admin/consent-types/${existingConsentType?.id}/edit`
                    )
                  }
                >
                  Edit
                </Button>
              </>
            ) : mode === "edit" || mode === "create" ? (
              <>
                {mode === "edit" && existingConsentType && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={
                      existingConsentType._count.userConsents > 0 || isDeleting
                    }
                  >
                    Delete
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (mode === "create") {
                      const returnTo = searchParams.get("returnTo");
                      router.push(returnTo || "/admin/consent-types");
                    } else {
                      router.push(
                        `/admin/consent-types/${existingConsentType?.id}`
                      );
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    const form = document.querySelector("form");
                    if (form) {
                      form.dispatchEvent(
                        new Event("submit", { cancelable: true, bubbles: true })
                      );
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {mode === "view" ? (
        <>
          {/* View Mode */}
          <div className="card">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <MarkdownViewer
                  content={existingConsentType?.description || ""}
                />

                {existingConsentType?.internalNotes && (
                  <>
                    <div className="border-t border-dark-600 my-6"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-300 mb-2 block">
                        Internal Notes
                      </div>
                      <div className="bg-dark-600 p-4 rounded-lg">
                        <MarkdownViewer
                          content={existingConsentType.internalNotes}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-300">
                    Status
                  </div>
                  <div className="mt-1">
                    {existingConsentType?.status === "ACTIVE" ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900/30 text-green-400 border border-green-700/30">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-900/30 text-gray-400 border border-gray-700/30">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-300">
                    Date Introduced
                  </div>
                  <div className="text-white mt-1">
                    {existingConsentType?.dateIntroduced &&
                      formatDateYMD(existingConsentType.dateIntroduced)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-300">
                    Users with this Consent
                  </div>
                  <div className="text-white mt-1 text-lg">
                    {existingConsentType?._count.userConsents || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Create/Edit Form
        <>
          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <div className="flex-1">
                  <h3 className="text-green-400 font-semibold">
                    Consent type saved successfully!
                  </h3>
                  <p className="text-sm text-green-300 mt-1">
                    Redirecting to details page...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Error Summary */}
          {Object.keys(errors).length > 0 &&
            Object.keys(touched).length > 0 && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h3 className="text-red-400 font-semibold mb-2">
                      Please fix the following errors:
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
                      {Object.entries(errors).map(([field, message]) => (
                        <li key={field}>
                          <span className="font-medium capitalize">
                            {field}:
                          </span>{" "}
                          {message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Core Information */}
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-6">
                Core Information
              </h3>

              <div className="space-y-6">
                {/* All on one line for large screens, stacked on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Title - 2 columns on large screens */}
                  <div className="lg:col-span-2">
                    <label
                      htmlFor="consent-title"
                      className="block text-sm font-medium text-gray-400 mb-3"
                    >
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="consent-title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (touched.title) {
                          validateForm();
                        }
                      }}
                      onBlur={() => handleBlur("title")}
                      className={`input-field w-full text-lg ${
                        touched.title && errors.title
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                      placeholder="e.g., PR Hall Consent, Privacy Policy Agreement"
                      disabled={loading}
                    />
                    {touched.title && errors.title && (
                      <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                        <span className="text-lg">⚠</span> {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Date Introduced - 1 column */}
                  <div>
                    <DatePicker
                      label="Date Introduced"
                      value={formData.dateIntroduced}
                      onChange={(value) => {
                        setFormData({
                          ...formData,
                          dateIntroduced: value,
                        });
                        if (touched.dateIntroduced) {
                          validateForm();
                        }
                      }}
                      required
                      disabled={loading}
                      error={
                        touched.dateIntroduced
                          ? errors.dateIntroduced
                          : undefined
                      }
                    />
                  </div>

                  {/* Status - 1 column */}
                  <div>
                    <label
                      htmlFor="consent-status"
                      className="block text-sm font-medium text-gray-400 mb-3"
                    >
                      Status
                    </label>
                    <Switch
                      id="consent-status"
                      checked={formData.status === "ACTIVE"}
                      onChange={(checked) =>
                        setFormData({
                          ...formData,
                          status: checked ? "ACTIVE" : "INACTIVE",
                        })
                      }
                      label={
                        formData.status === "ACTIVE" ? "Active" : "Inactive"
                      }
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <MarkdownTextarea
                    label="Description"
                    value={formData.description}
                    onChange={(value) => {
                      setFormData({
                        ...formData,
                        description: value,
                      });
                      if (touched.description) {
                        validateForm();
                      }
                    }}
                    onBlur={() => handleBlur("description")}
                    placeholder="Detailed description of what this consent covers and why it's required"
                    disabled={loading}
                    rows={6}
                    required
                    error={touched.description ? errors.description : undefined}
                  />
                </div>

                <div>
                  <MarkdownTextarea
                    label="Internal Notes / Comments"
                    value={formData.internalNotes}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        internalNotes: value,
                      })
                    }
                    placeholder="Internal notes for admins (not visible to users)"
                    disabled={loading}
                    rows={4}
                    helperText="These notes are only visible to administrators"
                  />
                </div>
              </div>
            </div>

            {/* File Attachments */}
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-6">
                Attachments (PDF, DOC, etc.)
              </h3>

              <div className="space-y-6">
                {/* Existing Attachments */}
                {mode === "edit" &&
                  existingConsentType?.attachments &&
                  existingConsentType.attachments.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-300">
                        Current attachments:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {existingConsentType.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="group relative bg-dark-600 rounded-lg p-4 hover:bg-dark-500 transition-all"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <FileText className="h-10 w-10 text-primary-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                  {attachment.originalName}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {formatFileSize(attachment.size)}
                                </div>
                                <div className="flex space-x-3 mt-2">
                                  <a
                                    href={attachment.path}
                                    download={attachment.originalName}
                                    className="text-xs text-primary-400 hover:text-primary-300"
                                  >
                                    Download
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteAttachment(attachment.id)
                                    }
                                    className="text-xs text-red-400 hover:text-red-300"
                                    disabled={loading}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* File Upload */}
                <div>
                  <div className="border-2 border-dashed border-dark-500 rounded-xl p-8 text-center hover:border-primary-500 transition-all duration-200">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
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
                          Click to upload files or drag and drop
                        </div>
                        <div className="text-sm text-gray-400">
                          Consent forms, documentation, templates
                        </div>
                        <div className="text-xs text-gray-500">
                          PDF, DOC, DOCX, TXT (max 10MB each)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Selected Files */}
                {uploadingFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-300">
                      New files to upload ({uploadingFiles.length}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {uploadingFiles.map((file, index) => (
                        <div
                          key={index}
                          className="group relative bg-dark-600 rounded-lg p-4 hover:bg-dark-500 transition-all"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <FileText className="h-10 w-10 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(index)}
                              className="flex-shrink-0 text-red-400 hover:text-red-300"
                              disabled={loading}
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Warning Message for Deletion */}
          {mode === "edit" && existingConsentType && (
            <div className="card">
              {existingConsentType._count.userConsents > 0 ? (
                <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <h3 className="text-yellow-400 font-semibold mb-1">
                        This consent type is assigned to{" "}
                        {existingConsentType._count.userConsents} user(s)
                      </h3>
                      <p className="text-sm text-yellow-300">
                        It cannot be deleted while in use. You can deactivate it
                        instead.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div className="flex-1">
                      <h3 className="text-blue-400 font-semibold mb-1">
                        This consent type can be deleted
                      </h3>
                      <p className="text-sm text-blue-300">
                        No users have been assigned this consent type yet.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Attachments Section */}
      {mode === "view" &&
        existingConsentType?.attachments &&
        existingConsentType.attachments.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-medium text-white mb-4">
              Attachments ({existingConsentType.attachments.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {existingConsentType.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="group relative bg-dark-600 rounded-lg p-4 hover:bg-dark-500 transition-all"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-10 w-10 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {attachment.originalName}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatFileSize(attachment.size)}
                      </div>
                      <a
                        href={attachment.path}
                        download={attachment.originalName}
                        className="text-xs text-primary-400 hover:text-primary-300 mt-2 inline-block"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Assign Consent Dialog */}
      {mode === "view" && existingConsentType && (
        <AssignConsentDialog
          isOpen={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          consentTypeId={existingConsentType.id}
          consentTypeName={existingConsentType.title}
          onSuccess={() => {
            // Refresh consent type data to update user count
            if (consentTypeId) {
              fetchConsentType(consentTypeId);
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteConsentType}
        title="Delete Consent Type"
        message={`Are you sure you want to delete "${existingConsentType?.title}"?\n\nThis action cannot be undone. All attachments and related data will be permanently removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={<Trash2 className="h-6 w-6 text-red-400" />}
        loading={isDeleting}
      />
    </div>
  );
}
