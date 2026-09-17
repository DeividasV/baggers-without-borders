"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/ui/Modal";
import Button from "@/ui/Button";
import Input from "@/ui/Input";
import { debounce, transliterate } from "@/src/lib/utils";
import {
  Loader2,
  Check,
  Copy,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationState {
  checkingUsername: boolean;
  checkingEmail: boolean;
  usernameAvailable: boolean | null;
  emailAvailable: boolean | null;
  error: string | null;
  usernameAdjusted: boolean;
}

interface PasswordDisplayState {
  show: boolean;
  password: string;
  username: string;
  email: string;
  userId: string;
  copied: boolean;
  passwordVisible: boolean;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [validation, setValidation] = useState<ValidationState>({
    checkingUsername: false,
    checkingEmail: false,
    usernameAvailable: null,
    emailAvailable: null,
    error: null,
    usernameAdjusted: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [passwordDisplay, setPasswordDisplay] = useState<PasswordDisplayState>({
    show: false,
    password: "",
    username: "",
    email: "",
    userId: "",
    copied: false,
    passwordVisible: false,
  });

  // Email regex pattern (extracted to avoid duplication)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check username availability
  const checkUsername = async (username: string): Promise<boolean> => {
    if (!username || username.length < 3) return false;

    try {
      const response = await fetch(
        `/api/admin/members/check-username?username=${encodeURIComponent(
          username,
        )}`,
      );
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  // Check email availability
  const checkEmail = async (emailToCheck: string): Promise<boolean> => {
    if (!emailRegex.test(emailToCheck)) return false;

    try {
      const response = await fetch(
        `/api/admin/members/check-email?email=${encodeURIComponent(
          emailToCheck,
        )}`,
      );
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  // Generate username from first and last name with uniqueness check
  const generateUsername = async (first: string, last: string) => {
    if (!first || !last) {
      setGeneratedUsername("");
      setValidation((prev) => ({
        ...prev,
        usernameAvailable: null,
        usernameAdjusted: false,
      }));
      return;
    }

    setValidation((prev) => ({
      ...prev,
      checkingUsername: true,
      error: null,
      usernameAdjusted: false,
    }));

    // Transliterate and sanitize names
    const sanitizedFirst = transliterate(first);
    const sanitizedLast = transliterate(last);

    if (!sanitizedFirst || !sanitizedLast) {
      setValidation((prev) => ({
        ...prev,
        checkingUsername: false,
        error: "Names must contain valid characters for username generation",
      }));
      return;
    }

    // Generate base username
    let baseUsername = `${sanitizedFirst}.${sanitizedLast}`;
    let finalUsername = baseUsername;
    let isAvailable = await checkUsername(finalUsername);
    let wasAdjusted = false;

    // If taken, try incrementing suffix
    if (!isAvailable) {
      wasAdjusted = true;
      for (let i = 2; i <= 99; i++) {
        finalUsername = `${baseUsername}-${i}`;
        isAvailable = await checkUsername(finalUsername);
        if (isAvailable) break;
      }
    }

    // If still not available after 99 attempts
    if (!isAvailable) {
      setValidation((prev) => ({
        ...prev,
        checkingUsername: false,
        usernameAvailable: false,
        error: "Couldn't generate a unique username. Try different names.",
      }));
      setGeneratedUsername("");
      return;
    }

    setGeneratedUsername(finalUsername);
    setValidation((prev) => ({
      ...prev,
      checkingUsername: false,
      usernameAvailable: true,
      usernameAdjusted: wasAdjusted,
    }));
  };

  // Validate email with debounced check
  const validateEmail = async (emailToValidate: string) => {
    if (!emailToValidate) {
      setValidation((prev) => ({ ...prev, emailAvailable: null }));
      return;
    }

    if (!emailRegex.test(emailToValidate)) {
      setValidation((prev) => ({
        ...prev,
        emailAvailable: false,
        error: "Please enter a valid email address (e.g., user@example.com)",
      }));
      return;
    }

    setValidation((prev) => ({ ...prev, checkingEmail: true, error: null }));

    const available = await checkEmail(emailToValidate);

    setValidation((prev) => ({
      ...prev,
      checkingEmail: false,
      emailAvailable: available,
      error: available
        ? null
        : "Email already registered. Try a different email.",
    }));
  };

  // Debounced handlers (use useMemo to avoid recreating on every render)
  const debouncedGenerateUsername = useMemo(
    () =>
      debounce((first: string, last: string) => {
        generateUsername(first, last);
      }, 300),
    [],
  );

  const debouncedValidateEmail = useMemo(
    () =>
      debounce((emailValue: string) => {
        validateEmail(emailValue);
      }, 300),
    [],
  );

  // Update username when names change
  useEffect(() => {
    if (firstName && lastName) {
      debouncedGenerateUsername(firstName, lastName);
    } else {
      setGeneratedUsername("");
      setValidation((prev) => ({ ...prev, usernameAvailable: null }));
    }

    // Cleanup: cancel pending debounce on unmount or when dependencies change
    return () => {
      debouncedGenerateUsername.cancel();
    };
  }, [firstName, lastName, debouncedGenerateUsername]);

  // Validate email when it changes
  useEffect(() => {
    if (email) {
      debouncedValidateEmail(email);
    } else {
      setValidation((prev) => ({ ...prev, emailAvailable: null }));
    }

    // Cleanup: cancel pending debounce on unmount or when dependencies change
    return () => {
      debouncedValidateEmail.cancel();
    };
  }, [email, debouncedValidateEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !generatedUsername
    ) {
      setValidation((prev) => ({
        ...prev,
        error: "Given name, family name, and email are required.",
      }));
      return;
    }

    if (!validation.usernameAvailable || !validation.emailAvailable) {
      setValidation((prev) => ({
        ...prev,
        error: "Fix the errors above before creating the member.",
      }));
      return;
    }

    setSubmitting(true);
    setValidation((prev) => ({ ...prev, error: null }));

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          username: generatedUsername,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show password display modal
        setPasswordDisplay({
          show: true,
          password: data.generatedPassword,
          username: data.data.username,
          email: data.data.email,
          userId: data.data.id,
          copied: false,
          passwordVisible: false,
        });

        // Reset form
        setFirstName("");
        setLastName("");
        setEmail("");
        setGeneratedUsername("");
        setValidation({
          checkingUsername: false,
          checkingEmail: false,
          usernameAvailable: null,
          emailAvailable: null,
          error: null,
          usernameAdjusted: false,
        });
      } else {
        setValidation((prev) => ({
          ...prev,
          error: data.error || "Couldn't create member. Try again.",
        }));
      }
    } catch (error) {
      console.error("Error creating member:", error);
      setValidation((prev) => ({
        ...prev,
        error: "Unable to connect. Check your connection and try again.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(passwordDisplay.password);
      setPasswordDisplay((prev) => ({ ...prev, copied: true }));
      setTimeout(() => {
        setPasswordDisplay((prev) => ({ ...prev, copied: false }));
      }, 2000);
    } catch (error) {
      console.error("Failed to copy password:", error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setPasswordDisplay((prev) => ({
      ...prev,
      passwordVisible: !prev.passwordVisible,
    }));
  };

  const handleGoToProfile = () => {
    setPasswordDisplay({
      show: false,
      password: "",
      username: "",
      email: "",
      userId: "",
      copied: false,
      passwordVisible: false,
    });
    onClose();
    router.push(
      `/admin/members/${passwordDisplay.userId}?returnTo=/admin/members&edit=true`,
    );
  };

  const handleClosePasswordDisplay = () => {
    setPasswordDisplay({
      show: false,
      password: "",
      username: "",
      email: "",
      userId: "",
      copied: false,
      passwordVisible: false,
    });
    onClose();
    onSuccess();
  };

  const handleClose = () => {
    if (!passwordDisplay.show) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setGeneratedUsername("");
      setValidation({
        checkingUsername: false,
        checkingEmail: false,
        usernameAvailable: null,
        emailAvailable: null,
        error: null,
        usernameAdjusted: false,
      });
      onClose();
    }
  };

  // Show password display modal
  if (passwordDisplay.show) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={() => {}} // Prevent closing during password display
        title="Member Created Successfully"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-primary-900/20 border border-primary-400/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-primary-200 font-semibold mb-1">
                  Save this password now—it won't be shown again
                </p>
                <p className="text-xs text-primary-300">
                  Share with the new user via secure messaging or in person.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200">
                Account is verified and ready to use. User can log in
                immediately with username{" "}
                <span className="font-mono">{passwordDisplay.username}</span>{" "}
                and the generated password.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="display-username"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Username
              </label>
              <p
                id="display-username"
                className="text-white font-mono bg-dark-800 p-3 rounded border border-dark-600 break-all"
              >
                {passwordDisplay.username}
              </p>
            </div>

            <div>
              <label
                htmlFor="display-email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Email
              </label>
              <p
                id="display-email"
                className="text-white font-mono bg-dark-800 p-3 rounded border border-dark-600 break-all"
              >
                {passwordDisplay.email}
              </p>
            </div>

            <div>
              <label
                htmlFor="display-password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Generated Password
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <div
                    id="display-password"
                    className="text-white font-mono bg-dark-800 p-4 rounded border border-dark-600 break-all text-base select-all"
                    style={{ minHeight: "3.5rem" }}
                  >
                    {passwordDisplay.passwordVisible
                      ? passwordDisplay.password
                      : "•".repeat(passwordDisplay.password.length)}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleTogglePasswordVisibility}
                      className="flex items-center gap-2 h-11"
                    >
                      {passwordDisplay.passwordVisible ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Show
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyPassword}
                      className="flex items-center gap-2 flex-1 h-11"
                    >
                      {passwordDisplay.copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Password
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              variant="primary"
              onClick={handleGoToProfile}
              className="w-full h-12"
            >
              Go to Profile & Complete Setup
            </Button>
            <button
              type="button"
              onClick={handleClosePasswordDisplay}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              I'll do this later
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Main creation form
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Member"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Given Name"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter given name"
            disabled={submitting}
          />
          <Input
            label="Family Name"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter family name"
            disabled={submitting}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="email-input"
            className="block text-sm font-medium text-gray-300"
          >
            Email
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={submitting}
              className="flex-1"
            />
            {validation.checkingEmail && (
              <Loader2 className="h-5 w-5 text-primary-400 animate-spin shrink-0" />
            )}
            {!validation.checkingEmail && validation.emailAvailable && (
              <Check className="h-5 w-5 text-green-400 shrink-0" />
            )}
            {!validation.checkingEmail &&
              validation.emailAvailable === false &&
              email && (
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              )}
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="username-display"
            className="block text-sm font-medium text-gray-300"
          >
            Username (auto-generated)
          </label>
          <div className="flex items-center gap-2">
            <div
              id="username-display"
              className="flex-1 bg-dark-800 border border-dark-600 rounded px-3 py-2 font-mono text-sm text-gray-400 break-all"
            >
              {generatedUsername || "Will be generated from name..."}
            </div>
            {validation.checkingUsername && (
              <Loader2 className="h-5 w-5 text-primary-400 animate-spin shrink-0" />
            )}
            {!validation.checkingUsername && validation.usernameAvailable && (
              <Check className="h-5 w-5 text-green-400 shrink-0" />
            )}
            {!validation.checkingUsername &&
              validation.usernameAvailable === false &&
              generatedUsername && (
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              )}
          </div>
          <div className="flex items-start gap-1 text-xs">
            <p className="text-gray-500">
              Generated automatically from given and family name
            </p>
          </div>
          {validation.usernameAdjusted && generatedUsername && (
            <div className="flex items-center gap-1 text-xs text-blue-300">
              <Check className="h-3 w-3" />
              <span>Username adjusted for uniqueness</span>
            </div>
          )}
        </div>

        {validation.error && (
          <div className="bg-red-900/20 border border-red-400/30 rounded p-3">
            <p className="text-sm text-red-300">{validation.error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
            className="h-11"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={
              submitting ||
              validation.checkingUsername ||
              validation.checkingEmail ||
              !validation.usernameAvailable ||
              !validation.emailAvailable ||
              !firstName ||
              !lastName ||
              !email
            }
            className="flex items-center gap-2 h-11"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Creating..." : "Create Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
