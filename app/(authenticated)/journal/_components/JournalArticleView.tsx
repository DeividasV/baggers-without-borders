import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, ChevronRight, User } from "lucide-react";
import type { ReactNode } from "react";
import MarkdownViewer from "@/app/components/ui/MarkdownViewer";
import PhotoGallery from "@/app/components/features/journal/PhotoGallery";
import ArticleCard from "@/app/components/features/journal/ArticleCard";
import { photoUrl } from "@/src/types/journal";
import type {
  JournalCardData,
  JournalPhotoData,
  JournalStatus,
  JournalTableStyle,
} from "@/src/types/journal";

type JournalArticleViewMode = "published" | "preview";

type MinimalAuthor = {
  order: number;
  name: string | null;
  user: { displayName: string } | null;
};

type MinimalPhoto = {
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
  createdAt: Date;
};

type MinimalEditor = { displayName: string } | null;
type MinimalParent = { title: string; slug: string } | null;

export interface JournalArticleViewArticle {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  content: string;
  tableStyle: JournalTableStyle;
  status: string;
  parentId: string | null;
  publishedAt: Date | null;
  coverPhoto: MinimalPhoto | null;
  photos: MinimalPhoto[];
  parent: MinimalParent;
  editor: MinimalEditor;
  authors: MinimalAuthor[];
}

