import type { Metadata } from "next";
import JournalPublishedArticlePage from "@/features/journal/JournalPublishedArticlePage";
import { JOURNAL_JOURNAL_VIEW_TYPES } from "@/src/types/journal";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Journal",
};

export default async function ArticlePage({ params }: Props) {
  return (
    <JournalPublishedArticlePage
      params={params}
      basePath="/journal"
      listLabel="Journal"
      allowedTypes={JOURNAL_JOURNAL_VIEW_TYPES}
    />
  );
}
