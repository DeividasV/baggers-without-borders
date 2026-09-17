import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { getJournalPhotosDir } from "@/src/lib/constants";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import {
  validateImageFile,
  getImageErrorDetails,
  ImageValidationError,
  ImageCorruptedError,
} from "@/src/lib/imageOptimizer";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB before optimization

/**
 * Optimize journal photo: resize to max 1920x1200, convert to WebP at 88% quality.
 * Larger than the HOF meister image (800x600) to support high-quality article photos.
 */
async function optimizeJournalPhoto(buffer: Buffer): Promise<Buffer> {
  await validateImageFile(buffer);
  return sharp(buffer)
    .resize(1920, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88, effort: 4 })
    .toBuffer();
}

// POST /api/journal/photos - Upload a journal photo
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null) ?? undefined;
    const caption = (formData.get("caption") as string | null) ?? undefined;
    const attribution =
      (formData.get("attribution") as string | null) ?? undefined;
    const journalId = (formData.get("journalId") as string | null) ?? undefined;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size too large (max 20 MB)" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // Optimize photo (convert to WebP, resize)
    let optimizedBuffer: Buffer;
    try {
      optimizedBuffer = await optimizeJournalPhoto(rawBuffer);
    } catch (error) {
      if (
        error instanceof ImageValidationError ||
        error instanceof ImageCorruptedError
      ) {
        const details = getImageErrorDetails(error);
        return NextResponse.json(
          { error: details.error, suggestion: details.suggestion },
          { status: 400 },
        );
      }
      throw error;
    }

    const filename = `${uuidv4()}.webp`;
    const dir = path.resolve(getJournalPhotosDir());
    await mkdir(dir, { recursive: true });
    const filePath = path.resolve(dir, filename);
    if (!filePath.startsWith(dir + path.sep)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate journalId early to avoid FK errors and orphaned files
    if (journalId) {
      const exists = await prisma.journal.findUnique({
        where: { id: journalId },
        select: { id: true },
      });
      if (!exists) {
        return NextResponse.json(
          { error: "Invalid journalId" },
          { status: 400 },
        );
      }
    }

    await writeFile(filePath, optimizedBuffer);

    // Get order — put new photo at the end
    let order = 0;
    if (journalId) {
      const count = await prisma.journalPhoto.count({ where: { journalId } });
      order = count;
    }

    try {
      const photo = await prisma.journalPhoto.create({
        data: {
          filename,
          originalName: file.name,
          mimeType: "image/webp",
          size: optimizedBuffer.length,
          title: title || null,
          caption: caption || null,
          attribution: attribution || null,
          journalId: journalId || null,
          order,
        },
      });

      return NextResponse.json(photo, { status: 201 });
    } catch (error) {
      // Best-effort cleanup: if DB write fails, remove the written file
      try {
        await unlink(filePath);
      } catch {
        // ignore
      }
      throw error;
    }
  } catch (error) {
    console.error("Error uploading journal photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 },
    );
  }
}
