"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { SITE_NAME } from "@/src/config/site";
import { Copy, Check, Loader2, AlertTriangle, PencilLine } from "lucide-react";
import Card from "@/ui/Card";
import Input from "@/ui/Input";
import Button from "@/ui/Button";
import DatePicker from "@/ui/DatePicker";
import YearPicker from "@/ui/YearPicker";
import RoleSelect from "@/ui/RoleSelect";
import StatusSelect from "@/ui/StatusSelect";
import InterestMultiSelect from "@/ui/InterestMultiSelect";
import MarkdownTextarea from "@/ui/MarkdownTextarea";
import MarkdownViewer from "@/ui/MarkdownViewer";
import InfoField from "./InfoField";
import { formatDateTime, debounce } from "@/src/lib/utils";
import { formatRoleOrStatus } from "./utils";
import type { User as UserType } from "@/src/types";

interface BwbInformationSectionProps {
  user: UserType;
  isEditing: boolean;
  isAdmin: boolean;
  formData: any;
  onFormDataChange: (updates: any) => void;
  copiedId: boolean;
  onCopyId: () => void;
}

interface ValidationState {
  checkingUsername: boolean;
  checkingEmail: boolean;
  usernameAvailable: boolean | null;
  emailAvailable: boolean | null;
  usernameError: string | null;
  emailError: string | null;
}

