"use client";

import { useEffect, useState } from "react";
import { MarkdownViewer } from "@/app/components/ui";
import { Maximize2, X } from "lucide-react";

interface MeisterReportProps {
  config: {
    meisterReportContent?: string | null;
    meisterReportImage?: string | null;
    updatedAt?: string | null;
    meisterReportImageTitle?: string | null;
    meisterReportImageAttribution?: string | null;
    hofmeister?: {
      displayName: string;
      username: string;
    } | null;
  } | null;
  hofLabel: string;
  yearLabel: string;
}

/**
 * MeisterReport component displays the HoF Meister's report with optional image
 * Only renders if meisterReportContent exists
 */
export default function MeisterReport({
  config,
  hofLabel,
  yearLabel,
}: MeisterReportProps) {
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  // Handle Esc key to close image zoom
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isImageZoomed) {
        setIsImageZoomed(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isImageZoomed]);

  // Only display if report content exists
  if (!config?.meisterReportContent) {
    return null;
  }

  // Check if content is long (more than ~500 characters)
  const isLongContent = config.meisterReportContent.length > 500;
  const shouldShowReadMore = isLongContent && !isTextExpanded;

  const imageAlt =
    config.meisterReportImageTitle ||
    `${
      config.hofmeister?.displayName || "HoF Meister"
    } report image for ${hofLabel} ${yearLabel}`;

  const meisterReportImageUrl = config.meisterReportImage
    ? `${config.meisterReportImage}?v=${encodeURIComponent(config.updatedAt || "")}`
    : null;

  return (
    <>
      <div className="card mb-6 overflow-hidden">
        {/* Header */}
        <div className="border-b border-dark-600 pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-200 mb-2">
            HoF Meister Report
          </h2>
          {config.hofmeister && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Report by:</span>
              <span className="text-primary-400 font-medium">
                {config.hofmeister.displayName}
              </span>
              <span className="text-gray-500">
                for {hofLabel} {yearLabel}
              </span>
            </div>
          )}
        </div>

        {/* Content Layout - Responsive */}
        <div
          className={`relative after:content-[''] after:table after:clear-both ${
            shouldShowReadMore ? "max-h-75 overflow-hidden" : ""
          }`}
        >
          {/* Image - Floated right on large screens, top on small/medium */}
          {meisterReportImageUrl && (
            <div className="mb-4 lg:float-right lg:ml-6 lg:mb-4 lg:w-80">
              <div className="space-y-2">
                <button
                  type="button"
                  className="relative group cursor-zoom-in w-full text-left bg-transparent border-0 p-0"
                  onClick={() => setIsImageZoomed(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsImageZoomed(true);
                    }
                  }}
                  aria-label="Open image in fullscreen preview"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="absolute top-2 right-2 z-10 p-2 rounded-md bg-dark-900/70 border border-dark-600 text-gray-200 opacity-90 group-hover:opacity-100 transition-opacity hover:bg-dark-800/80 cursor-pointer"
                    aria-label="Open image fullscreen preview"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsImageZoomed(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsImageZoomed(true);
                      }
                    }}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <img
                    src={meisterReportImageUrl}
                    alt={imageAlt}
                    loading="lazy"
                    className="w-full h-auto rounded-lg border border-dark-600 object-contain transition-all group-hover:border-primary-500/50"
                  />
                  <div
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center pointer-events-none"
                    aria-hidden="true"
                  >
                    <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>

                {/* Image Title and Attribution - Always show if content exists */}
                <div className="space-y-2 mt-3">
                  {config.meisterReportImageTitle && (
                    <p className="text-sm text-gray-200 font-semibold leading-snug">
                      {config.meisterReportImageTitle}
                    </p>
                  )}
                  {config.meisterReportImageAttribution && (
                    <p className="text-xs text-gray-400 italic leading-relaxed">
                      {config.meisterReportImageAttribution}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Report Content - Wraps around image */}
          <div className="relative">
            <div
              className={`prose prose-invert prose-sm max-w-none transition-all duration-300 
                [&>h1]:text-base [&>h1]:font-bold [&>h1]:mt-6 [&>h1]:mb-3
                [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mt-5 [&>h2]:mb-2
                [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mt-4 [&>h3]:mb-2
                [&>h4]:text-xs [&>h4]:font-medium [&>h4]:mt-3 [&>h4]:mb-1
                `}
            >
              <MarkdownViewer content={config.meisterReportContent} />
            </div>

            {/* Show Less button when expanded */}
            {isTextExpanded && isLongContent && (
              <div className="mt-4 text-center">
                <button
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-400 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => setIsTextExpanded(false)}
                >
                  Show Less
                </button>
              </div>
            )}
          </div>

          {/* Fade overlay and Read More button - positioned at parent level to cover everything */}
          {shouldShowReadMore && (
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-dark-900 via-dark-900/80 to-transparent z-20 pointer-events-none">
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <button
                  className="px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg text-sm font-medium transition-colors border border-primary-600/30 pointer-events-auto"
                  onClick={() => setIsTextExpanded(true)}
                >
                  Read More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {isImageZoomed && meisterReportImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageZoomed(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsImageZoomed(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged report image"
          tabIndex={-1}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-dark-800/80 hover:bg-dark-700 rounded-lg transition-colors"
            onClick={() => setIsImageZoomed(false)}
            aria-label="Close image preview"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
          <div
            className="max-w-7xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={meisterReportImageUrl}
              alt={imageAlt}
              className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
            />

            {/* Image Title and Attribution in Zoom Modal */}
            <div className="text-center mt-6 space-y-3 px-4 max-w-4xl mx-auto">
              {config.meisterReportImageTitle && (
                <p className="text-xl text-gray-100 font-bold leading-tight">
                  {config.meisterReportImageTitle}
                </p>
              )}
              {config.meisterReportImageAttribution && (
                <p className="text-base text-gray-300 italic">
                  {config.meisterReportImageAttribution}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
