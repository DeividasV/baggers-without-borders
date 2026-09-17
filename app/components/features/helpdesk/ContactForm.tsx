"use client";

import { useState, useEffect, useCallback } from "react";
import { SITE_NAME } from "@/src/config/site";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Send, Mail, MessageSquare, Info, Table2 } from "lucide-react";
import {
  Button,
  Card,
  Input,
  Textarea,
  FileUpload,
  SearchableSelect,
  LoadingSpinner,
  TurnstileWidget,
} from "@/app/components/ui";
import { validateSupportRequest } from "@/src/utils/supportRequestValidation";
import { useHofData } from "@/src/hooks/useHofData";

/**
 * Support request category types
 * @type Category
 */
type Category = "GENERAL" | "HOF_DATA";

/**
 * Props for the ContactForm component
 * @interface ContactFormProps
 */
interface ContactFormProps {
  /** Whether the user is authenticated (hides email field for logged-in users) */
  isAuthenticated?: boolean;
}

/**
 * Public contact form for submitting support requests with file attachments.
 *
 * Features:
 * - Authenticated users: pre-filled name/email, hidden email field
 * - Unauthenticated users: manual name/email entry, Turnstile CAPTCHA
 * - HOF-specific requests: selectable HoF + Year (auto-populated from URL params)
 * - File uploads: 5 files max, 5MB/file, 25MB total, multiple formats supported
 * - Real-time validation: character counters, email format checks
 * - Category-based form fields (general vs HOF data)
 * - Rate limiting: 5 submissions per 15 minutes
 *
 * @component
 *
 * @example
 * ```tsx
 * // Public contact form
 * <ContactForm />
 *
 * // Authenticated user contact form (pre-filled)
 * <ContactForm isAuthenticated={true} />
 *
 * // With HOF context from URL
 * // URL: /contact?hofId=hof-123&yearId=year-456
 * <ContactForm isAuthenticated={true} />
 * ```
 *
 * @security
 * - Turnstile CAPTCHA for unauthenticated users (prevents spam)
 * - Rate limiting: 5 requests per 15 minutes (per IP/email)
 * - File validation: MIME type whitelist, size limits, executable blocking
 * - XSS protection: rehype-sanitize for markdown rendering
 *
 * @accessibility
 * - All form fields have visible labels
 * - Character counters provide real-time feedback
 * - Error messages linked to form fields
 * - File upload with keyboard support
 * - Success/error states announced
 *
 * @see {@link docs/HELPDESK_SYSTEM.md} for architecture details
 */
