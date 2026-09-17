"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Logo, TurnstileWidget } from "@/components/ui";
import Link from "next/link";
import {
  waitForTurnstileToken,
  resetTurnstile,
} from "@/src/lib/turnstileUtils";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);

    if (!captchaReady) return;

    setLoading(true);

    try {
      // Get Turnstile token
      const token = await waitForTurnstileToken(10000, turnstileToken);

      if (!token) {
        setError("Complete the bot check to continue.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
          setError(data.error);
        } else {
          setError(
            data.error || "Couldn't send reset email. Please try again."
          );
        }
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
              <h3 className="text-green-400 font-semibold mb-2">
                Reset Email Sent!
              </h3>
              <p className="text-gray-300 text-sm">
                If an account exists with{" "}
                <span className="font-semibold">{email}</span>, you'll receive
                password reset instructions.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Please check your inbox and follow the link to reset your
                password. The link will expire in 1 hour.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center"
            >
              Back to Login
            </Link>
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
            Forgot Password?
          </h1>
          <p className="text-gray-400 text-sm">
            Enter your email address or username and we'll send you instructions
            to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email or Username Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email or Username <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                className="w-full h-12 bg-dark-800/70 border-2 border-dark-600 rounded-lg pl-11 pr-4 text-gray-100 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-400/20 backdrop-blur-sm hover:border-dark-500"
                placeholder="your.email@example.com or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter your email address or username
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
              {needsVerification && (
                <Link
                  href={`/resend-verification?email=${encodeURIComponent(
                    email
                  )}`}
                  className="text-primary-400 hover:text-primary-300 text-sm font-semibold mt-2 inline-block"
                >
                  Resend verification email →
                </Link>
              )}
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
            {loading ? "Sending..." : "Send Reset Link"}
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
