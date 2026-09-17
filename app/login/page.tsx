import { redirect } from "next/navigation";
import { SITE_NAME } from "@/src/config/site";
import Link from "next/link";
import { LoginForm } from "@/components/ui";
import { getOptionalSession } from "@/src/lib/api-auth";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your hiking and climbing community account",
};

export default async function LoginPage() {
  // Redirect authenticated users to home
  const session = await getOptionalSession();

  if (session) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 sm:px-8">
      <div className="max-w-md w-full space-y-6">
        <LoginForm />
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">Welcome to {SITE_NAME}</p>
          <Link
            href="/contact"
            className="text-sm text-gray-300 hover:text-primary-400 transition-colors underline block"
          >
            Need help? Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
