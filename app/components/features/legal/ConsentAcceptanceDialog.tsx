"use client";

import { useState } from "react";
import LegalDocumentModal from "./LegalDocumentModal";

interface ConsentAcceptanceDialogProps {
  onAccept: () => void;
  onReject?: () => void;
  showRejectButton?: boolean;
  mode?: "registration" | "prompt";
}

export default function ConsentAcceptanceDialog({
  onAccept,
  onReject,
  showRejectButton = false,
  mode = "registration",
}: ConsentAcceptanceDialogProps) {
  const [accepted, setAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleAcceptClick = () => {
    if (accepted) {
      onAccept();
    }
  };

  const text =
    mode === "registration"
      ? "By registering, you're accepting our"
      : "By using this site, you're accepting our";

  return (
    <>
      {/* Main blocking dialog - no backdrop, no ESC close */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/95"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-dialog-title"
      >
        <div className="bg-dark-800 rounded-lg border border-dark-700 shadow-xl max-w-md w-full mx-4">
          {/* Header */}
          <div className="border-b border-dark-700 px-6 py-4">
            <h2
              id="consent-dialog-title"
              className="text-xl font-semibold text-white"
            >
              {mode === "registration"
                ? "Accept Terms to Continue"
                : "Terms and Privacy Policy"}
            </h2>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-4">
            <p className="text-dark-200 text-sm leading-relaxed">
              {text}{" "}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-primary-400 hover:text-primary-300 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800 rounded"
              >
                Privacy Policy
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-primary-400 hover:text-primary-300 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800 rounded"
              >
                Terms of Service
              </button>
              .
            </p>

            {/* Checkbox */}
            <label
              htmlFor="consent-checkbox"
              className="flex items-start space-x-3 cursor-pointer group"
            >
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800"
                aria-required="true"
              />
              <span className="text-sm text-dark-200 group-hover:text-white transition-colors">
                I have read and accept the Privacy Policy and Terms of Service
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="border-t border-dark-700 px-6 py-4 flex items-center justify-end space-x-3">
            {showRejectButton && onReject && (
              <button
                onClick={onReject}
                className="px-4 py-2 text-sm font-medium text-dark-300 hover:text-white bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dark-500 focus:ring-offset-2 focus:ring-offset-dark-800"
              >
                Log Out
              </button>
            )}
            <button
              onClick={handleAcceptClick}
              disabled={!accepted}
              aria-disabled={!accepted}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800 ${
                accepted
                  ? "bg-primary-600 hover:bg-primary-700 text-white"
                  : "bg-dark-700 text-dark-500 cursor-not-allowed"
              }`}
            >
              Accept
            </button>
          </div>
        </div>
      </div>

      {/* Nested modals for viewing documents */}
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
    </>
  );
}
