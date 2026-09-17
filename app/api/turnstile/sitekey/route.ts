import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (typeof siteKey !== "string" || !siteKey.trim()) {
    return NextResponse.json(
      { error: "Turnstile site key is not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { siteKey },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
