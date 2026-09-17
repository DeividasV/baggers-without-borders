"use client";

import { useState, useCallback, useRef } from "react";
import { SITE_NAME } from "@/src/config/site";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  CheckCircle,
  Archive,
  RotateCcw,
  AlertCircle,
  Quote,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Link2,
  HelpCircle,
  X,
  Image,
  Lock,
  Trash2,
} from "lucide-react";
import SearchableSelect from "@/app/components/ui/SearchableSelect";
import MarkdownViewer from "@/ui/MarkdownViewer";
import {
  JOURNAL_TYPE_LABELS,
  JOURNAL_TABLE_STYLE_LABELS,
  JOURNAL_TABLE_STYLES,
  JOURNAL_TYPES,
  JournalArticleData,
  JournalCardData,
  type JournalTableStyle,
  type JournalPhotoData,
  type JournalChildData,
  type JournalStatus,
  type JournalType,
  STATUS_LABELS,
  STATUS_COLORS,
  photoUrl,
} from "@/src/types/journal";
import PhotoUploader from "./PhotoUploader";

function isoToLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function getTodayLocalYmd(): string {
  // Convert "now" to local date string YYYY-MM-DD
  return isoToLocalDateTimeInput(new Date().toISOString()).slice(0, 10);
}

function localDateTimeInputToIso(value: string): string {
  // `YYYY-MM-DDTHH:mm` is interpreted as local time by Date.
  return new Date(value).toISOString();
}

function compareChildrenOldestFirst(
  a: Pick<JournalChildData, "publishedAt" | "title" | "id">,
  b: Pick<JournalChildData, "publishedAt" | "title" | "id">
): number {
  const aTime = a.publishedAt ? Date.parse(a.publishedAt) : null;
  const bTime = b.publishedAt ? Date.parse(b.publishedAt) : null;

  // Drafts (no publishedAt) always sort last.
  if (aTime === null && bTime !== null) return 1;
  if (aTime !== null && bTime === null) return -1;
  if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;

  const titleCmp = a.title.localeCompare(b.title);
  if (titleCmp !== 0) return titleCmp;
  return a.id.localeCompare(b.id);
}

interface Author {
  userId?: string;
  name?: string;
  order: number;
  displayLabel: string;
}

interface JournalEditorProps {
  article?: JournalArticleData;
  /** Top-level Journal records that can be used as parent issues */
  parentIssues: Pick<JournalCardData, "id" | "title" | "slug">[];
  allUsers: { id: string; displayName: string; username: string }[];
  editorUsers: { id: string; displayName: string; username: string }[];
  isEditor: boolean;
  childCandidates: {
    id: string;
    title: string;
    slug: string;
    type: JournalType;
    status: JournalStatus;
    parentId: string | null;
    publishedAt: string | null;
    parent: { id: string; title: string; slug: string } | null;
  }[];
  backTo?: string;
}

type EditMode = "edit" | "preview" | "split";

// ── Markdown formatting toolbar helpers ────────────────────────────────────
function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;
  const newValue =
    textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end);
  return {
    newValue,
    cursor: start + before.length + selected.length + after.length,
  };
}

function prefixLine(textarea: HTMLTextAreaElement, prefix: string, placeholder: string) {
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;
  const selected = textarea.value.slice(start, textarea.selectionEnd) || placeholder;
  const newValue = textarea.value.slice(0, lineStart) + prefix + textarea.value.slice(lineStart);
  return { newValue, cursor: lineStart + prefix.length + selected.length };
}

// ── Cheatsheet content ─────────────────────────────────────────────────────
const CHEATSHEET = [
  { syntax: "**bold**", description: "Bold text" },
  { syntax: "*italic*", description: "Italic text" },
  { syntax: "## Heading", description: "Level 2 heading" },
  { syntax: "### Heading", description: "Level 3 heading" },
  { syntax: "[text](url)", description: "Link" },
  { syntax: "- item", description: "Bullet list" },
  { syntax: "1. item", description: "Numbered list" },
  { syntax: "> quote", description: "Blockquote" },
  { syntax: "`code`", description: "Inline code" },
  { syntax: "![alt](url)", description: "Image (centered)" },
  {
    syntax: "![alt|right](url)",
    description: "Image floated right, text wraps",
  },
  { syntax: "![alt|left](url)", description: "Image floated left, text wraps" },
  {
    syntax: "| Name | Total | Year |",
    description: "Table header row",
    wide: true,
  },
  {
    syntax: "| :--- | ---: | ---: |",
    description: "Table alignment row: left, right, right",
    wide: true,
  },
  {
    syntax: "| Name {w:18rem} | Total {w:fit} | Year {w:7ch} |",
    description: "Optional column widths in header cells",
    wide: true,
  },
];

