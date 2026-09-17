"use client";

import {
  Children,
  cloneElement,
  memo,
  isValidElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { applyMarkdownTableColumnAlignment } from "@/src/lib/markdown-table-alignment";
import { getMarkdownTableStylePreset } from "@/src/lib/markdown-table-styles";
import type { JournalTableStyle } from "@/src/types/journal";

interface MarkdownViewerProps {
  content: string;
  className?: string;
  tableStyle?: JournalTableStyle;
  /** Optional map of JournalPhoto.id -> attribution/credit for inline markdown images */
  journalPhotoAttributionById?: Record<string, { attribution: string | null }>;
  /** Optional photos list used for lightbox navigation when clicking inline journal images */
  journalPhotosForLightbox?: Array<{
    id: string;
    originalName: string;
    title: string | null;
    caption: string | null;
    attribution: string | null;
  }>;
}

// Custom image renderer: parses `|left` or `|right` in alt text for float
// Renders as <figure> with <figcaption> when alt text is present
function getJournalPhotoIdFromSrc(src: unknown): string | null {
  if (typeof src !== "string" || !src) return null;
  const match = src.match(/\/api\/journal\/photos\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function createImageRenderer(
  journalPhotoAttributionById: MarkdownViewerProps["journalPhotoAttributionById"],
  journalPhotoCaptionById: Map<string, string> | null,
  journalPhotoIdToIndex: Map<string, number> | null,
  openLightbox: ((index: number) => void) | null
): Components["img"] {
  return ({ src, alt }) => {
    const rawAlt = alt ?? "";
    let float: "left" | "right" | null = null;
    let displayAlt = rawAlt;

    if (rawAlt.endsWith("|right")) {
      float = "right";
      displayAlt = rawAlt.slice(0, -6);
    } else if (rawAlt.endsWith("|left")) {
      float = "left";
      displayAlt = rawAlt.slice(0, -5);
    }

    const floatClass =
      float === "right"
        ? "float-none w-full md:float-right md:ml-6 md:w-72 lg:w-80"
        : float === "left"
          ? "float-none w-full md:float-left md:mr-6 md:w-72 lg:w-80"
          : "w-full clear-both";

    const photoId = getJournalPhotoIdFromSrc(src);
    const credit = photoId ? (journalPhotoAttributionById?.[photoId]?.attribution ?? null) : null;
    const caption = displayAlt.trim() || null;
    const description =
      photoId && journalPhotoCaptionById ? (journalPhotoCaptionById.get(photoId) ?? null) : null;

    const canOpenLightbox =
      !!photoId && !!journalPhotoIdToIndex && journalPhotoIdToIndex.has(photoId) && !!openLightbox;

    return (
      <figure className={`mb-4 not-prose ${floatClass}`}>
        {canOpenLightbox ? (
          <button
            type="button"
            onClick={() => {
              if (!photoId) return;
              const idx = journalPhotoIdToIndex!.get(photoId);
              if (idx === undefined) return;
              openLightbox!(idx);
            }}
            className="block w-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
            aria-label={`Open photo: ${displayAlt || "Photo"}`}
          >
            <img src={src} alt={displayAlt} className="rounded-lg w-full" />
          </button>
        ) : (
          <img src={src} alt={displayAlt} className="rounded-lg w-full" />
        )}

        {(caption || credit || description) && (
          <figcaption className="mt-1 text-xs px-0.5 space-y-0.5">
            {(credit || caption) && (
              <div className="text-gray-400">
                {caption && <span className="italic">{caption}</span>}
                {credit && <span className={caption ? "ml-2" : undefined}>© {credit}</span>}
              </div>
            )}
            {description && (
              <div className="text-gray-600 not-italic line-clamp-2">{description}</div>
            )}
          </figcaption>
        )}
      </figure>
    );
  };
}

// Override <p> to render as <div> when it wraps block-level content (e.g. <figure>/<img>).
// react-markdown always wraps images in <p>, but <figure> inside <p> is invalid HTML.
const ParagraphRenderer: Components["p"] = ({ children }) => {
  const blockTags = new Set([
    "address",
    "article",
    "aside",
    "blockquote",
    "details",
    "div",
    "dl",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "main",
    "nav",
    "ol",
    "p",
    "pre",
    "section",
    "table",
    "ul",
  ]);

  const hasBlockChild = Array.isArray(children)
    ? children.some(
        (child) =>
          isValidElement(child) && typeof child.type === "string" && blockTags.has(child.type)
      )
    : isValidElement(children) && typeof children.type === "string" && blockTags.has(children.type);

  return hasBlockChild ? <div className="my-4">{children}</div> : <p>{children}</p>;
};

function createTableRenderers(
  tableStyle?: JournalTableStyle
): Pick<Components, "table" | "th" | "td"> {
  const preset = getMarkdownTableStylePreset(tableStyle);

  const TableRenderer: Components["table"] = ({ children, className, ...props }) => {
    const alignedChildren = applyMarkdownTableColumnAlignment(children);

    return (
      <div className={preset.wrapperClassName}>
        <table {...props} className={`${preset.tableClassName} ${className ?? ""}`.trim()}>
          {alignedChildren}
        </table>
      </div>
    );
  };

  const TableHeaderRenderer: Components["th"] = ({ children, className, ...props }) => {
    return (
      <th {...props} className={`${preset.headerCellClassName} ${className ?? ""}`.trim()}>
        {normalizeTableCellBreaks(children)}
      </th>
    );
  };

  const TableCellRenderer: Components["td"] = ({ children, className, ...props }) => {
    return (
      <td {...props} className={`${preset.bodyCellClassName} ${className ?? ""}`.trim()}>
        {normalizeTableCellBreaks(children)}
      </td>
    );
  };

  (
    TableHeaderRenderer as typeof TableHeaderRenderer & { __bwbMarkdownTag?: "th" }
  ).__bwbMarkdownTag = "th";
  (TableCellRenderer as typeof TableCellRenderer & { __bwbMarkdownTag?: "td" }).__bwbMarkdownTag =
    "td";

  return {
    table: TableRenderer,
    th: TableHeaderRenderer,
    td: TableCellRenderer,
  };
}

function normalizeTableCellBreaks(content: ReactNode): ReactNode {
  if (typeof content === "string") {
    return content.replace(/<br\s*\/?>/gi, "\n");
  }

  if (Array.isArray(content)) {
    return Children.toArray(content).map((child, index) => {
      const normalized = normalizeTableCellBreaks(child);
      if (isValidElement(normalized) && normalized.key == null) {
        return cloneElement(normalized, { key: index });
      }
      return normalized;
    });
  }

  if (isValidElement<{ children?: ReactNode }>(content)) {
    const children = content.props?.children;
    if (children === undefined) return content;
    return cloneElement(content, {
      children: normalizeTableCellBreaks(children),
    });
  }

  return content;
}

function MarkdownViewer({
  content,
  className = "",
  tableStyle,
  journalPhotoAttributionById,
  journalPhotosForLightbox,
}: MarkdownViewerProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const photosForLightbox = journalPhotosForLightbox ?? null;
  const journalPhotoCaptionById = useMemo(() => {
    if (!photosForLightbox || photosForLightbox.length === 0) return null;
    const map = new Map<string, string>();
    for (const p of photosForLightbox) {
      if (p.caption) map.set(p.id, p.caption);
    }
    return map;
  }, [photosForLightbox]);

  const journalPhotoIdToIndex = useMemo(() => {
    if (!photosForLightbox || photosForLightbox.length === 0) return null;
    const map = new Map<string, number>();
    photosForLightbox.forEach((p, idx) => map.set(p.id, idx));
    return map;
  }, [photosForLightbox]);

  const openLightbox = useCallback(
    (index: number) => {
      if (!photosForLightbox || photosForLightbox.length === 0) return;
      lastFocusedElementRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setLightboxIndex(index);
    },
    [photosForLightbox]
  );

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    lastFocusedElementRef.current?.focus();
  }, []);

  const prev = useCallback(() => {
    if (!photosForLightbox) return;
    setLightboxIndex((i) =>
      i !== null ? (i - 1 + photosForLightbox.length) % photosForLightbox.length : null
    );
  }, [photosForLightbox]);

  const next = useCallback(() => {
    if (!photosForLightbox) return;
    setLightboxIndex((i) => (i !== null ? (i + 1) % photosForLightbox.length : null));
  }, [photosForLightbox]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, closeLightbox, prev, next]);

  // Lock body scroll when lightbox open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  // Focus close button when lightbox opens
  useEffect(() => {
    if (lightboxIndex === null) return;
    closeButtonRef.current?.focus();
  }, [lightboxIndex]);

  const activePhoto =
    lightboxIndex !== null && photosForLightbox ? photosForLightbox[lightboxIndex] : null;

  const tableComponents = useMemo(() => createTableRenderers(tableStyle), [tableStyle]);

  const components: Components = {
    img: createImageRenderer(
      journalPhotoAttributionById,
      journalPhotoCaptionById,
      journalPhotoIdToIndex,
      journalPhotoIdToIndex ? openLightbox : null
    ),
    p: ParagraphRenderer,
    ...tableComponents,
  };

  return (
    <div
      className={`prose prose-invert prose-sm max-w-none after:content-[''] after:block after:clear-both ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>

      {activePhoto && photosForLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col not-prose"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${activePhoto.title || activePhoto.originalName}`}
        >
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-gray-400 text-sm">
              {lightboxIndex !== null ? lightboxIndex + 1 : 0} / {photosForLightbox.length}
            </span>
            <button
              type="button"
              onClick={closeLightbox}
              ref={closeButtonRef}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative min-h-0 px-12">
            {photosForLightbox.length > 1 && (
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            <div className="max-h-full max-w-full flex items-center justify-center">
              <img
                src={`/api/journal/photos/${activePhoto.id}`}
                alt={activePhoto.title || activePhoto.originalName}
                className="max-h-[calc(100vh-12rem)] max-w-full object-contain rounded-lg"
              />
            </div>

            {photosForLightbox.length > 1 && (
              <button
                type="button"
                onClick={next}
                className="absolute right-2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}
          </div>

          <div className="shrink-0 px-6 py-4 text-center space-y-1">
            {activePhoto.title && <p className="text-white font-medium">{activePhoto.title}</p>}
            {activePhoto.caption && <p className="text-gray-300 text-sm">{activePhoto.caption}</p>}
            {activePhoto.attribution && (
              <p className="text-gray-500 text-xs">&copy; {activePhoto.attribution}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders (markdown parsing is expensive)
export default memo(MarkdownViewer);
