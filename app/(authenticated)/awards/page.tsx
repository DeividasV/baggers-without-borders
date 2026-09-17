import type { Metadata } from "next";
import JournalCollectionPage from "@/features/journal/JournalCollectionPage";
import { JOURNAL_AWARDS_VIEW_TYPES } from "@/src/types/journal";

export const metadata: Metadata = {
  title: "Awards",
  description: "Browse awards and achievements.",
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AwardsPage({ searchParams }: Props) {
  return (
    <JournalCollectionPage
      basePath="/awards"
      heading="Awards"
      emptyLabel="No awards or achievements published yet."
      includedTypes={JOURNAL_AWARDS_VIEW_TYPES}
      searchParams={searchParams}
    />
  );
}
