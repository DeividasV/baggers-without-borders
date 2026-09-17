import { SponsorsAdmin } from "@/features/sponsors";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsors | Admin",
};

export default function AdminSponsorsPage() {
  return <SponsorsAdmin />;
}