export interface JournalArticleViewProps {
  article: JournalArticleViewArticle;
  childArticles: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    type: string;
    status: string;
    parentId: string | null;
    childOrder: number;
    coverPhotoId: string | null;
    coverPhoto: { id: string; title: string | null; mimeType: string } | null;
    parent: { id: string; title: string; slug: string } | null;
    editor: { id: string; displayName: string; username: string } | null;
    authors: Array<{
      id: string;
      journalId: string;
      userId: string | null;
      name: string | null;
      order: number;
      user: { id: string; displayName: string } | null;
    }>;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: { children: number };
  }>;
  mode: JournalArticleViewMode;
  listHref?: string;
  listLabel?: string;
  detailBasePath?: string;
  detailHrefSuffix?: string;
  footer?: ReactNode;
}

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export default function JournalArticleView({
  article,
  childArticles,
  mode,
  listHref = "/journal",
  listLabel = "Journal",
  detailBasePath = "/journal",
  detailHrefSuffix = "",
  footer,
}: JournalArticleViewProps) {
  const isIssue = article.parentId === null;

  const authors = article.authors
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((a) => a.user?.displayName ?? a.name ?? "Unknown");

  const pubDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const serializedPhotos: JournalPhotoData[] = article.photos.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  const journalPhotoAttributionById = Object.fromEntries(
    serializedPhotos.map((p) => [p.id, { attribution: p.attribution }])
  );

  const serializedChildren: JournalCardData[] = childArticles.map((a) => ({
    ...a,
    type: a.type as JournalCardData["type"],
    status: a.status as JournalStatus,
    coverPhoto: a.coverPhoto
      ? {
          id: a.coverPhoto.id,
          title: a.coverPhoto.title,
          mimeType: a.coverPhoto.mimeType,
        }
      : null,
    parent: a.parent ?? null,
    editor: a.editor ?? null,
    authors: a.authors.map((au) => ({ ...au, user: au.user ?? null })),
    publishedAt: toIso(a.publishedAt),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    parentId: a.parentId ?? null,
    coverPhotoId: a.coverPhotoId ?? null,
    subtitle: a.subtitle ?? null,
    _count: a._count,
  }));

  // Enforce sort by publication date+time (oldest/earliest first).
  // Items without publishedAt should appear at the bottom.
  serializedChildren.sort((a, b) => {
    const aPub = a.publishedAt ? new Date(a.publishedAt).getTime() : Infinity;
    const bPub = b.publishedAt ? new Date(b.publishedAt).getTime() : Infinity;
    if (aPub !== bPub) return aPub - bPub;

    const aUpdated = new Date(a.updatedAt).getTime();
    const bUpdated = new Date(b.updatedAt).getTime();
    if (aUpdated !== bUpdated) return aUpdated - bUpdated;

    return a.title.localeCompare(b.title);
  });

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Breadcrumb */}
      {article.parent ? (
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href={listHref} className="hover:text-white transition-colors">
            {listLabel}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
          <Link
            href={`${detailBasePath}/${article.parent.slug}${detailHrefSuffix}`}
            className="hover:text-white transition-colors truncate max-w-xs"
          >
            {article.parent.title}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
          <span className="text-gray-500 truncate max-w-xs">{article.title}</span>
        </nav>
      ) : (
        <Link
          href={listHref}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {listLabel}
        </Link>
      )}

      {/* Cover photo */}
      {article.coverPhoto && (
        <figure className="mb-8">
          <div className="aspect-21/9 overflow-hidden rounded-xl bg-dark-900">
            <img
              src={photoUrl(article.coverPhoto.id)}
              alt={article.coverPhoto.title ?? article.title}
              className="w-full h-full object-cover"
            />
          </div>
          {(article.coverPhoto.title ||
            article.coverPhoto.caption ||
            article.coverPhoto.attribution) && (
            <figcaption className="mt-1.5 text-xs text-right space-y-0.5">
              {(article.coverPhoto.title || article.coverPhoto.attribution) && (
                <div>
                  {article.coverPhoto.title && (
                    <span className="font-medium text-gray-300">{article.coverPhoto.title}</span>
                  )}
                  {article.coverPhoto.attribution && (
                    <span
                      className={article.coverPhoto.title ? "ml-2 text-gray-400" : "text-gray-400"}
                    >
                      © {article.coverPhoto.attribution}
                    </span>
                  )}
                </div>
              )}
              {article.coverPhoto.caption && (
                <div className="italic text-gray-600 line-clamp-2">
                  {article.coverPhoto.caption}
                </div>
              )}
            </figcaption>
          )}
        </figure>
      )}

      {/* Article / Issue header */}
      <header className="mb-8 space-y-3">
        {isIssue && (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary-900/40 text-primary-300 border border-primary-800/50">
              <BookOpen className="h-3 w-3" />
              Issue
            </span>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{article.title}</h1>

        {article.subtitle && <p className="text-lg text-gray-300">{article.subtitle}</p>}

        <div className="flex flex-wrap gap-4 text-sm text-gray-400 pt-1">
          {authors.length > 0 && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>
                <span className="text-gray-500">By </span>
                {authors.join(", ")}
              </span>
            </span>
          )}
          {pubDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {pubDate}
            </span>
          )}
        </div>
      </header>

      {/* Content (shown when there is meaningful content) */}
      {article.content && (
        <MarkdownViewer
          content={article.content}
          tableStyle={article.tableStyle}
          journalPhotoAttributionById={journalPhotoAttributionById}
          journalPhotosForLightbox={serializedPhotos}
          className="sm:prose-base [&_img]:rounded-lg [&_img]:max-w-full"
        />
      )}

      {/* Child articles section */}
      {serializedChildren.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-white mb-5">
            {isIssue ? "Articles in this issue" : "Articles"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {serializedChildren.map((child) => {
              const href =
                mode === "preview" && child.status !== "PUBLISHED"
                  ? `/journal/preview/${child.id}`
                  : `${detailBasePath}/${child.slug}${detailHrefSuffix}`;

              return (
                <ArticleCard
                  key={child.id}
                  article={child}
                  basePath={detailBasePath}
                  showStatus={false}
                  href={href}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Gallery */}
      {!isIssue && serializedPhotos.length > 0 && <PhotoGallery photos={serializedPhotos} />}

      {footer}

      {article.editor && (
        <div className="mt-3 text-xs text-gray-600 text-right">
          Edited by {article.editor.displayName}
        </div>
      )}
    </main>
  );
}
