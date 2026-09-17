"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import {
  Logo,
  PasswordStrengthIndicator,
  TurnstileWidget,
} from "@/components/ui";
import { generateStrongPassword } from "@/src/lib/passwordStrength";
import Link from "next/link";
import {
  waitForTurnstileToken,
  resetTurnstile,
} from "@/src/lib/turnstileUtils";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

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

  if (!token) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-linear-to-br from-primary-500/10 to-earth-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-start mb-6">
            <Logo size="lg" />
          </div>
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">
              Invalid or missing reset token. Please request a new password
              reset.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center mt-4"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!captchaReady) return;

    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const turnstileTokenValue = await waitForTurnstileToken(
        10000,
        turnstileToken
      );

      if (!turnstileTokenValue) {
        setError("Complete the bot check to continue.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
          turnstileToken: turnstileTokenValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Password reset failed");
        if (data.expired) {
          setTimeout(() => router.push("/forgot-password"), 3000);
        }
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
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
              <h3 className="text-green-400 font-semibold mb-2">
                Password Reset Successful!
              </h3>
              <p className="text-gray-300 text-sm">
                Your password has been reset. Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-linear-to-br from-primary-500/10 to-earth-500/10 rounded-2xl blur-xl"></div>

      <div className="relative bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-start mb-6">
          <Logo size="lg" />
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-400 mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-400 text-sm">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="newPassword"
                className="text-sm font-medium text-gray-300"
              >
                New Password <span className="text-red-400">*</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyTextToClipboard(formData.newPassword);
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
                  disabled={loading || !formData.newPassword}
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
                        newPassword: generated,
                        confirmPassword: generated,
                      });
                      setShowPassword(true);
                      setShowConfirmPassword(true);
                      setCopiedPassword(false);
                      setError("");
                    } catch {
                      setError(
                        "Password generation isn't supported in your browser."
                      );
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
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="w-full h-12 bg-dark-800/70 border-2 border-dark-600 rounded-lg px-4 pr-12 text-gray-100 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-400/20 backdrop-blur-sm hover:border-dark-500"
                placeholder="At least 8 characters"
                value={formData.newPassword}
                onChange={(e) => {
                  setCopiedPassword(false);
                  setFormData({ ...formData, newPassword: e.target.value });
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-400 transition-colors duration-200"
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {formData.newPassword && (
              <PasswordStrengthIndicator password={formData.newPassword} />
            )}
            <p className="text-xs text-gray-500">
              Minimum 8 characters, one letter, one number
            </p>
          </div>

          {/* Confirm New Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300"
            >
              Confirm New Password <span className="text-red-400">*</span>
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
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-400 transition-colors duration-200"
                disabled={loading}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
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
              Loading spam protection… This should appear automatically. If it
              doesn’t, disable ad blockers or tracking protection.
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !captchaReady}
            className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-dark-700 disabled:to-dark-600 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 disabled:cursor-not-allowed"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          {/* Back to Login Link */}
          <div className="text-center text-sm">
            <Link
              href="/login"
              className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
