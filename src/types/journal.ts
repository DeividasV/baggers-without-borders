import { SITE_NAME } from "@/src/config/site";
export type JournalStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";

export type JournalType = "journal" | "article" | "awards" | "achievements" | "p-index" | "other";

export type JournalTableStyle =
  | "legacy"
  | "none"
  | "standard"
  | "compact"
  | "striped"
  | "minimal"
  | "highlight-header"
  | "responsive-cards";

export type JournalListView = "journal" | "awards";

export const JOURNAL_TYPES = [
  "journal",
  "article",
  "awards",
  "achievements",
  "p-index",
  "other",
] as const satisfies readonly JournalType[];

export const JOURNAL_TABLE_STYLES = [
  "legacy",
  "none",
  "standard",
  "compact",
  "striped",
  "minimal",
  "highlight-header",
  "responsive-cards",
] as const satisfies readonly JournalTableStyle[];

export const JOURNAL_JOURNAL_VIEW_TYPES = [
  "journal",
  "article",
] as const satisfies readonly JournalType[];

export const JOURNAL_AWARDS_VIEW_TYPES = [
  "awards",
  "achievements",
] as const satisfies readonly JournalType[];

export function isJournalType(value: unknown): value is JournalType {
  return typeof value === "string" && (JOURNAL_TYPES as readonly string[]).includes(value);
}

export function isJournalTableStyle(value: unknown): value is JournalTableStyle {
  return typeof value === "string" && (JOURNAL_TABLE_STYLES as readonly string[]).includes(value);
}

export function isJournalListView(value: unknown): value is JournalListView {
  return value === "journal" || value === "awards";
}

export const JOURNAL_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "ARCHIVED",
] as const satisfies readonly JournalStatus[];

export function isJournalStatus(value: unknown): value is JournalStatus {
  return typeof value === "string" && (JOURNAL_STATUSES as readonly string[]).includes(value);
}

export interface JournalPhotoData {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  title: string | null;
  caption: string | null;
  attribution: string | null;
  order: number;
  journalId: string | null;
  createdAt: string;
}

export interface JournalAuthorData {
  id: string;
  journalId: string;
  userId: string | null;
  name: string | null;
  order: number;
  user?: {
    id: string;
    displayName: string;
    username?: string;
  } | null;
}

export interface JournalEditorData {
  id: string;
  displayName: string;
  username: string;
}

/** A "parent article" summary used in child card display */
export interface JournalParentData {
  id: string;
  title: string;
  slug: string;
}

export interface JournalCardData {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  type: JournalType;
  status: JournalStatus;
  /** null = top-level (may act as an issue), non-null = child article */
  parentId: string | null;
  /** Manual order within its parent (only meaningful when parentId != null) */
  childOrder?: number;
  coverPhotoId: string | null;
  coverPhoto: { id: string; title: string | null; mimeType: string } | null;
  parent: JournalParentData | null;
  editor: JournalEditorData | null;
  authors: JournalAuthorData[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Count of published children (issues only) */
  _count?: { children: number; photos?: number };
}

export interface JournalChildData {
  id: string;
  title: string;
  slug: string;
  type: JournalType;
  status: JournalStatus;
  parentId: string | null;
  childOrder: number;
  publishedAt: string | null;
}

export interface JournalArticleData extends JournalCardData {
  content: string;
  tableStyle: JournalTableStyle;
  photos: JournalPhotoData[];
  coverPhoto: JournalPhotoData | null;
  createdBy: { id: string; displayName: string; username?: string };
  approvedBy: { id: string; displayName: string; username?: string } | null;
  approvedById: string | null;
  editorId: string | null;
  /** Child articles (populated when this article is a top-level issue) */
  children?: JournalChildData[];
}

export function getAuthorNames(authors: JournalAuthorData[]): string {
  return authors
    .sort((a, b) => a.order - b.order)
    .map((a) => a.user?.displayName ?? a.name ?? "Unknown")
    .join(", ");
}

export function photoUrl(photoId: string): string {
  return `/api/journal/photos/${photoId}`;
}

export const JOURNAL_TYPE_LABELS: Record<JournalType, string> = {
  journal: "Journal",
  article: "Article",
  awards: "Awards",
  achievements: "Achievements",
  "p-index": "P-Index",
  other: "Other",
};

export const JOURNAL_TABLE_STYLE_LABELS: Record<JournalTableStyle, string> = {
  legacy: "Current style",
  none: "None",
  standard: "Standard",
  compact: "Compact",
  striped: "Striped",
  minimal: "Minimal",
  "highlight-header": "Highlight header",
  "responsive-cards": "Responsive cards",
};

export const JOURNAL_TYPE_COLORS: Record<JournalType, string> = {
  journal: "bg-sky-900/40 text-sky-300 border border-sky-800/60",
  article: "bg-indigo-900/40 text-indigo-300 border border-indigo-800/60",
  awards: "bg-amber-900/40 text-amber-300 border border-amber-800/60",
  achievements: "bg-emerald-900/40 text-emerald-300 border border-emerald-800/60",
  "p-index": "bg-fuchsia-900/40 text-fuchsia-300 border border-fuchsia-800/60",
  other: "bg-slate-800 text-slate-300 border border-slate-700",
};

export const STATUS_LABELS: Record<JournalStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const STATUS_COLORS: Record<JournalStatus, string> = {
  DRAFT: "bg-gray-700 text-gray-200",
  PENDING_REVIEW: "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
  PUBLISHED: "bg-green-900/50 text-green-300 border border-green-700",
  ARCHIVED: "bg-dark-800 text-gray-400",
};
