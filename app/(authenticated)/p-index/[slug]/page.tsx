import type { Metadata } from "next";
import JournalPublishedArticlePage from "@/features/journal/JournalPublishedArticlePage";

export const metadata: Metadata = {
  title: "P-Index",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PIndexArticlePage({ params }: Props) {
  return (
    <JournalPublishedArticlePage
      params={params}
      basePath="/p-index"
      listLabel="P-Index"
      allowedTypes={["p-index"]}
    />
  );
}
