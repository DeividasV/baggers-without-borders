import type { Metadata } from "next";
import JournalPublishedArticlePage from "@/features/journal/JournalPublishedArticlePage";
import { JOURNAL_AWARDS_VIEW_TYPES } from "@/src/types/journal";

export const metadata: Metadata = {
  title: "Awards",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AwardsArticlePage({ params }: Props) {
  return (
    <JournalPublishedArticlePage
      params={params}
      basePath="/awards"
      listLabel="Awards"
      allowedTypes={JOURNAL_AWARDS_VIEW_TYPES}
    />
  );
}
