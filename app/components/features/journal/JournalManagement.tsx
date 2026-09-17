"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  BookOpen,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  JournalCardData,
  JOURNAL_TYPE_COLORS,
  JOURNAL_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  getAuthorNames,
  photoUrl,
} from "@/src/types/journal";

interface JournalManagementProps {
  isEditor: boolean;
}

function parsePositiveInt(raw: string | null, defaultValue: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultValue;
  return parsed;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All types" },
  { value: "journal", label: "Journal" },
  { value: "article", label: "Article" },
  { value: "awards", label: "Awards" },
  { value: "achievements", label: "Achievements" },
  { value: "p-index", label: "P-Index" },
  { value: "other", label: "Other" },
];

export default function JournalManagement({
  isEditor: _isEditor,
}: JournalManagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<JournalCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? "",
  );
  const [typeFilter, setTypeFilter] = useState(
    () => searchParams.get("type") ?? "",
  );
  const [topLevelOnly, setTopLevelOnly] = useState(
    () => searchParams.get("topLevelOnly") !== "false",
  );
  const [page, setPage] = useState(() =>
    parsePositiveInt(searchParams.get("page"), 1),
  );
  const limit = 20;

  const [expandedParents, setExpandedParents] = useState<
    Record<string, boolean>
  >({});
  const [childrenByParentId, setChildrenByParentId] = useState<
    Record<string, JournalCardData[]>
  >({});
  const [childrenLoading, setChildrenLoading] = useState<
    Record<string, boolean>
  >({});
  const [childrenError, setChildrenError] = useState<
    Record<string, string | null>
  >({});

  const buildListQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (!topLevelOnly) params.set("topLevelOnly", "false");
    return params.toString();
  }, [page, search, statusFilter, topLevelOnly, typeFilter]);

  const buildEditHref = useCallback(
    (articleId: string) => {
      const queryString = buildListQueryString();
      const backTo = `${pathname}${queryString ? `?${queryString}` : ""}`;
      return `/admin/journal/${articleId}/edit?backTo=${encodeURIComponent(backTo)}`;
    },
    [buildListQueryString, pathname],
  );

  const newArticleHref = (() => {
    const queryString = buildListQueryString();
    const backTo = `${pathname}${queryString ? `?${queryString}` : ""}`;
    return `/admin/journal/new?backTo=${encodeURIComponent(backTo)}`;
  })();

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (topLevelOnly) {
      params.set("parentId", "null");
    }

    try {
      const res = await fetch(`/api/journal?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles);
        setTotal(data.total);
      }
    } catch {
      // network error — leave current list in place
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, topLevelOnly, typeFilter]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    const queryString = buildListQueryString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [buildListQueryString, pathname, router]);

  useEffect(() => {
    // Reset hierarchy state when the list query changes.
    setExpandedParents({});
    setChildrenByParentId({});
    setChildrenLoading({});
    setChildrenError({});
  }, [search, statusFilter, topLevelOnly, page, typeFilter]);

  const totalPages = Math.ceil(total / limit);

  const canExpand = (article: JournalCardData) => {
    const childCount = article._count?.children ?? 0;
    return topLevelOnly && article.parentId === null && childCount > 0;
  };

  const fetchChildren = async (parentId: string) => {
    setChildrenLoading((s) => ({ ...s, [parentId]: true }));
    setChildrenError((s) => ({ ...s, [parentId]: null }));

    const params = new URLSearchParams({
      page: "1",
      limit: "50",
      parentId,
    });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/journal?${params}`);
      if (!res.ok) {
        setChildrenError((s) => ({
          ...s,
          [parentId]: "Failed to load child articles",
        }));
        return;
      }
      const data = await res.json();
      setChildrenByParentId((s) => ({ ...s, [parentId]: data.articles ?? [] }));
    } catch {
      setChildrenError((s) => ({
        ...s,
        [parentId]: "Failed to load child articles",
      }));
    } finally {
      setChildrenLoading((s) => ({ ...s, [parentId]: false }));
    }
  };

  const toggleExpanded = async (article: JournalCardData) => {
    if (!canExpand(article)) return;
    const nextExpanded = !expandedParents[article.id];
    setExpandedParents((s) => ({ ...s, [article.id]: nextExpanded }));
    if (nextExpanded && childrenByParentId[article.id] === undefined) {
      await fetchChildren(article.id);
    }
  };

  const formatYmd = (raw: string | null) => {
    if (!raw) return "—";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toISOString().slice(0, 10);
  };

  const countPictures = (article: JournalCardData) => {
    const photosCount = article._count?.photos ?? 0;
    const coverCount = article.coverPhoto ? 1 : 0;
    return photosCount + coverCount;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">
            {total} article{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={newArticleHref}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={topLevelOnly}
            onChange={(e) => {
              const checked = e.target.checked;
              setTopLevelOnly(checked);
              setPage(1);
            }}
            className="h-4 w-4 accent-primary-600"
          />
          Top-level only
        </label>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search articles…"
            className="bg-dark-800 border border-dark-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 w-52"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Filter by article type"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Article list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="h-10 w-10 mx-auto text-gray-600" />
          <p className="text-gray-500">No articles found</p>
          <Link
            href={newArticleHref}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors"
          >
            <PlusCircle className="h-4 w-4" /> Create first article
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-dark-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-800 text-left">
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    Article
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    Editor
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    Authors
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Pics</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    Published
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {articles.map((article) => {
                  const isExpandable = canExpand(article);
                  const isExpanded = !!expandedParents[article.id];
                  const children = childrenByParentId[article.id] ?? [];
                  const isChildrenLoading = !!childrenLoading[article.id];
                  const childError = childrenError[article.id];

                  return (
                    <Fragment key={article.id}>
                      <tr
                        onClick={() => router.push(buildEditHref(article.id))}
                        role="link"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(buildEditHref(article.id));
                          }
                        }}
                        className="hover:bg-dark-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isExpandable ? (
                              <button
                                type="button"
                                aria-label={
                                  isExpanded
                                    ? "Collapse child articles"
                                    : "Expand child articles"
                                }
                                aria-expanded={isExpanded}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(article);
                                }}
                                className="p-1 rounded hover:bg-dark-700 text-gray-400 hover:text-gray-200 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <div className="w-6" />
                            )}

                            <div className="flex items-center gap-3">
                              {article.coverPhoto ? (
                                <img
                                  src={photoUrl(article.coverPhoto.id)}
                                  alt=""
                                  className="h-10 w-16 object-cover rounded shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-16 bg-dark-700 rounded shrink-0 flex items-center justify-center">
                                  <BookOpen className="h-4 w-4 text-gray-600" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-white truncate max-w-xs">
                                  {article.title}
                                </p>
                                {article.subtitle && (
                                  <p className="text-xs text-gray-500 truncate max-w-xs">
                                    {article.subtitle}
                                  </p>
                                )}
                                <div className="mt-1">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${JOURNAL_TYPE_COLORS[article.type]}`}
                                  >
                                    {JOURNAL_TYPE_LABELS[article.type]}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[article.status]}`}
                          >
                            {STATUS_LABELS[article.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-32">
                          {article.editor?.displayName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-40">
                          {getAuthorNames(article.authors) || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {countPictures(article)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {formatYmd(article.publishedAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {formatYmd(article.updatedAt)}
                        </td>
                      </tr>

                      {isExpandable && isExpanded && (
                        <>
                          {isChildrenLoading && (
                            <tr key={`${article.id}__loading`}>
                              <td
                                colSpan={7}
                                className="px-4 py-3 text-xs text-gray-500 bg-dark-900/20"
                              >
                                <div className="pl-14">
                                  Loading child articles…
                                </div>
                              </td>
                            </tr>
                          )}

                          {!!childError && !isChildrenLoading && (
                            <tr key={`${article.id}__error`}>
                              <td
                                colSpan={7}
                                className="px-4 py-3 text-xs text-red-400 bg-dark-900/20"
                              >
                                <div className="pl-14">{childError}</div>
                              </td>
                            </tr>
                          )}

                          {!isChildrenLoading &&
                            !childError &&
                            children.length === 0 && (
                              <tr key={`${article.id}__empty`}>
                                <td
                                  colSpan={7}
                                  className="px-4 py-3 text-xs text-gray-500 bg-dark-900/20"
                                >
                                  <div className="pl-14">No child articles</div>
                                </td>
                              </tr>
                            )}

                          {!isChildrenLoading &&
                            !childError &&
                            children.map((child) => (
                              <tr
                                key={child.id}
                                onClick={() =>
                                  router.push(buildEditHref(child.id))
                                }
                                role="link"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    router.push(buildEditHref(child.id));
                                  }
                                }}
                                className="hover:bg-dark-800/30 transition-colors cursor-pointer"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3 pl-14">
                                    <span className="text-gray-600 text-xs shrink-0">
                                      ↳
                                    </span>
                                    {child.coverPhoto ? (
                                      <img
                                        src={photoUrl(child.coverPhoto.id)}
                                        alt=""
                                        className="h-8 w-12 object-cover rounded shrink-0"
                                      />
                                    ) : (
                                      <div className="h-8 w-12 bg-dark-700 rounded shrink-0 flex items-center justify-center">
                                        <BookOpen className="h-3.5 w-3.5 text-gray-600" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-medium text-gray-200 truncate max-w-xs">
                                        {child.title}
                                      </p>
                                      {child.subtitle && (
                                        <p className="text-xs text-gray-500 truncate max-w-xs">
                                          {child.subtitle}
                                        </p>
                                      )}
                                      <div className="mt-1">
                                        <span
                                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${JOURNAL_TYPE_COLORS[child.type]}`}
                                        >
                                          {JOURNAL_TYPE_LABELS[child.type]}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[child.status]}`}
                                  >
                                    {STATUS_LABELS[child.status]}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-32">
                                  {child.editor?.displayName ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-40">
                                  {getAuthorNames(child.authors) || "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                  {countPictures(child)}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                  {formatYmd(child.publishedAt)}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                  {formatYmd(child.updatedAt)}
                                </td>
                              </tr>
                            ))}
                        </>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {articles.map((article) => {
              const isExpandable = canExpand(article);
              const isExpanded = !!expandedParents[article.id];
              const children = childrenByParentId[article.id] ?? [];
              const isChildrenLoading = !!childrenLoading[article.id];
              const childError = childrenError[article.id];

              return (
                <div
                  key={article.id}
                  onClick={(e) => {
                    const target = e.target;
                    if (
                      target instanceof Element &&
                      target.closest('[data-stop-row-click="true"]')
                    ) {
                      return;
                    }
                    router.push(buildEditHref(article.id));
                  }}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    const target = e.target;
                    if (
                      target instanceof Element &&
                      target.closest('[data-stop-row-click="true"]')
                    ) {
                      return;
                    }
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(buildEditHref(article.id));
                    }
                  }}
                  className="bg-dark-800 border border-dark-700 rounded-xl p-4 space-y-3 cursor-pointer hover:border-dark-500 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {article.coverPhoto ? (
                      <img
                        src={photoUrl(article.coverPhoto.id)}
                        alt=""
                        className="h-12 w-20 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-20 bg-dark-700 rounded shrink-0 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-white text-sm">
                          {article.title}
                        </p>
                        {isExpandable && (
                          <button
                            type="button"
                            aria-label={
                              isExpanded
                                ? "Collapse child articles"
                                : "Expand child articles"
                            }
                            aria-expanded={isExpanded}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(article);
                            }}
                            className="p-1 rounded hover:bg-dark-700 text-gray-400 hover:text-gray-200 transition-colors shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                      {article.subtitle && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {article.subtitle}
                        </p>
                      )}
                      <div className="mt-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${JOURNAL_TYPE_COLORS[article.type]}`}
                        >
                          {JOURNAL_TYPE_LABELS[article.type]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[article.status]}`}
                        >
                          {STATUS_LABELS[article.status]}
                        </span>
                        <span className="text-xs text-gray-500">
                          Published: {formatYmd(article.publishedAt)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Updated: {formatYmd(article.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                        <span>
                          Editor: {article.editor?.displayName ?? "—"}
                        </span>
                        <span>·</span>
                        <span>Pics: {countPictures(article)}</span>
                      </div>
                    </div>
                  </div>

                  {isExpandable && isExpanded && (
                    <div
                      className="border border-dark-700 rounded-lg bg-dark-900/20"
                      data-stop-row-click="true"
                    >
                      {isChildrenLoading && (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          Loading child articles…
                        </div>
                      )}

                      {!!childError && !isChildrenLoading && (
                        <div className="px-3 py-2 text-xs text-red-400">
                          {childError}
                        </div>
                      )}

                      {!isChildrenLoading &&
                        !childError &&
                        children.length === 0 && (
                          <div className="px-3 py-2 text-xs text-gray-500">
                            No child articles
                          </div>
                        )}

                      {!isChildrenLoading &&
                        !childError &&
                        children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(buildEditHref(child.id));
                            }}
                            className="w-full text-left pl-8 pr-3 py-2 text-sm hover:bg-dark-800/60 transition-colors flex items-center gap-2"
                          >
                            <span className="text-gray-600 text-xs shrink-0">
                              ↳
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="text-gray-300 truncate block">
                                {child.title}
                              </span>
                              <span
                                className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${JOURNAL_TYPE_COLORS[child.type]}`}
                              >
                                {JOURNAL_TYPE_LABELS[child.type]}
                              </span>
                              <span className="text-xs text-gray-500 truncate block">
                                Published: {formatYmd(child.publishedAt)} ·
                                Updated: {formatYmd(child.updatedAt)} · Pics:{" "}
                                {countPictures(child)}
                              </span>
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[child.status]}`}
                            >
                              {STATUS_LABELS[child.status]}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-dark-700 hover:bg-dark-600 disabled:opacity-40 text-gray-300 rounded-lg transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm bg-dark-700 hover:bg-dark-600 disabled:opacity-40 text-gray-300 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
