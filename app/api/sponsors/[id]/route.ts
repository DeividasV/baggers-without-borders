import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import { getSponsorsDir } from "@/src/lib/constants";
import path from "path";

// PUT /api/sponsors/[id] - Admin only
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, url } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await prisma.sponsor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        url: url?.trim() || null,
      },
    });

    return NextResponse.json(sponsor);
  } catch (error) {
    console.error("Error updating sponsor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/sponsors/[id] - Admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.sponsor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    // Delete logo file if present
    if (existing.logoPath) {
      const filePath = path.join(getSponsorsDir(), `${id}.webp`);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
        } catch {
          // Non-fatal — continue with deletion
        }
      }
    }

    await prisma.sponsor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sponsor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
