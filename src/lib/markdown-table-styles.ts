import type { JournalTableStyle } from "@/src/types/journal";

type MarkdownTableStylePreset = {
  wrapperClassName: string;
  tableClassName: string;
  headerCellClassName: string;
  bodyCellClassName: string;
};

const sharedCellClasses = "align-top whitespace-pre-line wrap-anywhere";

const legacyPreset: MarkdownTableStylePreset = {
  wrapperClassName: "my-4 w-full overflow-x-auto md:overflow-x-visible",
  tableClassName: "w-full table-fixed",
  headerCellClassName: sharedCellClasses,
  bodyCellClassName: sharedCellClasses,
};

const bwbBaseTable =
  "w-full table-auto border-collapse text-sm text-gray-200 [&_thead_tr]:border-b [&_thead_tr]:border-dark-600 [&_tbody_tr]:border-b [&_tbody_tr]:border-dark-700 [&_tbody_tr:hover]:bg-dark-800/70";

const bwbShell =
  "not-prose my-5 overflow-x-auto rounded-xl border border-dark-700 bg-dark-900 shadow-lg scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800";

const standardHeaderCell = `${sharedCellClasses} px-4 py-3 text-left text-sm font-medium text-gray-400`;
const standardBodyCell = `${sharedCellClasses} px-4 py-4 text-sm text-gray-200`;

const TABLE_STYLE_PRESETS: Record<JournalTableStyle, MarkdownTableStylePreset> = {
  legacy: legacyPreset,
  none: {
    wrapperClassName: "my-4 w-full overflow-x-auto md:overflow-x-visible",
    tableClassName:
      "w-full table-auto border-collapse text-sm text-inherit [&_thead_tr]:border-b [&_thead_tr]:border-current/20 [&_tbody_tr]:border-b [&_tbody_tr]:border-current/10",
    headerCellClassName: `${sharedCellClasses} px-3 py-2 text-left font-semibold text-inherit`,
    bodyCellClassName: `${sharedCellClasses} px-3 py-2 text-inherit`,
  },
  standard: {
    wrapperClassName: bwbShell,
    tableClassName: bwbBaseTable,
    headerCellClassName: standardHeaderCell,
    bodyCellClassName: standardBodyCell,
  },
  compact: {
    wrapperClassName: bwbShell,
    tableClassName: bwbBaseTable,
    headerCellClassName: `${sharedCellClasses} px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400`,
    bodyCellClassName: `${sharedCellClasses} px-3 py-3 text-sm text-gray-200`,
  },
  striped: {
    wrapperClassName: bwbShell,
    tableClassName: `${bwbBaseTable} [&_tbody_tr:nth-child(even)]:bg-dark-800/45 [&_tbody_tr:hover]:bg-dark-700/70`,
    headerCellClassName: standardHeaderCell,
    bodyCellClassName: standardBodyCell,
  },
  minimal: {
    wrapperClassName:
      "not-prose my-5 overflow-x-auto rounded-lg border border-dark-800 bg-dark-950/70 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-dark-900",
    tableClassName:
      "w-full table-auto border-collapse text-sm text-gray-300 [&_thead_tr]:border-b [&_thead_tr]:border-dark-700 [&_tbody_tr]:border-b [&_tbody_tr]:border-dark-800/80",
    headerCellClassName: `${sharedCellClasses} px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500`,
    bodyCellClassName: `${sharedCellClasses} px-3 py-3 text-sm text-gray-300`,
  },
  "highlight-header": {
    wrapperClassName: bwbShell,
    tableClassName: `${bwbBaseTable} [&_thead]:bg-linear-to-r [&_thead]:from-primary-900/60 [&_thead]:via-primary-900/30 [&_thead]:to-dark-900`,
    headerCellClassName: `${sharedCellClasses} px-4 py-3 text-left text-sm font-semibold text-primary-100`,
    bodyCellClassName: standardBodyCell,
  },
  "responsive-cards": {
    wrapperClassName:
      "not-prose my-5 overflow-x-hidden md:overflow-x-auto scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800",
    tableClassName:
      "w-full table-auto border-separate border-spacing-0 text-sm text-gray-200 [&_thead]:hidden md:[&_thead]:table-header-group [&_thead_tr]:border-b [&_thead_tr]:border-dark-600 [&_tbody]:block md:[&_tbody]:table-row-group [&_tbody_tr]:mb-4 [&_tbody_tr]:block [&_tbody_tr]:rounded-xl [&_tbody_tr]:border [&_tbody_tr]:border-dark-700 [&_tbody_tr]:bg-dark-900 [&_tbody_tr]:shadow-lg md:[&_tbody_tr]:mb-0 md:[&_tbody_tr]:table-row md:[&_tbody_tr]:rounded-none md:[&_tbody_tr]:border-x-0 md:[&_tbody_tr]:border-t-0 md:[&_tbody_tr]:border-b md:[&_tbody_tr]:border-dark-700 md:[&_tbody_tr]:bg-transparent md:[&_tbody_tr]:shadow-none [&_tbody_tr:hover]:bg-dark-800/80 [&_tbody_td]:block md:[&_tbody_td]:table-cell [&_tbody_td]:border-b [&_tbody_td]:border-dark-800 [&_tbody_td:last-child]:border-b-0 md:[&_tbody_td]:border-b-0",
    headerCellClassName: standardHeaderCell,
    bodyCellClassName: `${sharedCellClasses} px-4 py-3 text-sm text-gray-200`,
  },
};

export function getMarkdownTableStylePreset(
  tableStyle: JournalTableStyle | undefined
): MarkdownTableStylePreset {
  if (!tableStyle) {
    return TABLE_STYLE_PRESETS.legacy;
  }

  return TABLE_STYLE_PRESETS[tableStyle] ?? TABLE_STYLE_PRESETS.legacy;
}
