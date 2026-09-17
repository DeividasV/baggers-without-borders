"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import Logo from "@/app/components/ui/Logo";
import TurnstileWidget from "@/app/components/ui/TurnstileWidget";
import Link from "next/link";

function ResendVerificationForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState(emailParam || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const getTurnstileToken = () => {
    const stateToken = turnstileToken?.trim();
    if (stateToken) return stateToken;

    const responseField = document.querySelector(
      '[name="cf-turnstile-response"]'
    ) as HTMLInputElement | HTMLTextAreaElement | null;

    const fieldValue = responseField?.value?.trim();
    if (fieldValue) return fieldValue;

    const turnstile = (window as any)?.turnstile;
    const response = turnstile?.getResponse?.();
    return typeof response === "string" && response.trim() ? response : "";
  };

  const waitForTurnstileToken = async (maxMs = 10000) => {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      const token = getTurnstileToken();
      if (token) return token;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return "";
  };

  const resetTurnstile = () => {
    setTurnstileToken("");

    const responseField = document.querySelector(
      '[name="cf-turnstile-response"]'
    ) as HTMLInputElement | HTMLTextAreaElement | null;
    if (responseField) responseField.value = "";

    try {
      (window as any)?.turnstile?.reset?.();
    } catch {
      // best-effort reset
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!captchaReady) return;

    setLoading(true);

    try {
      // Get Turnstile token
      const turnstileToken = await waitForTurnstileToken();

      if (!turnstileToken) {
        setError("Please complete the CAPTCHA verification to continue.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend verification email");
      } else {
        setSuccess(true);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      resetTurnstile();
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="max-w-md w-full p-8">
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-br from-primary-500/10 to-earth-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
              <div className="flex justify-start mb-6">
                <Logo size="lg" />
              </div>
              <div className="space-y-4">
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                  <h3 className="text-green-400 font-semibold mb-2">
                    Verification Email Sent!
                  </h3>
                  <p className="text-gray-300 text-sm">
                    We've sent a new verification email to{" "}
                    <span className="font-semibold">{email}</span>
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Please check your inbox and click the verification link.
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="max-w-md w-full p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-br from-primary-500/10 to-earth-500/10 rounded-2xl blur-xl"></div>

          <div className="relative bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
            <div className="flex justify-start mb-6">
              <Logo size="lg" />
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                Resend Verification
              </h2>
              <p className="text-gray-400 text-sm">
                Enter your email address to receive a new verification link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300"
                >
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Example: name@example.com
                </p>
              </div>

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
                  Loading spam protection… This should appear automatically. If
                  it doesn’t, disable ad blockers or tracking protection.
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !captchaReady}
                className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-dark-700 disabled:to-dark-600 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Resend Verification Email"}
              </button>

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
      </div>
    </div>
  );
}

export default function ResendVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-dark-950">
          <div className="text-dark-400">Loading form...</div>
        </div>
      }
    >
      <ResendVerificationForm />
    </Suspense>
  );
}
