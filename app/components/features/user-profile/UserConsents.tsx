"use client";

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  Fragment,
  useRef,
} from "react";
import {
  Calendar,
  FileText,
  Upload,
  X,
  Download,
  Trash2,
  Check,
  AlertCircle,
  FileImage,
  File,
  MessageSquare,
  Info,
  Plus,
} from "lucide-react";
import Button from "@/ui/Button";
import DatePicker from "@/ui/DatePicker";
import MarkdownTextarea from "@/ui/MarkdownTextarea";
import MarkdownViewer from "@/ui/MarkdownViewer";
import Switch from "@/ui/Switch";
import ConfirmationDialog from "@/ui/ConfirmationDialog";
import { formatDateYMD, formatDateTime } from "@/src/lib/utils";

interface ConsentType {
  id: string;
  title: string;
  description: string;
  status: string;
  dateIntroduced: string;
}

interface UserConsentAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

interface UserConsent {
  id: string;
  userId: string;
  consentTypeId: string;
  dateGiven: string | null;
  consentMethod: string | null;
  note: string | null;
  isRequired: boolean;
  consentType: ConsentType;
  attachments: UserConsentAttachment[];
}

interface UserConsentsProps {
  userId: string;
  isEditing: boolean;
}

export interface UserConsentsRef {
  saveConsents: () => Promise<boolean>;
}

const CONSENT_METHODS = [
  { value: "WEB", label: "Web Form" },
  { value: "EMAIL", label: "Email" },
  { value: "PAPER", label: "Paper Document" },
  { value: "OTHER", label: "Other" },
];

