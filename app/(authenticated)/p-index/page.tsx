import type { Metadata } from "next";
import JournalCollectionPage from "@/features/journal/JournalCollectionPage";

export const metadata: Metadata = {
  title: "P-Index",
  description: "Browse P-Index League posts.",
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function PIndexPage({ searchParams }: Props) {
  return (
    <JournalCollectionPage
      basePath="/p-index"
      heading="P-Index"
      emptyLabel="No P-Index posts published yet."
      includedTypes={["p-index"]}
      searchParams={searchParams}
    />
  );
}
