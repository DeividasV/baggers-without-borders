import { redirect } from "next/navigation";

export default async function JournalSettingsPage() {
  redirect("/admin/settings#journal-editors");
}
