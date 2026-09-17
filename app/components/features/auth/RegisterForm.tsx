"use client";

import { useState } from "react";
import { SITE_NAME } from "@/src/config/site";
import { useRouter } from "next/navigation";
import { Check, Copy, Eye, EyeOff, Mail, User, UserCircle } from "lucide-react";
import { Logo, PasswordStrengthIndicator, TurnstileWidget } from "@/components/ui";
import { generateStrongPassword } from "@/src/lib/passwordStrength";
import Link from "next/link";
import { LegalDocumentModal } from "@/app/components/features/legal";
import { waitForTurnstileToken, resetTurnstile } from "@/src/lib/turnstileUtils";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    username: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [consentsAccepted, setConsentsAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const router = useRouter();

  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    const value = text?.trim();
    if (!value) return false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // fall through to legacy fallback
      }
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!captchaReady) return;

    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!consentsAccepted) {
      setError("You must accept the Privacy Policy and Terms of Service to register.");
      setLoading(false);
      return;
    }

    try {
      // Get Turnstile token
      const token = await waitForTurnstileToken(10000, turnstileToken);

      if (!token) {
        setError("Complete the bot check to continue.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          username: formData.username || undefined,
          turnstileToken: token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch (error) {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setTurnstileToken("");
      resetTurnstile();
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-linear-to-br from-primary-500/10 to-earth-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-start mb-6">
            <Logo size="lg" />
          </div>
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2">Registration Successful!</h3>
              <p className="text-gray-300 text-sm">
                We've sent a verification email to{" "}
                <span className="font-semibold">{formData.email}</span>
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Please check your inbox and click the verification link to activate your account.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-linear-to-br from-primary-500/10 to-earth-500/10 rounded-2xl blur-xl"></div>

      <div className="relative bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex justify-start mb-6">
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
            aria-label="Go to home page"
          >
            <Logo size="lg" />
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-400 mb-2">Create Account</h1>
          <p className="text-gray-400 text-sm">Join {SITE_NAME}</p>
        </div>

        {/* Existing Member Warning */}
        <div
          className="bg-primary-900/30 border border-primary-500/30 rounded-lg p-3 mb-5"
          role="note"
        >
          <p className="text-gray-300 text-sm">
            Already a member? Please use the{" "}
            <Link
              href="/login"
              className="text-primary-400 hover:text-primary-300 underline font-semibold"
            >
              login form
            </Link>{" "}
            or{" "}
            <Link
              href="/forgot-password"
              className="text-primary-400 hover:text-primary-300 underline font-semibold"
            >
              password reset
            </Link>{" "}
            feature to access your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full h-12 bg-dark-800/70 border-2 border-dark-600 rounded-lg pl-11 pr-4 text-gray-100 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-400/20 backdrop-blur-sm hover:border-dark-500"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500">Example: name@example.com</p>
          </div>

          {/* Display Name Field */}
          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">
              Display Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                className="w-full h-12 bg-dark-800/70 border-2 border-dark-600 rounded-lg pl-11 pr-4 text-gray-100 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-400/20 backdrop-blur-sm hover:border-dark-500"
                placeholder="John Doe"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Username Field (Optional) */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username (optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                className="w-full h-12 bg-dark-800/70 border-2 border-dark-600 rounded-lg pl-11 pr-4 text-gray-100 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-400/20 backdrop-blur-sm hover:border-dark-500"
                placeholder="Auto-generated from email if blank"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500">Leave blank to auto-generate from your email</p>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password <span className="text-red-400">*</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyTextToClipboard(formData.password);
                    if (!ok) {
                      setError(
                        "Copy failed. Your browser may block clipboard access (requires HTTPS or localhost)."
                      );
                      return;
                    }

                    setError("");
                    setCopiedPassword(true);
                    window.setTimeout(() => setCopiedPassword(false), 1500);
                  }}
                  className="text-gray-400 hover:text-primary-400 transition-colors disabled:opacity-50 disabled:hover:text-gray-400"
                  disabled={loading || !formData.password}
                  aria-label="Copy password"
                  title={copiedPassword ? "Copied" : "Copy"}
                >
                  {copiedPassword ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    try {
                      const generated = generateStrongPassword(18);
                      setFormData({
                        ...formData,
                        password: generated,
                        confirmPassword: generated,
                      });
                      setShowPassword(true);
                      setShowConfirmPassword(true);
                      setCopiedPassword(false);
                      setError("");
                    } catch {
                      setError("Password generation is not available in this browser/environment.");
                    }
                  }}
                  className="text-primary-400 hover:text-primary-300 text-sm font-semibold transition-colors"
                  disabled={loading}
                >
                  Generate
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="w-full h-12 bg-dark-800/70 border-2 border-dark-600 rounded-lg px-4 pr-12 text-gray-100 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-400/20 backdrop-blur-sm hover:border-dark-500"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => {
                  setCopiedPassword(false);
                  setFormData({ ...formData, password: e.target.value });
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-400 transition-colors duration-200 p-2 -m-2"
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>

            {formData.password && <PasswordStrengthIndicator password={formData.password} />}
            <p className="text-xs text-gray-500">Minimum 8 characters, one letter, one number</p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="w-full h-12 bg-dark-800/70 border-2 border-dark-600 rounded-lg px-4 pr-12 text-gray-100 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-400/20 backdrop-blur-sm hover:border-dark-500"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-400 transition-colors duration-200 p-2 -m-2"
                disabled={loading}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Consent Acceptance */}
          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentsAccepted}
                onChange={(e) => setConsentsAccepted(e.target.checked)}
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900"
              />
              <span className="text-sm text-dark-200 group-hover:text-white transition-colors">
                By registering, you accept our{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-primary-400 hover:text-primary-300 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 rounded"
                >
                  Privacy Policy
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-primary-400 hover:text-primary-300 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 rounded"
                >
                  Terms of Service
                </button>
              </span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Cloudflare Turnstile - Invisible Bot Protection */}
          <TurnstileWidget
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
            theme="dark"
            size="normal"
            appearance="interaction-only"
            onReady={setCaptchaReady}
            onToken={setTurnstileToken}
          />

          {!captchaReady && !loading && (
            <p className="text-xs text-gray-500">
              Loading security verification… This should appear automatically. If it doesn’t,
              disable ad blockers or tracking protection.
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !captchaReady}
            className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-dark-700 disabled:to-dark-600 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Login Link */}
          <div className="text-center text-sm">
            <span className="text-gray-400">Already have an account? </span>
            <Link
              href="/login"
              className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Back to Main Site Link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-gray-400 hover:text-primary-400 text-sm transition-colors"
              aria-label="Return to main site home page"
            >
              ← Back to main site
            </Link>
          </div>
        </form>
      </div>

      {/* Legal Document Modals */}
      <LegalDocumentModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        documentType="privacy-policy"
      />

      <LegalDocumentModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        documentType="terms-of-service"
      />
    </div>
  );
}
