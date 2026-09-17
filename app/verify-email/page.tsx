"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Logo from "@/app/components/ui/Logo";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [token]);

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
              {status === "loading" && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
                  <p className="text-gray-300">Verifying your email...</p>
                </div>
              )}

              {status === "success" && (
                <>
                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-green-400 font-semibold mb-1">
                        Email Verified!
                      </h3>
                      <p className="text-gray-300 text-sm">{message}</p>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center"
                  >
                    Continue to Login
                  </Link>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                    <XCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-red-400 font-semibold mb-1">
                        Verification Failed
                      </h3>
                      <p className="text-gray-300 text-sm">{message}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/resend-verification"
                      className="flex-1 h-12 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center"
                    >
                      Request New Link
                    </Link>
                    <Link
                      href="/login"
                      className="flex-1 h-12 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-gray-300 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center"
                    >
                      Back to Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-dark-950">
          <div className="text-dark-400">Verifying email...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
