import { SponsorsList } from "@/features/sponsors";
import { SITE_NAME } from "@/src/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsors",
};

export default function SponsorsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-primary-400">Sponsors &amp; Donors</h1>
        <p className="text-gray-400 text-sm mt-1">
          Organisations and individuals who support {SITE_NAME} — thank you.
        </p>
      </header>
      <SponsorsList />
    </main>
  );
}
