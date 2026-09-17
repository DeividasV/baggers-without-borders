import { redirect } from "next/navigation";
import { SITE_NAME } from "@/src/config/site";
import Link from "next/link";
import { RegisterForm } from "@/app/components/features/auth";
import { getOptionalSession } from "@/src/lib/api-auth";

export const metadata = {
  title: "Register",
  description: "Create a new account",
};

export default async function RegisterPage() {
  const session = await getOptionalSession();

  if (session) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 py-8 sm:py-12 px-4 sm:px-8">
      <div className="max-w-md w-full space-y-6">
        <RegisterForm />
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">Join {SITE_NAME}</p>
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
