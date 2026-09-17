import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/app/components/features/auth";
import { getOptionalSession } from "@/src/lib/api-auth";

export const metadata = {
  title: "Reset Password",
  description: "Create a new password for your account",
};

function ResetPasswordContent() {
  return <ResetPasswordForm />;
}

export default async function ResetPasswordPage() {
  const session = await getOptionalSession();

  if (session) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="max-w-md w-full space-y-6 p-8">
        <Suspense fallback={<div>Loading form...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
