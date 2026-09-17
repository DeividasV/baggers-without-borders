import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/src/lib/api-auth";
import { getUserConsentsDir } from "@/src/lib/constants";
import { prisma } from "@/src/lib/prisma";

// POST /api/users/[userId]/consents/[consentId]/attachments - Upload attachment to consent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consentId: string }> }
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const { id, consentId } = await params;

    // Check if consent record exists
    const userConsent = await prisma.userConsent.findUnique({
      where: { id: consentId },
    });

    if (!userConsent || userConsent.userId !== id) {
      return NextResponse.json(
        { error: "Consent record not found" },
        { status: 404 }
      );
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type - allow PDF and images
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "File type not allowed. Only PDF and image files (JPEG, PNG, GIF, WebP) are accepted.",
        },
        { status: 400 }
      );
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large (max 10MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const filename = `${uuidv4()}${fileExtension}`;

    // Get upload directory from centralized config
    const uploadsBaseDir = getUserConsentsDir();

    const filePath = path.join(uploadsBaseDir, filename);

    // Ensure directory exists
    const fs = require("fs");
    if (!fs.existsSync(uploadsBaseDir)) {
      fs.mkdirSync(uploadsBaseDir, { recursive: true });
    }

    // Write file to disk
    await writeFile(filePath, buffer);

    // Save attachment to database
    const attachment = await prisma.userConsentAttachment.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `/uploads/user-consents/${filename}`,
        userConsentId: consentId,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Error uploading consent attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/users/[userId]/consents/[consentId]/attachments - List attachments for consent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consentId: string }> }
) {
  try {
    // Middleware ensures user is authenticated
    const session = await getSession();
    const { id, consentId } = await params;

    // Users can view their own consents, admins can view all
    if (session.user.id !== id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const attachments = await prisma.userConsentAttachment.findMany({
      where: { userConsentId: consentId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("Error fetching consent attachments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
