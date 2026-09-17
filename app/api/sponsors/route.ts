import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// GET /api/sponsors - All authenticated members can read
export async function GET() {
  try {
    await getSession();

    const sponsors = await prisma.sponsor.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(sponsors);
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/sponsors - Admin only
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, url, slug: providedSlug } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = providedSlug?.trim() || generateSlug(name);

    if (!slug) {
      return NextResponse.json(
        { error: "Could not generate a valid slug from name" },
        { status: 400 }
      );
    }

    const existing = await prisma.sponsor.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A sponsor with this slug already exists" },
        { status: 409 }
      );
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        slug,
        name: name.trim(),
        description: description?.trim() || null,
        url: url?.trim() || null,
      },
    });

    return NextResponse.json(sponsor, { status: 201 });
  } catch (error) {
    console.error("Error creating sponsor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
