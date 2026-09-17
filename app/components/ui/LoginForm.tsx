"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Logo from "./Logo";
import TurnstileWidget from "./TurnstileWidget";
import {
  getTurnstileToken as getToken,
  waitForTurnstileToken as waitForToken,
  resetTurnstile as resetWidget,
} from "@/src/lib/turnstileUtils";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!captchaReady) return;

    setLoading(true);

    try {
      // Get Turnstile token from shared utility
      const token = await waitForToken(10000, turnstileToken);

      if (!token) {
        setError("Complete the bot check to continue.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        username,
        password,
        turnstileToken: token,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Incorrect email/username or password. Check your credentials and try again.",
        );
      } else {
        router.push("/home");
        router.refresh();
      }
    } catch (error) {
      setError("Unable to sign in. Check your connection and try again.");
    } finally {
      setTurnstileToken("");
      resetWidget();
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-linear-to-br from-primary-500/10 to-earth-500/10 rounded-2xl blur-xl"></div>

      {/* Main form container */}
      <div className="relative bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Logo integrated into form */}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-400 mb-2">
            Sign In
          </h1>
          <p className="text-gray-400 text-sm">
            Welcome back! Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-300"
            >
              Email Address or Username <span className="text-red-400">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full h-12 bg-dark-800/70 border-2 border-dark-600 rounded-lg px-4 text-gray-100 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-400/20 backdrop-blur-sm hover:border-dark-500"
              placeholder="name@example.com or yourusername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              You can login with either your email or username
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="w-full h-12 bg-dark-800/70 border-2 border-dark-600 rounded-lg px-4 pr-12 text-gray-100 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-400/20 backdrop-blur-sm hover:border-dark-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-400 transition-colors duration-200 p-3 -m-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
          </div>

          {/* Existing Member Info */}
          <div
            className="bg-primary-900/30 border border-primary-500/30 rounded-lg p-3"
            role="note"
          >
            <p className="text-gray-300 text-sm">
              Forgot your password? Use the{" "}
              <Link
                href="/forgot-password"
                className="text-primary-400 hover:text-primary-300 underline font-semibold"
              >
                password reset link
              </Link>{" "}
              below instead of creating a new account.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
              {error.includes("verify") && (
                <Link
                  href="/resend-verification"
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
              Loading security verification… This should appear automatically.
              If it doesn’t, disable ad blockers or tracking protection.
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !captchaReady}
            className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-dark-700 disabled:to-dark-600 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 disabled:cursor-not-allowed"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {/* Forgot Password & Register Links */}
          <div className="flex justify-between items-center text-sm">
            <Link
              href="/forgot-password"
              className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
            >
              Forgot password?
            </Link>
            <Link
              href="/register"
              className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
            >
              Create account
            </Link>
          </div>

          {/* Back to Main Site */}
          <div className="text-center pt-2">
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
    </div>
  );
}