const UserConsents = forwardRef<UserConsentsRef, UserConsentsProps>(
  ({ userId, isEditing }, ref) => {
    const [consents, setConsents] = useState<UserConsent[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingFor, setUploadingFor] = useState<string | null>(null);
    const [savingAll, setSavingAll] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
      isOpen: boolean;
      consentId: string | null;
      attachmentId: string | null;
    }>({ isOpen: false, consentId: null, attachmentId: null });
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
    const [editingConsent, setEditingConsent] = useState<string | null>(null);
    const [availableConsentTypes, setAvailableConsentTypes] = useState<
      ConsentType[]
    >([]);
    const [showAddConsentDialog, setShowAddConsentDialog] = useState(false);
    const [selectedConsentTypeToAdd, setSelectedConsentTypeToAdd] =
      useState<string>("");
    const [addingConsent, setAddingConsent] = useState(false);
    const hasInitializedConsents = useRef(false);

    // Expose saveConsents method to parent component via ref
    useImperativeHandle(ref, () => ({
      saveConsents: handleSaveAllConsents,
    }));

    useEffect(() => {
      fetchConsents();
    }, [userId]);

    useEffect(() => {
      if (isEditing) {
        fetchAvailableConsentTypes();
      }
    }, [isEditing, consents]);

    const fetchConsents = async () => {
      // Prevent duplicate fetches for the same userId
      if (hasInitializedConsents.current) return;
      hasInitializedConsents.current = true;

      try {
        const response = await fetch(`/api/users/${userId}/consents`);
        if (response.ok) {
          const data = await response.json();
          // Sort consents by dateIntroduced, newest first
          const sortedConsents = (data.consents || []).sort(
            (a: UserConsent, b: UserConsent) => {
              const dateA = new Date(a.consentType.dateIntroduced).getTime();
              const dateB = new Date(b.consentType.dateIntroduced).getTime();
              return dateB - dateA; // Newest first
            }
          );
          setConsents(sortedConsents);
        }
      } catch (error) {
        console.error("Error fetching consents:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAvailableConsentTypes = async () => {
      try {
        // Fetch all active consent types
        const response = await fetch("/api/consent-types");
        if (response.ok) {
          const data = await response.json();
          const allConsentTypes = data.consentTypes || [];

          // Filter out consent types that are already mapped to this user
          const mappedConsentTypeIds = new Set(
            consents.map((c) => c.consentTypeId)
          );

          const available = allConsentTypes.filter(
            (ct: ConsentType) =>
              ct.status === "ACTIVE" && !mappedConsentTypeIds.has(ct.id)
          );

          setAvailableConsentTypes(available);
        }
      } catch (error) {
        console.error("Error fetching available consent types:", error);
      }
    };

    const handleAddConsent = async () => {
      if (!selectedConsentTypeToAdd) return;

      setAddingConsent(true);
      try {
        const response = await fetch(`/api/users/${userId}/consents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consentTypeId: selectedConsentTypeToAdd,
          }),
        });

        if (response.ok) {
          await fetchConsents();
          setShowAddConsentDialog(false);
          setSelectedConsentTypeToAdd("");
        } else {
          const error = await response.json();
          alert(error.error || "Failed to add consent");
        }
      } catch (error) {
        console.error("Error adding consent:", error);
        alert("Failed to add consent");
      } finally {
        setAddingConsent(false);
      }
    };

    const handleConsentChange = async (
      consentId: string,
      field: string,
      value: any
    ) => {
      // Update local state immediately
      setConsents((prev) =>
        prev.map((c) => (c.id === consentId ? { ...c, [field]: value } : c))
      );
    };

    const handleSaveAllConsents = async (): Promise<boolean> => {
      setSavingAll(true);
      try {
        // Save all consents in parallel
        const savePromises = consents.map((consent) =>
          fetch(`/api/users/${userId}/consents/${consent.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dateGiven: consent.dateGiven,
              consentMethod: consent.consentMethod,
              note: consent.note,
              isRequired: consent.isRequired,
            }),
          })
        );

        const responses = await Promise.all(savePromises);
        const allSuccessful = responses.every((r) => r.ok);

        if (allSuccessful) {
          // Refresh consents from server to get latest data
          await fetchConsents();
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error("Error saving consents:", error);
        return false;
      } finally {
        setSavingAll(false);
      }
    };

    const handleFileUpload = async (
      consentId: string,
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF and image files are allowed");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      setUploadingFor(consentId);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `/api/users/${userId}/consents/${consentId}/attachments`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (response.ok) {
          await fetchConsents(); // Refresh to show new attachment
          event.target.value = ""; // Reset file input
        } else {
          const error = await response.json();
          alert(error.error || "Failed to upload file");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload file");
      } finally {
        setUploadingFor(null);
      }
    };

    const handleDeleteAttachment = async () => {
      if (!deleteConfirmation.consentId || !deleteConfirmation.attachmentId) {
        return;
      }

      try {
        const response = await fetch(
          `/api/users/${userId}/consents/${deleteConfirmation.consentId}/attachments/${deleteConfirmation.attachmentId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          await fetchConsents(); // Refresh to remove attachment
          setDeleteConfirmation({
            isOpen: false,
            consentId: null,
            attachmentId: null,
          });
        } else {
          alert("Failed to delete attachment");
        }
      } catch (error) {
        console.error("Error deleting attachment:", error);
        alert("Failed to delete attachment");
      }
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const getFileIcon = (mimeType: string) => {
      if (mimeType.startsWith("image/")) {
        return <FileImage className="h-4 w-4" />;
      }
      return <File className="h-4 w-4" />;
    };

    const toggleNoteExpansion = (consentId: string) => {
      setExpandedNotes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(consentId)) {
          newSet.delete(consentId);
        } else {
          newSet.add(consentId);
        }
        return newSet;
      });
    };

    const truncateText = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400">Loading consents...</div>
        </div>
      );
    }

    if (consents.length === 0) {
      return (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-100">
              Privacy Consents
            </h3>
            {isEditing && availableConsentTypes.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddConsentDialog(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Add Consent Type
              </Button>
            )}
          </div>
          <div className="text-center py-8 text-gray-400">
            No consent records found for this user.
          </div>
        </div>
      );
    }

    // Both view and edit modes use the same tabular display
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">
            Privacy Consents
          </h3>
          {isEditing && availableConsentTypes.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddConsentDialog(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Add Consent Type
            </Button>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-400">
                  Title
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-400">
                  Date
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-400">
                  Method
                </th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-400">
                  Required
                </th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-400">
                  Files
                </th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-400">
                  Notes
                </th>
                {isEditing && (
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {consents.map((consent) => (
                <Fragment key={consent.id}>
                  {editingConsent === consent.id ? (
                    // Edit Form Row
                    <tr className="border-b border-dark-700 bg-dark-800">
                      <td colSpan={isEditing ? 7 : 6} className="p-6">
                        <div className="space-y-4">
                          {/* Title Header */}
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-semibold text-gray-100">
                              {consent.consentType.title}
                            </h4>
                            <button
                              onClick={() => setEditingConsent(null)}
                              className="text-gray-400 hover:text-gray-300 transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Date Given, Consent Method, Required Switch */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <DatePicker
                              label="Date Given"
                              value={consent.dateGiven || ""}
                              onChange={(value) =>
                                handleConsentChange(
                                  consent.id,
                                  "dateGiven",
                                  value
                                )
                              }
                              placeholder="Select date consent was given"
                            />

                            <div className="space-y-2">
                              <label
                                htmlFor={`consent-method-mobile-${consent.id}`}
                                className="block text-sm font-medium text-gray-400"
                              >
                                Consent Method
                              </label>
                              <select
                                id={`consent-method-mobile-${consent.id}`}
                                value={consent.consentMethod || ""}
                                onChange={(e) =>
                                  handleConsentChange(
                                    consent.id,
                                    "consentMethod",
                                    e.target.value || null
                                  )
                                }
                                className={`w-full px-4 py-2 bg-[#1a1a1a] border border-[#4f4f4f] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                                  consent.consentMethod
                                    ? "text-gray-100"
                                    : "text-gray-500"
                                }`}
                              >
                                <option value="" className="text-gray-500">
                                  Select method
                                </option>
                                {CONSENT_METHODS.map((method) => (
                                  <option
                                    key={method.value}
                                    value={method.value}
                                    className="text-gray-100"
                                  >
                                    {method.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <div className="block text-sm font-medium text-gray-400">
                                Required
                              </div>
                              <div className="pt-1">
                                <Switch
                                  id={`required-${consent.id}`}
                                  checked={consent.isRequired}
                                  onChange={(checked) =>
                                    handleConsentChange(
                                      consent.id,
                                      "isRequired",
                                      checked
                                    )
                                  }
                                  label="Required for user"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Note */}
                          <div className="space-y-1">
                            <MarkdownTextarea
                              label="Note"
                              value={consent.note || ""}
                              onChange={(value) =>
                                handleConsentChange(
                                  consent.id,
                                  "note",
                                  value || null
                                )
                              }
                              placeholder="Add any additional notes about this consent..."
                              maxLength={2000}
                              rows={3}
                              helperText="Supports Markdown formatting."
                            />
                          </div>

                          {/* Attachments List */}
                          {consent.attachments.length > 0 && (
                            <div className="space-y-2">
                              <div className="block text-sm font-medium text-gray-400">
                                Uploaded Files
                              </div>
                              <div className="space-y-2">
                                {consent.attachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center justify-between gap-2 p-2 bg-dark-800 rounded border border-dark-600"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {getFileIcon(attachment.mimeType)}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-300 truncate">
                                          {attachment.originalName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {formatFileSize(attachment.size)} •{" "}
                                          {formatDateTime(attachment.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <a
                                        href={attachment.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-primary-400 transition-colors"
                                        title="View/Download"
                                      >
                                        <Download className="h-5 w-5" />
                                      </a>
                                      <button
                                        onClick={() =>
                                          setDeleteConfirmation({
                                            isOpen: true,
                                            consentId: consent.id,
                                            attachmentId: attachment.id,
                                          })
                                        }
                                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Upload Button */}
                          <div className="flex justify-end">
                            <label
                              className={`flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 border border-primary-500 rounded-lg text-white transition-colors cursor-pointer ${
                                uploadingFor === consent.id
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">
                                {uploadingFor === consent.id
                                  ? "Uploading..."
                                  : "Upload File"}
                              </span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) =>
                                  handleFileUpload(consent.id, e)
                                }
                                disabled={uploadingFor === consent.id}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Preview Row
                    <tr
                      key={consent.id}
                      className={`border-b border-dark-700 transition-colors ${
                        isEditing
                          ? "hover:bg-dark-800 cursor-pointer"
                          : "hover:bg-dark-800"
                      }`}
                      onClick={() => isEditing && setEditingConsent(consent.id)}
                    >
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="font-medium text-white">
                            {truncateText(consent.consentType.title, 40)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-300">
                          {consent.dateGiven ? (
                            formatDateYMD(consent.dateGiven)
                          ) : (
                            <span className="text-gray-500 italic">
                              Not provided
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-300">
                          {consent.consentMethod ? (
                            CONSENT_METHODS.find(
                              (m) => m.value === consent.consentMethod
                            )?.label || consent.consentMethod
                          ) : (
                            <span className="text-gray-500 italic">—</span>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {consent.isRequired ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-700/30">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Required
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {consent.attachments.length > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
                            <FileText className="h-3 w-3 mr-1" />
                            {consent.attachments.length}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {consent.note ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNoteExpansion(consent.id);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-primary-400 hover:bg-dark-700 transition-colors"
                            title="View note"
                          >
                            <Info
                              className={`h-4 w-4 ${
                                expandedNotes.has(consent.id)
                                  ? "text-primary-400"
                                  : ""
                              }`}
                            />
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                      {isEditing && (
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingConsent(consent.id);
                            }}
                            className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  )}
                  {/* Expanded Note Row - only show if not editing */}
                  {expandedNotes.has(consent.id) &&
                    consent.note &&
                    editingConsent !== consent.id && (
                      <tr key={`${consent.id}-note`}>
                        <td colSpan={isEditing ? 7 : 6} className="px-6 pb-4">
                          <div className="bg-dark-900 border border-dark-600 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-medium text-gray-400">
                                Note:
                              </span>
                              <button
                                onClick={() => toggleNoteExpansion(consent.id)}
                                className="text-gray-400 hover:text-gray-300"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <MarkdownViewer content={consent.note} />
                          </div>
                        </td>
                      </tr>
                    )}
                  {/* Expanded Files Row */}
                  {consent.attachments.length > 0 && (
                    <tr
                      key={`${consent.id}-files`}
                      className="border-b border-dark-700"
                    >
                      <td colSpan={6} className="px-6 pb-4">
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-gray-400">
                            Attachments:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {consent.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-800 border border-dark-600 rounded-lg text-sm text-primary-400 hover:text-primary-300 hover:bg-dark-700 transition-colors"
                                title={`${
                                  attachment.originalName
                                } (${formatFileSize(attachment.size)})`}
                              >
                                {getFileIcon(attachment.mimeType)}
                                <span className="max-w-[200px] truncate">
                                  {attachment.originalName}
                                </span>
                                <Download className="h-3 w-3 flex-shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {consents.map((consent) => (
            <div
              key={consent.id}
              className={`bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-3 ${
                isEditing && editingConsent !== consent.id
                  ? "cursor-pointer hover:bg-dark-700 transition-colors"
                  : ""
              }`}
              onClick={() =>
                isEditing &&
                editingConsent !== consent.id &&
                setEditingConsent(consent.id)
              }
            >
              {editingConsent === consent.id ? (
                // Edit Form for Mobile
                <div className="space-y-4">
                  {/* Title Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-gray-100">
                      {consent.consentType.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingConsent(null);
                      }}
                      className="text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Date Given, Consent Method, Required Switch */}
                  <div className="space-y-3">
                    <DatePicker
                      label="Date Given"
                      value={consent.dateGiven || ""}
                      onChange={(value) =>
                        handleConsentChange(consent.id, "dateGiven", value)
                      }
                      placeholder="Select date consent was given"
                    />

                    <div className="space-y-2">
                      <label
                        htmlFor={`consent-method-${consent.id}`}
                        className="block text-sm font-medium text-gray-400"
                      >
                        Consent Method
                      </label>
                      <select
                        id={`consent-method-${consent.id}`}
                        value={consent.consentMethod || ""}
                        onChange={(e) =>
                          handleConsentChange(
                            consent.id,
                            "consentMethod",
                            e.target.value || null
                          )
                        }
                        className={`w-full px-4 py-2 bg-[#1a1a1a] border border-[#4f4f4f] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                          consent.consentMethod
                            ? "text-gray-100"
                            : "text-gray-500"
                        }`}
                      >
                        <option value="" className="text-gray-500">
                          Select method
                        </option>
                        {CONSENT_METHODS.map((method) => (
                          <option
                            key={method.value}
                            value={method.value}
                            className="text-gray-100"
                          >
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Switch
                        id={`required-mobile-${consent.id}`}
                        checked={consent.isRequired}
                        onChange={(checked) =>
                          handleConsentChange(consent.id, "isRequired", checked)
                        }
                        label="Required for user"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-1">
                    <MarkdownTextarea
                      label="Note"
                      value={consent.note || ""}
                      onChange={(value) =>
                        handleConsentChange(consent.id, "note", value || null)
                      }
                      placeholder="Add any additional notes..."
                      maxLength={2000}
                      rows={3}
                    />
                  </div>

                  {/* Attachments */}
                  {consent.attachments.length > 0 && (
                    <div className="space-y-2">
                      <div className="block text-sm font-medium text-gray-400">
                        Files
                      </div>
                      <div className="space-y-2">
                        {consent.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between gap-2 p-2 bg-dark-900 border border-dark-600 rounded-lg"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {getFileIcon(attachment.mimeType)}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-300 truncate">
                                  {attachment.originalName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(attachment.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a
                                href={attachment.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-primary-400"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmation({
                                    isOpen: true,
                                    consentId: consent.id,
                                    attachmentId: attachment.id,
                                  });
                                }}
                                className="p-2 text-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <label
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 border border-primary-500 rounded-lg text-white transition-colors cursor-pointer ${
                      uploadingFor === consent.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">
                      {uploadingFor === consent.id
                        ? "Uploading..."
                        : "Upload File"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(consent.id, e)}
                      disabled={uploadingFor === consent.id}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                // Preview Card
                <>
                  {/* Header */}
                  <div className="space-y-2">
                    <h4 className="text-base font-semibold text-white">
                      {consent.consentType.title}
                    </h4>
                    {consent.isRequired && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-700/30">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Required
                      </span>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400 block mb-1">Date:</span>
                      <span className="text-gray-100">
                        {consent.dateGiven ? (
                          formatDateYMD(consent.dateGiven)
                        ) : (
                          <span className="text-gray-500 italic">
                            Not provided
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-1">Method:</span>
                      <span className="text-gray-100">
                        {consent.consentMethod ? (
                          CONSENT_METHODS.find(
                            (m) => m.value === consent.consentMethod
                          )?.label || consent.consentMethod
                        ) : (
                          <span className="text-gray-500 italic">—</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Files */}
                  {consent.attachments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-gray-400">
                        Files ({consent.attachments.length}):
                      </span>
                      <div className="space-y-1">
                        {consent.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-primary-400 hover:text-primary-300 transition-colors"
                          >
                            {getFileIcon(attachment.mimeType)}
                            <span className="flex-1 truncate">
                              {attachment.originalName}
                            </span>
                            <Download className="h-3 w-3 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  {consent.note && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleNoteExpansion(consent.id)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-400 transition-colors"
                      >
                        <Info className="h-4 w-4" />
                        <span>
                          {expandedNotes.has(consent.id)
                            ? "Hide note"
                            : "View note"}
                        </span>
                      </button>
                      {expandedNotes.has(consent.id) && (
                        <div className="bg-dark-900 border border-dark-600 rounded-lg p-3">
                          <MarkdownViewer content={consent.note} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit Button for Mobile */}
                  {isEditing && (
                    <div className="pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConsent(consent.id);
                        }}
                        className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add Consent Dialog */}
        {showAddConsentDialog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddConsentDialog(false);
                setSelectedConsentTypeToAdd("");
              }
            }}
          >
            <div
              className="bg-dark-800 rounded-xl shadow-2xl max-w-md w-full border border-dark-600"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-dark-600">
                <h2 className="text-xl font-bold text-gray-100">
                  Add Consent Type
                </h2>
                <button
                  onClick={() => {
                    setShowAddConsentDialog(false);
                    setSelectedConsentTypeToAdd("");
                  }}
                  disabled={addingConsent}
                  className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded hover:bg-dark-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-gray-300">
                  Select a consent type to add to this user:
                </p>
                <div className="space-y-2">
                  <label
                    htmlFor="new-consent-type"
                    className="block text-sm font-medium text-gray-400"
                  >
                    Consent Type
                  </label>
                  <select
                    id="new-consent-type"
                    value={selectedConsentTypeToAdd}
                    onChange={(e) =>
                      setSelectedConsentTypeToAdd(e.target.value)
                    }
                    disabled={addingConsent}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#4f4f4f] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" className="text-gray-500">
                      Select a consent type
                    </option>
                    {availableConsentTypes.map((ct) => (
                      <option
                        key={ct.id}
                        value={ct.id}
                        className="text-gray-100"
                      >
                        {ct.title}
                      </option>
                    ))}
                  </select>
                  {selectedConsentTypeToAdd && (
                    <p className="text-xs text-gray-500 mt-2">
                      {
                        availableConsentTypes.find(
                          (ct) => ct.id === selectedConsentTypeToAdd
                        )?.description
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-dark-600 bg-dark-750">
                <button
                  onClick={() => {
                    setShowAddConsentDialog(false);
                    setSelectedConsentTypeToAdd("");
                  }}
                  disabled={addingConsent}
                  className="px-6 py-2.5 rounded-lg font-medium bg-dark-600 hover:bg-dark-500 text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddConsent}
                  disabled={addingConsent || !selectedConsentTypeToAdd}
                  className="px-6 py-2.5 rounded-lg font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingConsent ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationDialog
          isOpen={deleteConfirmation.isOpen}
          onClose={() =>
            setDeleteConfirmation({
              isOpen: false,
              consentId: null,
              attachmentId: null,
            })
          }
          onConfirm={handleDeleteAttachment}
          title="Delete Attachment"
          message="Are you sure you want to delete this attachment? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    );
  }
);

UserConsents.displayName = "UserConsents";

export default UserConsents;
