"use client";

import { useState, useEffect } from "react";
import Modal from "@/app/components/ui/Modal";
import MarkdownViewer from "@/app/components/ui/MarkdownViewer";

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: "privacy-policy" | "terms-of-service";
}

export default function LegalDocumentModal({
  isOpen,
  onClose,
  documentType,
}: LegalDocumentModalProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDocument();
    }
  }, [isOpen, documentType]);

  const fetchDocument = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/legal/${documentType}`);

      if (!response.ok) {
        throw new Error("Failed to load document");
      }

      const text = await response.text();
      setContent(text);
    } catch (err) {
      console.error("Error fetching legal document:", err);
      setError("Unable to load this document. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const title =
    documentType === "privacy-policy" ? "Privacy Policy" : "Terms of Service";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
      showCloseButton={true}
    >
      <div className="flex flex-col max-h-[70vh]">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div
              className="flex items-center justify-center py-8"
              role="status"
              aria-live="polite"
            >
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"
                aria-hidden="true"
              ></div>
              <span className="sr-only">Loading document...</span>
            </div>
          )}

          {error && (
            <div
              className="text-red-400 text-center py-8"
              role="alert"
              aria-live="assertive"
            >
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && content && (
            <MarkdownViewer
              content={content}
              className="prose prose-invert prose-sm max-w-none"
            />
          )}
        </div>

        {/* Footer with close button */}
        {!loading && !error && content && (
          <div className="border-t border-dark-700 px-6 py-4 bg-dark-800/50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
