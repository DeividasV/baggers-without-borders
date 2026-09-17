import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/app/components/features/auth";
import { getOptionalSession } from "@/src/lib/api-auth";

export const metadata = {
  title: "Forgot Password",
  description: "Reset your password",
};

export default async function ForgotPasswordPage() {
  const session = await getOptionalSession();

  if (session) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="max-w-md w-full space-y-6 p-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
