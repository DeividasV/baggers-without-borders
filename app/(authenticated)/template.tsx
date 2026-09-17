import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { checkMissingRequiredConsents } from "@/src/lib/consent-check";
import ConsentRedirect from "./ConsentRedirect";

/**
 * Template for authenticated routes
 * Server Component that checks for missing required consents before rendering pages
 * Uses client-side redirect to avoid NEXT_REDIRECT console errors
 */
export default async function AuthenticatedTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Only check consents for authenticated users
  if (session?.user?.id) {
    try {
      const missingConsents = await checkMissingRequiredConsents(
        session.user.id
      );

      // Render client redirect component if user has missing required consents
      if (missingConsents.length > 0) {
        return <ConsentRedirect />;
      }
    } catch (error) {
      // Log error but don't block login if consent check fails
      console.error("Error checking consents:", error);
    }
  }

  return <>{children}</>;
}
