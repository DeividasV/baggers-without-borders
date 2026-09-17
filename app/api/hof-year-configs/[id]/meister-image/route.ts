import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import {
  getMeisterReportImagePath,
  getMeisterReportsDir,
} from "@/src/lib/constants";
import {
  optimizeImage,
  getImageErrorDetails,
} from "@/src/lib/imageOptimizer";

/**
 * POST /api/hof-year-configs/[id]/meister-image
 * Upload and optimize HoF Meister report image
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check: must be ADMIN
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if config exists
    const config = await prisma.hofYearConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    // Get file from form data
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 5MB limit for images
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large (max 5MB)" },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize image (this also validates format)
    let optimizedBuffer: Buffer;
    try {
      optimizedBuffer = await optimizeImage(buffer);
    } catch (error) {
      const errorDetails = getImageErrorDetails(error);
      return NextResponse.json(errorDetails, { status: 400 });
    }

    // Ensure upload directory exists (important for production deployment)
    const uploadsBaseDir = getMeisterReportsDir();
    if (!existsSync(uploadsBaseDir)) {
      mkdirSync(uploadsBaseDir, { recursive: true });
    }

    // Get file path (always .webp since we convert)
    const filePath = getMeisterReportImagePath(id);

    // Delete existing image if present
    if (config.meisterReportImage && existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (error) {
        console.error("Failed to delete old image:", error);
        // Continue anyway - we'll overwrite
      }
    }

    // Write optimized image
    await writeFile(filePath, optimizedBuffer);

    // Update database with relative path for serving
    const relativePath = `/uploads/meister-reports/${id}.webp`;
    await prisma.hofYearConfig.update({
      where: { id },
      data: {
        meisterReportImage: relativePath,
      },
    });

    return NextResponse.json({
      success: true,
      path: relativePath,
      message: "Image uploaded and optimized successfully",
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hof-year-configs/[id]/meister-image
 * Delete HoF Meister report image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check: must be ADMIN
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if config exists
    const config = await prisma.hofYearConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    if (!config.meisterReportImage) {
      return NextResponse.json(
        { error: "No image to delete" },
        { status: 404 }
      );
    }

    // Delete file from disk
    const filePath = getMeisterReportImagePath(id);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Clear database field
    await prisma.hofYearConfig.update({
      where: { id },
      data: {
        meisterReportImage: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Image deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
