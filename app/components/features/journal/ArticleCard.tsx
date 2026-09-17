"use client";

import Link from "next/link";
import { Calendar, Tag, User } from "lucide-react";
import {
  JournalCardData,
  getAuthorNames,
  photoUrl,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/src/types/journal";

interface ArticleCardProps {
  article: JournalCardData;
  /** Link prefix — /journal for public, /journal for members (same URL) */
  basePath?: string;
  /** Optional explicit href override (used by preview pages) */
  href?: string;
  /** Show status badge (admin view) */
  showStatus?: boolean;
}

export default function ArticleCard({
  article,
  basePath = "/journal",
  href,
  showStatus = false,
}: ArticleCardProps) {
  const resolvedHref = href ?? `${basePath}/${article.slug}`;
  const authorNames = getAuthorNames(article.authors);
  const pubDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={resolvedHref}
      className="group flex flex-col rounded-xl overflow-hidden bg-dark-800 border border-dark-700 hover:border-primary-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary-900/20"
    >
      {/* Cover image */}
      <div className="aspect-video bg-dark-900 overflow-hidden">
        {article.coverPhoto ? (
          <img
            src={photoUrl(article.coverPhoto.id)}
            alt={article.coverPhoto.title ?? article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-dark-600">✦</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Parent Issue + Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {article.parent && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-900/40 text-primary-300 border border-primary-800/50">
              <Tag className="h-3 w-3" />
              {article.parent.title}
            </span>
          )}
          {showStatus && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[article.status]}`}
            >
              {STATUS_LABELS[article.status]}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-base font-semibold text-white group-hover:text-primary-300 transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h2>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {article.subtitle}
          </p>
        )}

        {/* Footer meta */}
        <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          {authorNames && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-48">{authorNames}</span>
            </span>
          )}
          {pubDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {pubDate}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
