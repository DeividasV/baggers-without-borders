"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ConsentAcceptanceDialog } from "@/app/components/features/legal";

export default function ConsentPromptContent() {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      // Accept all required consents (API will find and update them)
      const response = await fetch("/api/users/accept-consents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Consent acceptance failed:", {
          status: response.status,
          error: errorData,
        });
        throw new Error(
          errorData.error || "Unable to save your acceptance. Please try again."
        );
      }

      // Redirect to home page
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error accepting consents:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save your acceptance. Please try again."
      );
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    // Sign out user and redirect to login
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  if (isAccepting) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-dark-200">Recording your acceptance...</p>
        </div>
      </div>
    );
  }

  return (
    <ConsentAcceptanceDialog
      onAccept={handleAccept}
      onReject={handleReject}
      showRejectButton={true}
      mode="prompt"
    />
  );
}