export default function JournalEditor({
  article,
  parentIssues,
  allUsers,
  editorUsers,
  isEditor,
  childCandidates,
  backTo,
}: JournalEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNew = !article;

  const [title, setTitle] = useState(article?.title ?? "");
  const [subtitle, setSubtitle] = useState(article?.subtitle ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [tableStyle, setTableStyle] = useState<JournalTableStyle>(article?.tableStyle ?? "legacy");
  const [type, setType] = useState<JournalType>(article?.type ?? "journal");
  const [parentId, setParentId] = useState(article?.parentId ?? "");
  const [editorId, setEditorId] = useState(
    (article as JournalArticleData & { editorId?: string | null })?.editorId ?? ""
  );
  const [authors, setAuthors] = useState<Author[]>(
    article?.authors.map((a) => ({
      userId: a.userId ?? undefined,
      name: a.name ?? undefined,
      order: a.order,
      displayLabel: a.user?.displayName ?? a.name ?? "",
    })) ?? []
  );
  const [photos, setPhotos] = useState<JournalPhotoData[]>(article?.photos ?? []);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(article?.coverPhotoId ?? null);
  const [publishedAtLocal, setPublishedAtLocal] = useState<string>(
    article?.publishedAt ? isoToLocalDateTimeInput(article.publishedAt) : ""
  );
  const [editMode, setEditMode] = useState<EditMode>(
    article?.status === "PUBLISHED" ? "preview" : "edit"
  );
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  // Child topics / articles management (only for existing records)
  const [children, setChildren] = useState<JournalChildData[]>(
    (article?.children ?? [])
      .map((c, index) => ({
        ...c,
        childOrder: c.childOrder ?? index,
      }))
      .sort(compareChildrenOldestFirst)
  );
  const [childPickId, setChildPickId] = useState("");
  const [savingChildren, setSavingChildren] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addChild = () => {
    if (!childPickId || !article) return;
    if (children.some((c) => c.id === childPickId)) return;
    const candidate = childCandidates.find((c) => c.id === childPickId);
    if (!candidate) return;

    setChildren((prev) =>
      [
        ...prev,
        {
          id: candidate.id,
          title: candidate.title,
          slug: candidate.slug,
          type: candidate.type,
          status: candidate.status,
          parentId: article.id,
          childOrder: prev.length,
          publishedAt: candidate.publishedAt,
        },
      ].sort(compareChildrenOldestFirst)
    );
    setChildPickId("");
  };

  const removeChild = (childId: string) => {
    setChildren((prev) => prev.filter((c) => c.id !== childId));
  };

  const saveChildren = async () => {
    if (!article) return;
    setSavingChildren(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/journal/${article.id}/children`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childIds: children.map((c) => c.id) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save child topics");
      }
      const data: {
        children: Array<{
          id: string;
          title: string;
          slug: string;
          type: JournalType;
          status: JournalStatus;
          parentId: string | null;
          childOrder: number;
          publishedAt: string | null;
        }>;
      } = await res.json();

      setChildren(
        data.children
          .map((c) => ({
            ...c,
            type: c.type,
            status: c.status,
            parentId: c.parentId ?? null,
            publishedAt: c.publishedAt ?? null,
          }))
          .sort(compareChildrenOldestFirst)
      );
      setSuccess("Child topics saved");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingChildren(false);
    }
  };

  // Author management
  const [authorPickMode, setAuthorPickMode] = useState<"member" | "external">("member");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [externalName, setExternalName] = useState("");

  const addMemberAuthorById = useCallback(
    (userId: string) => {
      if (!userId) return;
      const user = allUsers.find((u) => u.id === userId);
      if (!user) return;

      setAuthors((prev) => {
        if (prev.some((a) => a.userId === userId)) return prev;
        return [
          ...prev,
          {
            userId,
            order: prev.length,
            displayLabel: user.displayName,
          },
        ];
      });
    },
    [allUsers]
  );

  const addAuthor = () => {
    if (authorPickMode === "member" && selectedUserId) {
      addMemberAuthorById(selectedUserId);
      setSelectedUserId("");
    } else if (authorPickMode === "external" && externalName.trim()) {
      setAuthors([
        ...authors,
        {
          name: externalName.trim(),
          order: authors.length,
          displayLabel: externalName.trim(),
        },
      ]);
      setExternalName("");
    }
  };

  const removeAuthor = (idx: number) => {
    setAuthors(authors.filter((_, i) => i !== idx).map((a, i) => ({ ...a, order: i })));
  };

  // ── Formatting toolbar actions ──────────────────────────────────────────
  const applyFormat = useCallback(
    (type: "bold" | "italic" | "h2" | "h3" | "ul" | "ol" | "quote" | "code" | "link") => {
      const ta = textareaRef.current;
      if (!ta) return;
      let result: { newValue: string; cursor: number };
      switch (type) {
        case "bold":
          result = wrapSelection(ta, "**", "**", "bold text");
          break;
        case "italic":
          result = wrapSelection(ta, "*", "*", "italic text");
          break;
        case "h2":
          result = prefixLine(ta, "## ", "Heading");
          break;
        case "h3":
          result = prefixLine(ta, "### ", "Heading");
          break;
        case "ul":
          result = prefixLine(ta, "- ", "List item");
          break;
        case "ol":
          result = prefixLine(ta, "1. ", "List item");
          break;
        case "quote":
          result = prefixLine(ta, "> ", "Quote");
          break;
        case "code":
          result = wrapSelection(ta, "`", "`", "code");
          break;
        case "link":
          result = wrapSelection(ta, "[", "](url)", "link text");
          break;
      }
      setContent(result.newValue);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(result.cursor, result.cursor);
      }, 0);
    },
    []
  );

  // Inline photo picker for markdown editor
  const insertPhotoMarkdown = useCallback((photo: JournalPhotoData, float?: "left" | "right") => {
    const altText = `${photo.title ?? photo.originalName}${float ? `|${float}` : ""}`;
    const md = `![${altText}](/api/journal/photos/${photo.id})\n`;
    const ta = textareaRef.current;
    if (ta) {
      const pos = ta.selectionEnd;
      setContent((c) => c.slice(0, pos) + md + c.slice(pos));
    } else {
      setContent((c) => c + md);
    }
  }, []);

  const save = async (newStatus?: JournalStatus) => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (newStatus === "PUBLISHED" && !publishedAtLocal) {
      setError("Set a publish date and time before publishing");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const body = {
        title,
        subtitle: subtitle || null,
        content,
        tableStyle,
        type,
        parentId: parentId || null,
        editorId: editorId || null,
        coverPhotoId: coverPhotoId || null,
        ...(isEditor &&
          !isNew && {
            publishedAt: publishedAtLocal ? localDateTimeInputToIso(publishedAtLocal) : null,
          }),
        authors: authors.map((a, i) => ({
          userId: a.userId ?? null,
          name: a.name ?? null,
          order: i,
        })),
      };

      let savedId = article?.id;

      if (isNew) {
        const res = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create article");
        }
        const created: JournalArticleData = await res.json();
        savedId = created.id;
      } else {
        const res = await fetch(`/api/journal/${article.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to save article");
        }
      }

      // Transition status if requested
      if (newStatus && savedId) {
        const res = await fetch(`/api/journal/${savedId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            ...(newStatus === "PUBLISHED" && {
              publishedAt: localDateTimeInputToIso(publishedAtLocal),
            }),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to update status");
        }
      }

      if (isNew && savedId) {
        const nextHref = backTo
          ? `/admin/journal/${savedId}/edit?backTo=${encodeURIComponent(backTo)}`
          : `/admin/journal/${savedId}/edit`;
        router.push(nextHref);
      } else {
        setSuccess("Saved successfully");
        router.refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const status = article?.status ?? "DRAFT";

  const toolbarButtons = [
    { icon: Bold, action: "bold" as const, title: "Bold (Ctrl+B)" },
    { icon: Italic, action: "italic" as const, title: "Italic (Ctrl+I)" },
    { icon: Heading2, action: "h2" as const, title: "Heading 2" },
    { icon: Heading3, action: "h3" as const, title: "Heading 3" },
    { icon: List, action: "ul" as const, title: "Bullet list" },
    { icon: ListOrdered, action: "ol" as const, title: "Numbered list" },
    { icon: Quote, action: "quote" as const, title: "Blockquote" },
    { icon: Code, action: "code" as const, title: "Inline code" },
    { icon: Link2, action: "link" as const, title: "Link" },
  ] as const;

  const isPublished = status === "PUBLISHED";
  const isReadOnly = isPublished && !isEditor;

  return (
    <div className="space-y-6">
      {/* Published lock notice */}
      {isReadOnly && (
        <div className="flex items-center gap-2 bg-green-900/20 border border-green-700 rounded-lg px-4 py-3 text-green-300 text-sm">
          <Lock className="h-4 w-4 shrink-0" />
          This article is published and cannot be edited. Ask a Journal Editor to make changes.
        </div>
      )}

      {isPublished && isEditor && (
        <div className="flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-gray-300 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0 text-primary-400" />
          This article is published (live). Saving updates will keep it published.
        </div>
      )}

      {/* Error / success banners */}
      {error && (
        <div className="flex items-start gap-2 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-900/20 border border-green-800 rounded-lg px-4 py-3 text-green-300 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Top bar: status + action buttons */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </span>
          {article?.publishedAt && (
            <span className="text-xs text-gray-500">
              Published {new Date(article.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Save draft */}
          {(status === "DRAFT" || status === "PENDING_REVIEW") && (
            <button
              onClick={() => save()}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          )}

          {/* Save published edits (editor only) */}
          {isEditor && status === "PUBLISHED" && (
            <button
              onClick={() => save()}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          )}

          {/* Submit for review */}
          {status === "DRAFT" && (
            <button
              onClick={() => save("PENDING_REVIEW")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Submit for Review
            </button>
          )}

          {/* Return to draft */}
          {status === "PENDING_REVIEW" && (
            <button
              onClick={() => save("DRAFT")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Return to Draft
            </button>
          )}

          {/* Publish (editor only) */}
          {isEditor && status === "PENDING_REVIEW" && (
            <button
              onClick={() => save("PUBLISHED")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Publish
            </button>
          )}

          {/* Archive (editor only) */}
          {isEditor && status === "PUBLISHED" && (
            <button
              onClick={() => save("ARCHIVED")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          )}

          {/* Restore from archive (editor only) */}
          {isEditor && status === "ARCHIVED" && (
            <button
              onClick={() => save("DRAFT")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Restore to Draft
            </button>
          )}
        </div>
      </div>

      {/* ── Section 1: Metadata ── */}
      <section className="bg-dark-800 border border-dark-700 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Article Details
        </h2>

        <div>
          <label
            htmlFor="journal-article-title"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Title *
          </label>
          <input
            id="journal-article-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            disabled={isReadOnly}
            className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label
            htmlFor="journal-article-subtitle"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Subtitle
          </label>
          <input
            id="journal-article-subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Optional subtitle or tagline"
            disabled={isReadOnly}
            className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {article?.slug && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="block text-sm font-medium text-gray-300 mb-1">Slug (URL)</p>
              <p className="text-sm font-mono text-gray-400 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2">
                {article.slug}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from title. Cannot be changed after creation.
              </p>
            </div>

            {/* Published date/time (editor only) */}
            {isEditor && (
              <div>
                <p className="block text-sm font-medium text-gray-300 mb-1">
                  {article.status === "PUBLISHED" ? "Published date/time" : "Publish date/time"}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="date"
                    value={publishedAtLocal ? publishedAtLocal.slice(0, 10) : ""}
                    style={{ colorScheme: "dark" }}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      if (!nextDate) {
                        setPublishedAtLocal("");
                        return;
                      }

                      const nextTime = publishedAtLocal?.slice(11, 16) || "00:00";
                      setPublishedAtLocal(`${nextDate}T${nextTime}`);
                    }}
                    disabled={!isEditor}
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <input
                    type="time"
                    step={60}
                    value={publishedAtLocal ? publishedAtLocal.slice(11, 16) : ""}
                    style={{ colorScheme: "dark" }}
                    disabled={!isEditor || !publishedAtLocal?.slice(0, 10)}
                    onChange={(e) => {
                      const nextTime = e.target.value;
                      if (!nextTime) {
                        // Keep date if present; otherwise clear.
                        const currentDate = publishedAtLocal?.slice(0, 10);
                        setPublishedAtLocal(currentDate ? `${currentDate}T00:00` : "");
                        return;
                      }

                      const nextDate = publishedAtLocal?.slice(0, 10);
                      if (!nextDate) return;
                      setPublishedAtLocal(`${nextDate}T${nextTime}`);
                    }}
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Displayed publicly as date only. Required to publish.
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="journal-article-type"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Type
          </label>
          <select
            id="journal-article-type"
            value={type}
            onChange={(e) => setType(e.target.value as JournalType)}
            disabled={isReadOnly}
            className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {JOURNAL_TYPES.map((journalType) => (
              <option key={journalType} value={journalType}>
                {JOURNAL_TYPE_LABELS[journalType]}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Controls where this post appears in admin filters and left-side navigation.
          </p>
        </div>

        <div>
          <SearchableSelect
            label="Parent Issue"
            value={parentId}
            onChange={setParentId}
            disabled={isReadOnly}
            options={[
              { id: "", label: "— Standalone / Top-level —" },
              ...parentIssues.map((issue) => ({
                id: issue.id,
                label: issue.title,
                subtitle: issue.slug,
              })),
            ]}
            placeholder="Select a parent issue…"
            searchPlaceholder="Search issues…"
          />
          <p className="text-xs text-gray-500 mt-1">Leave blank to make this a top-level issue.</p>
        </div>

        {/* Child topics / articles */}
        <div className="pt-2 border-t border-dark-700 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-300">Child Topics</p>
            {!isNew && !isPublished && (
              <button
                type="button"
                onClick={saveChildren}
                disabled={savingChildren}
                className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {savingChildren ? "Saving…" : "Save Child Topics"}
              </button>
            )}
          </div>

          {isNew ? (
            <p className="text-xs text-gray-500">Save this article first to add child topics.</p>
          ) : isPublished ? (
            <p className="text-xs text-gray-500">
              Published articles are locked. Archive it first to change child topics.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 items-end">
              <div className="min-w-72 flex-1">
                <SearchableSelect
                  label="Add child"
                  value={childPickId}
                  onChange={setChildPickId}
                  options={childCandidates
                    .filter((c) => c.id !== article?.id)
                    .filter((c) => !children.some((ch) => ch.id === c.id))
                    .map((c) => ({
                      id: c.id,
                      label: c.title,
                      subtitle: `${STATUS_LABELS[c.status]} • ${c.slug}${c.parent ? ` • Parent: ${c.parent.title}` : ""}`,
                    }))}
                  placeholder="Select an article…"
                  searchPlaceholder="Search articles…"
                  showClearButton={false}
                />
              </div>
              <button
                type="button"
                onClick={addChild}
                disabled={!childPickId}
                className="px-3 py-2 bg-primary-700 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}

          {children.length === 0 ? (
            <p className="text-xs text-gray-500">No child topics selected.</p>
          ) : (
            <div className="space-y-2">
              {children.map((child, index) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between gap-3 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[child.status]}`}
                      >
                        {STATUS_LABELS[child.status]}
                      </span>
                      <a
                        href={`/admin/journal/${child.id}/edit`}
                        className="text-sm text-gray-200 hover:text-white transition-colors truncate"
                        title={child.title}
                      >
                        {child.title}
                      </a>
                      <span className="text-xs text-gray-600 truncate">/journal/{child.slug}</span>
                    </div>
                  </div>

                  {!isPublished && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => removeChild(child.id)}
                        aria-label="Remove child"
                        className="p-1.5 text-gray-400 hover:text-red-300 hover:bg-dark-700 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {!isNew && !isPublished && (
                <p className="text-xs text-gray-500">
                  Sorted automatically by publish date (oldest first). Click “Save Child Topics” to
                  persist changes.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: Authors ── */}
      <section className="bg-dark-800 border border-dark-700 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Authors</h2>

        {/* Current authors */}
        {authors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {authors.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 bg-dark-700 rounded-full px-3 py-1 text-sm text-gray-200"
              >
                {a.displayLabel}
                {!isPublished && (
                  <button
                    type="button"
                    onClick={() => removeAuthor(i)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    aria-label={`Remove author: ${a.displayLabel}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Add author */}
        {!isPublished && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
                {authorPickMode === "member" ? (
                  <div className="flex-1 min-w-0">
                    <SearchableSelect
                      value={selectedUserId}
                      onChange={(id) => {
                        // Users often expect selection itself to add the author.
                        // Do that, and clear the picker.
                        setSelectedUserId(id);
                        addMemberAuthorById(id);
                        setSelectedUserId("");
                      }}
                      options={allUsers
                        .filter((u) => !authors.some((a) => a.userId === u.id))
                        .map((u) => ({
                          id: u.id,
                          label: u.displayName,
                          subtitle: u.username,
                        }))}
                      placeholder="Select member…"
                      searchPlaceholder="Search members…"
                      showClearButton={false}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    placeholder="Author name"
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}

                <button
                  onClick={addAuthor}
                  className="w-full sm:w-auto px-3 py-2 bg-primary-700 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="w-full sm:w-auto sm:ml-auto flex rounded-lg overflow-hidden border border-dark-600 text-sm">
                <button
                  onClick={() => setAuthorPickMode("member")}
                  className={`flex-1 px-3 py-2 transition-colors ${authorPickMode === "member" ? "bg-primary-700 text-white" : "bg-dark-800 text-gray-400 hover:text-white"}`}
                >
                  Member
                </button>
                <button
                  onClick={() => setAuthorPickMode("external")}
                  className={`flex-1 px-3 py-2 transition-colors ${authorPickMode === "external" ? "bg-primary-700 text-white" : "bg-dark-800 text-gray-400 hover:text-white"}`}
                >
                  External
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Section 3: Issue Editor ── */}
      <section className="bg-dark-800 border border-dark-700 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Issue Editor
        </h2>

        <div>
          <SearchableSelect
            label="Issue Editor"
            value={editorId}
            onChange={setEditorId}
            disabled={isReadOnly}
            options={[
              { id: "", label: "— No editor —" },
              ...editorUsers.map((u) => ({
                id: u.id,
                label: u.displayName,
                subtitle: `@${u.username}`,
              })),
            ]}
            placeholder="Select an editor…"
            searchPlaceholder="Search admins…"
          />
          <p className="text-xs text-gray-600 mt-1">Optional: the admin who edited this issue.</p>
        </div>
      </section>

      {/* ── Section 4: Content ── */}
      <section className="bg-dark-800 border border-dark-700 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Content</h2>
          <div className="flex gap-1 text-xs bg-dark-900 rounded-lg p-1">
            {(["edit", "split", "preview"] as EditMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setEditMode(m)}
                className={`px-3 py-1 rounded transition-colors capitalize ${
                  editMode === m ? "bg-dark-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Formatting toolbar */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,18rem)_1fr] gap-3 items-start">
          <div>
            <label
              htmlFor="journal-table-style"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Table style
            </label>
            <select
              id="journal-table-style"
              value={tableStyle}
              onChange={(e) => setTableStyle(e.target.value as JournalTableStyle)}
              disabled={isReadOnly}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {JOURNAL_TABLE_STYLES.map((style) => (
                <option key={style} value={style}>
                  {JOURNAL_TABLE_STYLE_LABELS[style]}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Applies to all markdown tables in this article. Current style keeps today&apos;s
              rendering unchanged.
            </p>
          </div>

          {(tableStyle === "standard" ||
            tableStyle === "compact" ||
            tableStyle === "striped" ||
            tableStyle === "minimal" ||
            tableStyle === "highlight-header" ||
            tableStyle === "responsive-cards") && (
            <div className="rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-xs text-gray-400">
              This preset uses the dark table shell and HoF-inspired colors. "Responsive cards"
              keeps the same data but stacks rows more aggressively on small screens.
            </div>
          )}
        </div>

        {!isPublished && (editMode === "edit" || editMode === "split") && (
          <div className="flex flex-wrap items-center gap-1 bg-dark-900 border border-dark-700 rounded-lg px-2 py-1.5">
            {toolbarButtons.map(({ icon: Icon, action, title }) => (
              <button
                key={action}
                type="button"
                onClick={() => applyFormat(action)}
                title={title}
                aria-label={title}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="w-px h-5 bg-dark-700 mx-1" />
            <button
              type="button"
              onClick={() => setShowCheatsheet(!showCheatsheet)}
              title="Markdown cheatsheet"
              aria-label="Markdown cheatsheet"
              className={`p-1.5 rounded transition-colors ${showCheatsheet ? "text-primary-400 bg-dark-700" : "text-gray-400 hover:text-white hover:bg-dark-700"}`}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Cheatsheet popup */}
        {showCheatsheet && (
          <div className="bg-dark-900 border border-dark-600 rounded-lg p-4 relative">
            <button
              type="button"
              onClick={() => setShowCheatsheet(false)}
              aria-label="Close markdown cheatsheet"
              className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Markdown Cheatsheet
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {CHEATSHEET.map(({ syntax, description, wide }) => (
                <div
                  key={syntax}
                  className={`flex items-start gap-2 text-xs ${wide ? "sm:col-span-2" : ""}`}
                >
                  <code className="bg-dark-800 text-primary-300 px-1.5 py-0.5 rounded font-mono whitespace-pre-wrap wrap-break-word">
                    {syntax}
                  </code>
                  <span className="text-gray-400">{description}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500 leading-relaxed">
              Table columns also support standard markdown alignment markers. Use{" "}
              <code className="text-primary-300">:---</code> for left,{" "}
              <code className="text-primary-300">:---:</code> for center, and{" "}
              <code className="text-primary-300">---:</code> for right alignment. Explicit markers
              override the automatic numeric and year alignment. Add{" "}
              <code className="text-primary-300">{`{w:18rem}`}</code> or{" "}
              <code className="text-primary-300">{`{w:25%}`}</code> in a header cell to set a column
              width. Use <code className="text-primary-300">{`{w:fit}`}</code> for tight numeric
              columns.
            </p>
          </div>
        )}

        {/* Inline photo insert */}
        {!isPublished && photos.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Insert photo inline:</p>
            <div className="flex flex-wrap gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="flex items-center gap-0.5">
                  <button
                    onClick={() => insertPhotoMarkdown(photo)}
                    className="flex items-center gap-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-l px-2 py-1 transition-colors"
                    title={`Insert centered: ${photo.title ?? photo.originalName}`}
                  >
                    <img src={photoUrl(photo.id)} alt="" className="h-5 w-7 object-cover rounded" />
                    <Image className="h-3 w-3 text-gray-500" />
                    {photo.title ?? photo.originalName}
                  </button>
                  <button
                    onClick={() => insertPhotoMarkdown(photo, "right")}
                    className="text-xs bg-dark-700 hover:bg-dark-600 text-gray-400 px-1.5 py-1 transition-colors"
                    title="Float right"
                  >
                    →R
                  </button>
                  <button
                    onClick={() => insertPhotoMarkdown(photo, "left")}
                    className="text-xs bg-dark-700 hover:bg-dark-600 text-gray-400 rounded-r px-1.5 py-1 transition-colors"
                    title="Float left"
                  >
                    L←
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={`grid gap-4 ${editMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
        >
          {(editMode === "edit" || editMode === "split") && (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article in Markdown..."
              rows={20}
              disabled={isReadOnly}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y disabled:opacity-60 disabled:cursor-not-allowed"
            />
          )}
          {(editMode === "preview" || editMode === "split") && (
            <div className="bg-dark-900 border border-dark-600 rounded-lg p-4 overflow-y-auto max-h-160">
              <MarkdownViewer
                content={content || "*Nothing to preview yet.*"}
                tableStyle={tableStyle}
                journalPhotoAttributionById={Object.fromEntries(
                  photos.map((p) => [p.id, { attribution: p.attribution }])
                )}
                journalPhotosForLightbox={photos}
                className="[&_img]:rounded-lg [&_img]:max-w-full"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Section 4: Photos ── */}
      {!isNew && (
        <section className="bg-dark-800 border border-dark-700 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Photos</h2>
          <p className="text-xs text-gray-500">
            Upload photos for the gallery. The cover photo appears on the article card list. Use the
            insert buttons above to embed photos inline in the content.
          </p>
          <PhotoUploader
            journalId={article!.id}
            photos={photos}
            coverPhotoId={coverPhotoId}
            onChange={(newPhotos, newCover) => {
              setPhotos(newPhotos);
              setCoverPhotoId(newCover);
            }}
          />
        </section>
      )}

      {isNew && (
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-5 text-sm text-gray-500">
          Save the article first, then you can upload photos.
        </div>
      )}
    </div>
  );
}
