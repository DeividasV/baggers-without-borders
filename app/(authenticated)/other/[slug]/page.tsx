import type { Metadata } from "next";
import JournalPublishedArticlePage from "@/features/journal/JournalPublishedArticlePage";

export const metadata: Metadata = {
  title: "Other",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OtherArticlePage({ params }: Props) {
  return (
    <JournalPublishedArticlePage
      params={params}
      basePath="/other"
      listLabel="Other"
      allowedTypes={["other"]}
    />
  );
}
