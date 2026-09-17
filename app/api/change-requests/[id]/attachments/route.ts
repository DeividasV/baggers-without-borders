import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getChangeRequestsDir } from "@/src/lib/constants";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { resolveChangeRequestId } from "@/src/lib/changeRequestTickets";

// POST /api/change-requests/[id]/attachments - Upload file to change request
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const resolvedId = await resolveChangeRequestId(id);

    if (!resolvedId) {
      return NextResponse.json({ error: "Change request not found." }, { status: 404 });
    }

    // Check if change request exists
    const changeRequest = await prisma.changeRequest.findUnique({
      where: { id: resolvedId },
    });

    if (!changeRequest) {
      return NextResponse.json({ error: "Change request not found." }, { status: 404 });
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "Select a file to upload." }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "This file type isn't supported." }, { status: 400 });
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be 10 MB or smaller." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const filename = `${uuidv4()}${fileExtension}`;

    // Get upload directory from centralized config
    const uploadsBaseDir = getChangeRequestsDir();

    const filePath = path.join(uploadsBaseDir, filename);

    // Ensure directory exists (important for production deployment)
    const fs = require("fs");
    if (!fs.existsSync(uploadsBaseDir)) {
      fs.mkdirSync(uploadsBaseDir, { recursive: true });
    }

    // Write file to disk
    await writeFile(filePath, buffer);

    // Save attachment to database
    const attachment = await prisma.changeRequestAttachment.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `/uploads/change-requests/${filename}`,
        changeRequestId: resolvedId,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Couldn't upload this file. Try again." }, { status: 500 });
  }
}

// GET /api/change-requests/[id]/attachments - List attachments for change request
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const resolvedId = await resolveChangeRequestId(id);

    if (!resolvedId) {
      return NextResponse.json({ error: "Change request not found." }, { status: 404 });
    }

    const attachments = await prisma.changeRequestAttachment.findMany({
      where: { changeRequestId: resolvedId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json({ error: "Couldn't load attachments. Try again." }, { status: 500 });
  }
}
