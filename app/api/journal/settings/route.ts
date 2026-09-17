import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { isJournalEditor } from "@/src/lib/journal-auth";

const SETTING_KEYS = ["journal_editor_ids"];

// GET /api/journal/settings - Get journal settings + caller's editor status
export async function GET() {
  let session;
  try {
    session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.appSetting.findMany({
    where: { key: { in: SETTING_KEYS } },
  });

  const map: Record<string, string | null> = { journal_editor_ids: null };
  for (const s of settings) {
    map[s.key] = s.value;
  }

  const isEditor = await isJournalEditor(session.user.id);

  return NextResponse.json({ settings: map, isEditor });
}

// PUT /api/journal/settings - Update a journal setting (ADMIN only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { key, value } = body;

  if (!SETTING_KEYS.includes(key)) {
    return NextResponse.json({ error: "Unknown setting key" }, { status: 400 });
  }

  const setting = await prisma.appSetting.upsert({
    where: { key },
    update: { value: String(value), category: "journal" },
    create: {
      key,
      value: String(value),
      category: "journal",
      description: `Journal: ${key}`,
    },
  });

  return NextResponse.json(setting);
}
