import type { Metadata } from "next";
import JournalCollectionPage from "@/features/journal/JournalCollectionPage";

export const metadata: Metadata = {
  title: "Other",
  description: "Browse other posts.",
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function OtherPage({ searchParams }: Props) {
  return (
    <JournalCollectionPage
      basePath="/other"
      heading="Other"
      emptyLabel="No other posts published yet."
      includedTypes={["other"]}
      searchParams={searchParams}
    />
  );
}
