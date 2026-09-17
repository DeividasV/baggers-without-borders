import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { getSponsorsDir } from "@/src/lib/constants";
import { optimizeImage, getImageErrorDetails } from "@/src/lib/imageOptimizer";
import path from "path";

// POST /api/sponsors/[id]/logo - Upload logo (admin only)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const sponsor = await prisma.sponsor.findUnique({ where: { id } });
    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const data = await request.formData();
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let optimized: Buffer;
    try {
      optimized = await optimizeImage(buffer);
    } catch (error) {
      return NextResponse.json(getImageErrorDetails(error), { status: 400 });
    }

    const dir = getSponsorsDir();
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, `${id}.webp`);
    await writeFile(filePath, optimized);

    const logoPath = `/uploads/sponsors/${id}.webp`;
    await prisma.sponsor.update({
      where: { id },
      data: { logoPath },
    });

    return NextResponse.json({ success: true, logoPath });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}

// DELETE /api/sponsors/[id]/logo - Remove logo (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const sponsor = await prisma.sponsor.findUnique({ where: { id } });
    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    if (!sponsor.logoPath) {
      return NextResponse.json({ error: "No logo to delete" }, { status: 404 });
    }

    const filePath = path.join(getSponsorsDir(), `${id}.webp`);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    await prisma.sponsor.update({
      where: { id },
      data: { logoPath: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logo delete error:", error);
    return NextResponse.json({ error: "Failed to delete logo" }, { status: 500 });
  }
}