export default function BwbInformationSection({
  user,
  isEditing,
  isAdmin,
  formData,
  onFormDataChange,
  copiedId,
  onCopyId,
}: BwbInformationSectionProps) {
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationState>({
    checkingUsername: false,
    checkingEmail: false,
    usernameAvailable: null,
    emailAvailable: null,
    usernameError: null,
    emailError: null,
  });

  // Email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Helper to update validation state - memoized to prevent recreating
  const updateValidation = useCallback((updates: Partial<ValidationState>) => {
    setValidation((prev) => ({ ...prev, ...updates }));
  }, []);

  // Check username availability (excluding current user)
  const checkUsername = useCallback(
    async (username: string): Promise<boolean> => {
      if (!username || username.length < 3) return false;

      try {
        const response = await fetch(
          `/api/admin/members/check-username?username=${encodeURIComponent(
            username
          )}&excludeUserId=${encodeURIComponent(user.id)}`
        );
        const data = await response.json();
        return data.available;
      } catch (error) {
        console.error("Error checking username:", error);
        return false;
      }
    },
    [user.id]
  );

  // Check email availability (excluding current user)
  const checkEmail = useCallback(
    async (emailToCheck: string): Promise<boolean> => {
      if (!emailRegex.test(emailToCheck)) return false;

      try {
        const response = await fetch(
          `/api/admin/members/check-email?email=${encodeURIComponent(
            emailToCheck
          )}&excludeUserId=${encodeURIComponent(user.id)}`
        );
        const data = await response.json();
        return data.available;
      } catch (error) {
        console.error("Error checking email:", error);
        return false;
      }
    },
    [emailRegex, user.id]
  );

  // Validate username with format and uniqueness check
  const validateUsername = useCallback(
    async (usernameToValidate: string) => {
      if (!usernameToValidate) {
        updateValidation({ usernameAvailable: null, usernameError: null });
        return;
      }

      // Check format
      if (!/^[a-zA-Z0-9._-]{3,30}$/.test(usernameToValidate)) {
        updateValidation({
          usernameAvailable: false,
          usernameError:
            "Username must be 3-30 characters: lowercase letters, numbers, underscore, or hyphen only.",
        });
        return;
      }

      // Skip check if username hasn't changed
      if (usernameToValidate === user.username) {
        updateValidation({ usernameAvailable: true, usernameError: null });
        return;
      }

      updateValidation({ checkingUsername: true, usernameError: null });

      const available = await checkUsername(usernameToValidate);

      updateValidation({
        checkingUsername: false,
        usernameAvailable: available,
        usernameError: available
          ? null
          : "Username already in use. Please choose a different username.",
      });
    },
    [user.username, checkUsername, updateValidation]
  );

  // Validate email with format and uniqueness check
  const validateEmail = useCallback(
    async (emailToValidate: string) => {
      if (!emailToValidate) {
        updateValidation({ emailAvailable: null, emailError: null });
        return;
      }

      // Check format
      if (!emailRegex.test(emailToValidate)) {
        updateValidation({
          emailAvailable: false,
          emailError: "Please enter a valid email address (e.g., user@example.com).",
        });
        return;
      }

      // Skip check if email hasn't changed
      if (emailToValidate.toLowerCase() === user.email?.toLowerCase()) {
        updateValidation({ emailAvailable: true, emailError: null });
        return;
      }

      updateValidation({ checkingEmail: true, emailError: null });

      const available = await checkEmail(emailToValidate);

      updateValidation({
        checkingEmail: false,
        emailAvailable: available,
        emailError: available
          ? null
          : "Email already in use. Please choose a different email address.",
      });
    },
    [user.email, emailRegex, checkEmail, updateValidation]
  );

  // Debounced validators
  const debouncedValidateUsername = useMemo(
    () =>
      debounce((username: string) => {
        validateUsername(username);
      }, 300),

    [user.username, user.id]
  );

  const debouncedValidateEmail = useMemo(
    () =>
      debounce((email: string) => {
        validateEmail(email);
      }, 300),

    [user.email, user.id]
  );

  // Validate on change when editing
  useEffect(() => {
    if (isEditingUsername && formData.username) {
      debouncedValidateUsername(formData.username);
    }
    return () => {
      debouncedValidateUsername.cancel();
    };
  }, [formData.username, isEditingUsername, debouncedValidateUsername]);

  useEffect(() => {
    if (isEditingEmail && formData.email) {
      debouncedValidateEmail(formData.email);
    }
    return () => {
      debouncedValidateEmail.cancel();
    };
  }, [formData.email, isEditingEmail, debouncedValidateEmail]);

  const handleStartEditUsername = () => {
    setIsEditingUsername(true);
    updateValidation({ usernameAvailable: null, usernameError: null });
  };

  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    onFormDataChange({ username: user.username });
    updateValidation({
      usernameAvailable: null,
      usernameError: null,
      checkingUsername: false,
    });
  };

  const handleConfirmEditUsername = () => {
    if (validation.usernameAvailable) {
      setIsEditingUsername(false);
    }
  };

  const handleStartEditEmail = () => {
    setIsEditingEmail(true);
    updateValidation({ emailAvailable: null, emailError: null });
  };

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false);
    onFormDataChange({ email: user.email });
    updateValidation({
      emailAvailable: null,
      emailError: null,
      checkingEmail: false,
    });
  };

  const handleConfirmEditEmail = () => {
    if (validation.emailAvailable) {
      setIsEditingEmail(false);
    }
  };

  // Cleanup copy timeout on unmount
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      setCopiedField(null);
    };
  }, []);

  const handleCopyUsername = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formData.username);
      setCopiedField("username");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy username:", error);
    }
  }, [formData.username]);

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formData.email);
      setCopiedField("email");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy email:", error);
    }
  }, [formData.email]);

  const handleCopyAccountCreated = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatDateTime(user.createdAt));
      setCopiedField("accountCreated");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy account created:", error);
    }
  }, [user.createdAt]);

  const handleCopyLastUpdated = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        user.updatedAt ? formatDateTime(user.updatedAt) : "Never"
      );
      setCopiedField("lastUpdated");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy last updated:", error);
    }
  }, [user.updatedAt]);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-100 mb-6">{SITE_NAME} information</h3>

      {isEditing ? (
        <div className="space-y-6">
          {/* Username and Email - 2 columns with blank space (Admin only) */}
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Username Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                    Username
                  </label>
                  <div className="flex items-center gap-2">
                    {isEditingUsername && (
                      <button
                        type="button"
                        onClick={handleCopyUsername}
                        className="text-gray-400 hover:text-primary-400 transition-colors"
                        title="Copy username"
                      >
                        {copiedField === "username" ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    {!isEditingUsername && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyUsername}
                          className="text-gray-400 hover:text-primary-400 transition-colors"
                          title="Copy username"
                        >
                          {copiedField === "username" ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleStartEditUsername}
                          className="text-xs"
                          aria-label="Edit username"
                        >
                          <PencilLine className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {isEditingUsername ? (
                  <>
                    <div className="relative">
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) =>
                          onFormDataChange({
                            username: e.target.value.trim().toLowerCase(),
                          })
                        }
                        placeholder="Enter username"
                        maxLength={30}
                        aria-invalid={!!validation.usernameError}
                        aria-describedby={
                          validation.usernameError
                            ? "username-error"
                            : validation.usernameAvailable
                              ? "username-hint"
                              : undefined
                        }
                        className={
                          validation.usernameError
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : validation.usernameAvailable
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                              : ""
                        }
                      />
                      <div
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {validation.checkingUsername && (
                          <Loader2
                            className="h-4 w-4 text-gray-400 animate-spin"
                            aria-label="Checking username availability"
                          />
                        )}
                        {!validation.checkingUsername && validation.usernameAvailable === true && (
                          <Check
                            className="h-4 w-4 text-green-500"
                            aria-label="Username available"
                          />
                        )}
                        {!validation.checkingUsername && validation.usernameAvailable === false && (
                          <AlertTriangle
                            className="h-4 w-4 text-red-500"
                            aria-label="Username not available"
                          />
                        )}
                      </div>
                    </div>
                    {validation.usernameError && (
                      <p
                        id="username-error"
                        className="text-xs text-red-400 flex items-center gap-1"
                        role="alert"
                      >
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        {validation.usernameError}
                      </p>
                    )}
                    {!validation.usernameError && (
                      <p id="username-hint" className="text-xs text-gray-500">
                        3-30 characters: lowercase letters, numbers, underscore, or hyphen only.
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditUsername}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleConfirmEditUsername}
                        disabled={!validation.usernameAvailable || validation.checkingUsername}
                        className="text-xs"
                      >
                        Confirm
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-300">
                    {formData.username}
                  </div>
                )}
              </div>
              {/* Email Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    {isEditingEmail && (
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="text-gray-400 hover:text-primary-400 transition-colors"
                        title="Copy email"
                      >
                        {copiedField === "email" ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    {!isEditingEmail && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="text-gray-400 hover:text-primary-400 transition-colors"
                          title="Copy email"
                        >
                          {copiedField === "email" ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleStartEditEmail}
                          className="text-xs"
                          aria-label="Edit email"
                        >
                          <PencilLine className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {isEditingEmail ? (
                  <>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => onFormDataChange({ email: e.target.value })}
                        placeholder="Enter email address"
                        aria-invalid={!!validation.emailError}
                        aria-describedby={validation.emailError ? "email-error" : undefined}
                        className={
                          validation.emailError
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : validation.emailAvailable
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                              : ""
                        }
                      />
                      <div
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {validation.checkingEmail && (
                          <Loader2
                            className="h-4 w-4 text-gray-400 animate-spin"
                            aria-label="Checking email availability"
                          />
                        )}
                        {!validation.checkingEmail && validation.emailAvailable === true && (
                          <Check className="h-4 w-4 text-green-500" aria-label="Email available" />
                        )}
                        {!validation.checkingEmail && validation.emailAvailable === false && (
                          <AlertTriangle
                            className="h-4 w-4 text-red-500"
                            aria-label="Email not available"
                          />
                        )}
                      </div>
                    </div>
                    {validation.emailError && (
                      <p
                        id="email-error"
                        className="text-xs text-red-400 flex items-center gap-1"
                        role="alert"
                      >
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        {validation.emailError}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditEmail}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleConfirmEditEmail}
                        disabled={!validation.emailAvailable || validation.checkingEmail}
                        className="text-xs"
                      >
                        Confirm
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-300">
                    {formData.email}
                  </div>
                )}
              </div>
              <div></div> {/* Blank space */}
            </div>
          )}

          {/* Forum Nickname and Forum Join Date - 2 columns with blank space */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Forum Nickname"
              value={formData.bwbForumNickname}
              onChange={(e) => onFormDataChange({ bwbForumNickname: e.target.value })}
              placeholder="Enter forum nickname"
            />
            <DatePicker
              label="Forum Join Date"
              value={formData.forumJoinDate}
              onChange={(value) => onFormDataChange({ forumJoinDate: value })}
              placeholder="Select forum join date"
            />
            <div></div> {/* Blank space */}
          </div>

          {/* Retired Year, Deceased Year - 2 columns with blank space */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <YearPicker
              label="Retired Year"
              value={formData.retiredYear}
              onChange={(value) => onFormDataChange({ retiredYear: value ?? "" })}
              placeholder="Select retired year"
            />
            <YearPicker
              label="Deceased Year"
              value={formData.deceasedYear}
              onChange={(value) => onFormDataChange({ deceasedYear: value ?? "" })}
              placeholder="Select deceased year"
            />
            <div></div> {/* Blank space */}
          </div>

          {/* Role, Status - 2 columns with blank space */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RoleSelect
              label="Role"
              value={formData.role}
              onChange={(value) => onFormDataChange({ role: value })}
              placeholder="Select role"
            />
            <StatusSelect
              label="Status"
              value={formData.status}
              onChange={(value) => onFormDataChange({ status: value as any })}
              placeholder="Select status"
            />
            <div></div> {/* Blank space */}
          </div>

          {/* Interests - Full width */}
          <div className="grid grid-cols-1 gap-4">
            <InterestMultiSelect
              label="Interests"
              value={formData.interests || []}
              onChange={(value) => onFormDataChange({ interests: value })}
              placeholder="Select interests"
            />
          </div>

          {/* Notes - Full width */}
          <div className="grid grid-cols-1 gap-4">
            <MarkdownTextarea
              label="Notes"
              value={formData.notes}
              onChange={(value) => onFormDataChange({ notes: value })}
              placeholder="Enter administrative notes..."
              maxLength={5000}
              rows={6}
              helperText="Visible to admins only."
            />
          </div>

          {/* Allow Manual Entry Toggle */}
          <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-600">
            <div>
              <label htmlFor="allowManualEntry" className="text-sm font-medium text-gray-300">
                Allow Manual Data Entry
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Enable manual entry of hall of fame data for this member
              </p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="allowManualEntry"
                checked={formData.allowManualEntry}
                onChange={(e) =>
                  onFormDataChange({
                    allowManualEntry: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </div>
          </div>

          {/* User ID, Account Created, Last Updated - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="block text-sm font-medium text-gray-300">User ID</div>
                <button
                  type="button"
                  onClick={onCopyId}
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                  title="Copy user ID"
                >
                  {copiedId ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <div className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-300 font-mono text-sm truncate">
                {user.id}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="block text-sm font-medium text-gray-300">Account Created</div>
                <button
                  type="button"
                  onClick={handleCopyAccountCreated}
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                  title="Copy account created date"
                >
                  {copiedField === "accountCreated" ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <div className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-300">
                {formatDateTime(user.createdAt)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="block text-sm font-medium text-gray-300">Last Updated</div>
                <button
                  type="button"
                  onClick={handleCopyLastUpdated}
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                  title="Copy last updated date"
                >
                  {copiedField === "lastUpdated" ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <div className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-300">
                {user.updatedAt ? formatDateTime(user.updatedAt) : "Never"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Username and Email - 2 columns with blank space */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="block text-sm font-medium text-gray-400">Username</div>
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-gray-100 truncate flex-1 min-w-0" title={user.username}>
                  {user.username}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUsername}
                  className="text-gray-400 hover:text-primary-400 transition-colors shrink-0"
                  title="Copy username"
                >
                  {copiedField === "username" ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="block text-sm font-medium text-gray-400">Email</div>
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-gray-100 truncate flex-1 min-w-0" title={user.email}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-gray-400 hover:text-primary-400 transition-colors shrink-0"
                  title="Copy email"
                >
                  {copiedField === "email" ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div></div> {/* Blank space */}
          </div>

          {/* Forum Nickname and Forum Join Date - 2 columns with blank space */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoField label="Forum Nickname" value={user.bwbForumNickname} />
            <InfoField
              label="Forum Join Date"
              value={user.forumJoinDate ? formatDateTime(user.forumJoinDate) : undefined}
            />
            <div></div> {/* Blank space */}
          </div>

          {/* Retired Year, Deceased Year - 2 columns with blank space */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoField label="Retired Year" value={user.retiredYear?.toString()} />
            <InfoField label="Deceased Year" value={user.deceasedYear?.toString()} />
            <div></div> {/* Blank space */}
          </div>

          {/* Role, Status - 2 columns with blank space */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoField label="Role" value={formatRoleOrStatus(user.role)} />
            <InfoField label="Status" value={formatRoleOrStatus(user.status)} />
            <div></div> {/* Blank space */}
          </div>

          {/* Interests - Full width */}
          {(user as any).userInterests && (user as any).userInterests.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1">
                <div className="block text-sm font-medium text-gray-400">Interests</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(user as any).userInterests.map((ui: any) => (
                    <span
                      key={ui.interestId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-dark-700 text-gray-100 text-xs rounded-md border border-dark-500"
                    >
                      {ui.interest.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes - Full width */}
          {user.notes && (
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1">
                <div className="block text-sm font-medium text-gray-400">Notes</div>
                <div className="bg-dark-800 border border-dark-500 rounded-lg p-4">
                  <MarkdownViewer content={user.notes} />
                </div>
              </div>
            </div>
          )}

          {/* User ID, Account Created, Last Updated - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="block text-sm font-medium text-gray-400">User ID</div>
              <div className="flex items-center space-x-2 min-w-0">
                <span
                  className="text-gray-100 font-mono text-sm truncate flex-1 min-w-0"
                  title={user.id}
                >
                  {user.id}
                </span>
                <button
                  type="button"
                  onClick={onCopyId}
                  className="text-gray-400 hover:text-primary-400 transition-colors shrink-0"
                  title="Copy full ID"
                >
                  {copiedId ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="block text-sm font-medium text-gray-400">Account Created</div>
              <div className="flex items-center space-x-2 min-w-0">
                <span
                  className="text-gray-100 truncate flex-1 min-w-0"
                  title={formatDateTime(user.createdAt)}
                >
                  {formatDateTime(user.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAccountCreated}
                  className="text-gray-400 hover:text-primary-400 transition-colors shrink-0"
                  title="Copy account created date"
                >
                  {copiedField === "accountCreated" ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="block text-sm font-medium text-gray-400">Last Updated</div>
              <div className="flex items-center space-x-2 min-w-0">
                <span
                  className="text-gray-100 truncate flex-1 min-w-0"
                  title={user.updatedAt ? formatDateTime(user.updatedAt) : "Never"}
                >
                  {user.updatedAt ? formatDateTime(user.updatedAt) : "Never"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLastUpdated}
                  className="text-gray-400 hover:text-primary-400 transition-colors shrink-0"
                  title="Copy last updated date"
                >
                  {copiedField === "lastUpdated" ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
