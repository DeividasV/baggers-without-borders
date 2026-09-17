import type { Metadata } from "next";
import JournalCollectionPage from "@/features/journal/JournalCollectionPage";
import { JOURNAL_JOURNAL_VIEW_TYPES } from "@/src/types/journal";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export const metadata: Metadata = {
  title: "Journal",
  description: "Browse journal posts and articles.",
};

export default async function JournalPage({ searchParams }: Props) {
  return (
    <JournalCollectionPage
      basePath="/journal"
      heading="Journal"
      emptyLabel="No journal posts published yet."
      includedTypes={JOURNAL_JOURNAL_VIEW_TYPES}
      searchParams={searchParams}
    />
  );
}