export default function ContactForm({ isAuthenticated = false }: ContactFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Check for pre-selected HoF from URL params
  const hofIdParam = searchParams.get("hofId");
  const yearIdParam = searchParams.get("yearId");

  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    subject: "",
    message: "",
    category: (isAuthenticated && hofIdParam ? "HOF_DATA" : "GENERAL") as Category,
    hofId: hofIdParam || "",
  });

  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
  const [captchaReady, setCaptchaReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  // Fetch HoF data when HOF_DATA category is selected
  const {
    hofs,
    years,
    loading: loadingHofs,
  } = useHofData(formData.category === "HOF_DATA" || !!hofIdParam);

  const getTurnstileToken = () => {
    if (!isAuthenticated) {
      const stateToken = turnstileToken?.trim();
      if (stateToken) return stateToken;

      const responseField = document.querySelector('[name="cf-turnstile-response"]') as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;

      const fieldValue = responseField?.value?.trim();
      if (fieldValue) return fieldValue;
    }
    return null;
  };

  // Handle paste event to capture images from clipboard
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          // Create a new file with a proper name
          const timestamp = Date.now();
          const newFile = new File([file], `pasted-image-${timestamp}.${file.type.split("/")[1]}`, {
            type: file.type,
          });
          imageFiles.push(newFile);
        }
      }
    }

    if (imageFiles.length > 0) {
      setUploadingFiles((prev) => [...prev, ...imageFiles]);
    }
  }, []);

  // Generate preview URLs for image files
  useEffect(() => {
    const newPreviewUrls = new Map<string, string>();

    uploadingFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        newPreviewUrls.set(file.name, url);
      }
    });

    setPreviewUrls(newPreviewUrls);

    // Cleanup old URLs
    return () => {
      newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [uploadingFiles]);

  // Update form data when session loads
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
      }));
    }
  }, [session]);

  // Pre-fill subject when HoF and Year are provided
  useEffect(() => {
    if (hofIdParam && yearIdParam && hofs.length > 0 && years.length > 0) {
      const selectedHof = hofs.find((h) => h.id === hofIdParam);
      const selectedYear = years.find((y) => y.id === yearIdParam);

      if (selectedHof && selectedYear && !formData.subject) {
        setFormData((prev) => ({
          ...prev,
          subject: `${selectedHof.label} - ${selectedYear.title} - Data Question`,
        }));
      }
    }
  }, [hofIdParam, yearIdParam, hofs, years]);

  const handleCategoryChange = (category: Category) => {
    setFormData((prev) => ({
      ...prev,
      category,
      hofId: category !== "HOF_DATA" ? "" : prev.hofId,
    }));
  };

  const handleHofChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, hofId: value }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const validation = validateSupportRequest(formData);
    if (!validation.valid) {
      setError(validation.error);
      return false;
    }
    setError("");
    return true;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // Prepare FormData for file upload
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("subject", formData.subject);
      submitData.append("message", formData.message);
      submitData.append("category", formData.category);
      if (formData.hofId) {
        submitData.append("hofId", formData.hofId);
      }

      // Add Turnstile token for public forms
      if (!isAuthenticated) {
        const token = getTurnstileToken();
        if (token) {
          submitData.append("turnstileToken", token);
        }
      }

      // Append files
      uploadingFiles.forEach((file) => {
        submitData.append("files", file);
      });

      const response = await fetch("/api/support-requests", {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccess(true);
      setFormData({
        name: session?.user?.name || "",
        email: session?.user?.email || "",
        subject: "",
        message: "",
        category: "GENERAL",
        hofId: "",
      });
      setUploadingFiles([]);

      // Redirect back to previous page after 3 seconds
      setTimeout(() => {
        router.back();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/20 border border-green-500/50 mb-4">
            <Send className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-primary-400 mb-2">Message Sent!</h2>
          <p className="text-gray-300 mb-4">
            Thank you for contacting {SITE_NAME}. Your message has been received.
          </p>
          <p className="text-sm text-gray-400">Redirecting back...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-8 w-8 text-primary-400" />
          <h2 className="text-2xl font-bold text-primary-400">Contact Us</h2>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
          >
            {error}
          </div>
        )}

        {/* Category Selection (Members Only) */}
        {isAuthenticated && (
          <div className="mb-6">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-300 mb-3">
                What can we help you with? <span className="text-red-400">*</span>
              </legend>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 bg-dark-800 border border-dark-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <input
                    type="radio"
                    name="category"
                    value="GENERAL"
                    checked={formData.category === "GENERAL"}
                    onChange={(e) => handleCategoryChange(e.target.value as Category)}
                    className="mt-1"
                    aria-label={`General questions about the ${SITE_NAME} community and events`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-5 w-5 text-primary-400" />
                      <span className="font-medium text-white">General Questions</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Questions about the {SITE_NAME} community, events, or general inquiries
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 bg-dark-800 border border-dark-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <input
                    type="radio"
                    name="category"
                    value="HOF_DATA"
                    checked={formData.category === "HOF_DATA"}
                    onChange={(e) => handleCategoryChange(e.target.value as Category)}
                    className="mt-1"
                    aria-label="Hall of Fame table data corrections and submissions"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Table2 className="h-5 w-5 text-primary-400" />
                      <span className="font-medium text-white">HoF Table Data</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Data corrections, submissions, or questions about Hall of Fame tables
                    </p>
                  </div>
                </label>
              </div>
            </fieldset>
          </div>
        )}

        {/* Name and Email Fields */}
        {isAuthenticated ? (
          <div className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="block text-sm font-medium text-gray-300 mb-2">Name</div>
                <p className="text-white py-2">{formData.name}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-300 mb-2">Email</div>
                <p className="text-white py-2">{formData.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              label="Name"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="John Doe"
            />
            <Input
              label="Email"
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              placeholder="john.doe@example.com"
            />
          </div>
        )}

        {/* HoF Selection (shown only for HOF_DATA category) */}
        {formData.category === "HOF_DATA" && (
          <div className="mb-6">
            <label htmlFor="hof-select" className="block text-sm font-medium text-gray-300 mb-2">
              Hall of Fame <span className="text-red-400">*</span>
            </label>
            {loadingHofs ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <LoadingSpinner size="sm" />
                Loading Hall of Fame tables...
              </div>
            ) : (
              <SearchableSelect
                id="hof-select"
                options={hofs}
                value={formData.hofId}
                onChange={handleHofChange}
                placeholder="Select a Hall of Fame table..."
              />
            )}
          </div>
        )}

        {/* Subject Field */}
        <div className="mb-6">
          <Input
            label="Subject"
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
            required
            placeholder="Brief description of your inquiry"
          />
        </div>

        {/* Message Field */}
        <div className="mb-6">
          <Textarea
            label="Message"
            id="message"
            value={formData.message}
            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
            onPaste={handlePaste}
            required
            rows={8}
            maxLength={5000}
            showCharCount
            placeholder="Please provide details about your inquiry..."
          />
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>
              Tip: Copy/paste pictures and screenshots directly into the message field (Ctrl+V /
              Cmd+V)
            </span>
          </p>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <div className="mb-2">
            <div className="block text-sm font-medium text-gray-300">Attachments</div>
            <p className="text-xs text-gray-400 mt-1">
              Upload files or paste screenshots/images directly (Ctrl+V / Cmd+V)
            </p>
          </div>
          <FileUpload
            files={uploadingFiles}
            onFilesChange={setUploadingFiles}
            previewUrls={previewUrls}
          />
        </div>

        {/* Cloudflare Turnstile - Public Form Only */}
        {!isAuthenticated && (
          <div className="mb-6">
            <TurnstileWidget
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
              theme="dark"
              size="normal"
              appearance="interaction-only"
              onReady={setCaptchaReady}
              onToken={setTurnstileToken}
            />
            {!captchaReady && !loading && (
              <p className="text-xs text-gray-500 mt-2">
                Loading security verification… This should appear automatically. If it does not,
                please check your ad blocker or tracking protection settings.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || (!isAuthenticated && !captchaReady)}
            className="flex-1"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Sending...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Send className="h-4 w-4 shrink-0" />
                <span>Send Message</span>
              </span>
            )}
          </Button>
        </div>

        {/* Volunteer Response Notice */}
        <div className="mt-6 p-4 bg-dark-700 border border-dark-600 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            All messages are monitored by volunteers. While we strive to respond as soon as
            possible, please note there is no guaranteed response time. Thank you for your patience
            and understanding.
          </p>
        </div>
      </form>
    </Card>
  );
}
