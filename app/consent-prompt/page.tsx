import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { checkMissingRequiredConsents } from "@/src/lib/consent-check";
import ConsentPromptContent from "./ConsentPromptContent";

/**
 * Consent Prompt Page
 * Shows when authenticated users have missing required consents
 * Blocks all other actions until consents are accepted or user logs out
 */
export default async function ConsentPromptPage() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if user has missing consents
  const missingConsents = await checkMissingRequiredConsents(session.user.id);

  // If no missing consents, redirect to home
  if (missingConsents.length === 0) {
    redirect("/");
  }

  return <ConsentPromptContent />;
}
