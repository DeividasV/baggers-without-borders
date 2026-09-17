"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    // Only check once after session loads
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      if (!session || session.user.role !== "ADMIN") {
        router.push("/home");
      }
    }
  }, [status]); // Only depend on status, not session or router

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-gray-400">Loading page...</div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return <>{children}</>;
}
