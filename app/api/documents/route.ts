import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { getDocumentsDir } from "@/src/lib/constants";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";
import { safeResolvePath, isValidFolderName } from "@/src/lib/fileUtils";

// GET /api/documents - List files and folders
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");
  const search = searchParams.get("search");

  try {
    // If search query is provided, search across all documents
    if (search && search.trim()) {
      // Get all documents and filter in memory for case-insensitive search
      const allDocuments = await prisma.document.findMany({
        orderBy: [{ isFolder: "desc" }, { name: "asc" }],
      });

      const searchLower = search.trim().toLowerCase();
      const documents = allDocuments.filter((doc: any) =>
        doc.name.toLowerCase().includes(searchLower),
      );

      return NextResponse.json(documents);
    }

    // Otherwise, return documents in current folder
    const documents = await prisma.document.findMany({
      where: {
        parentId: parentId || null,
      },
      orderBy: [{ isFolder: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

// POST /api/documents - Upload file or create folder
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await getSession();

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderName = formData.get("folderName") as string | null;
    const parentId = formData.get("parentId") as string | null;

    // Create folder
    if (folderName) {
      // Validate folder name for security
      if (!isValidFolderName(folderName)) {
        return NextResponse.json(
          { error: "Invalid folder name. Folder names cannot contain path separators or traversal sequences." },
          { status: 400 },
        );
      }

      // Get parent path
      let parentPath = "/";
      if (parentId) {
        const parent = await prisma.document.findUnique({
          where: { id: parentId },
        });
        if (!parent) {
          return NextResponse.json(
            { error: "Parent folder not found" },
            { status: 404 },
          );
        }
        parentPath = parent.path;
      }

      const folderPath = `${parentPath}${folderName}/`;

      // Create folder in database
      const folder = await prisma.document.create({
        data: {
          name: folderName,
          isFolder: true,
          parentId,
          path: folderPath,
        },
      });

      // Create physical folder
      // Get upload directory from centralized config
      const uploadsBaseDir = getDocumentsDir();

      // Safely resolve path (prevents traversal attacks)
      const physicalPath = safeResolvePath(uploadsBaseDir, folderPath);
      if (!physicalPath) {
        return NextResponse.json(
          { error: "Invalid folder path" },
          { status: 400 },
        );
      }

      await mkdir(physicalPath, { recursive: true });

      // Log folder creation
      await logAdminAction(
        EventType.ADMIN_DOCUMENT_CREATE,
        EventStatus.SUCCESS,
        request.headers,
        session.user.id,
        {
          resourceType: "Document",
          resourceId: folder.id,
          actionDetails: {
            name: folderName,
            isFolder: true,
            path: folderPath,
          },
        },
      );

      return NextResponse.json(folder);
    }

    // Upload file
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "text/markdown",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "File type not allowed" },
          { status: 400 },
        );
      }

      // 50MB limit for documents
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size too large (max 50MB)" },
          { status: 400 },
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const fileExtension = path.extname(file.name);
      const filename = `${uuidv4()}${fileExtension}`;

      // Get parent path
      let parentPath = "/";
      if (parentId) {
        const parent = await prisma.document.findUnique({
          where: { id: parentId },
        });
        if (!parent) {
          return NextResponse.json(
            { error: "Parent folder not found" },
            { status: 404 },
          );
        }
        parentPath = parent.path;
      }

      const filePath = `${parentPath}${filename}`;

      // Get storage location from centralized config
      const uploadsBaseDir = getDocumentsDir();

      // Safely resolve path (prevents traversal attacks)
      const physicalPath = safeResolvePath(uploadsBaseDir, filePath);
      if (!physicalPath) {
        return NextResponse.json(
          { error: "Invalid file path" },
          { status: 400 },
        );
      }

      // Ensure directory exists
      await mkdir(path.dirname(physicalPath), { recursive: true });

      // Write file to disk
      await writeFile(physicalPath, buffer);

      // Save document to database
      const document = await prisma.document.create({
        data: {
          name: file.name,
          isFolder: false,
          parentId,
          path: filePath,
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
        },
      });

      // Log file upload
      await logAdminAction(
        EventType.ADMIN_DOCUMENT_UPLOAD,
        EventStatus.SUCCESS,
        request.headers,
        session.user.id,
        {
          resourceType: "Document",
          resourceId: document.id,
          actionDetails: {
            originalName: file.name,
            filename,
            mimeType: file.type,
            size: file.size,
            path: filePath,
          },
        },
      );

      return NextResponse.json(document);
    }

    return NextResponse.json(
      { error: "Either file or folderName is required" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error creating document:", error);

    // Log failure
    if (session) {
      await logAdminAction(
        EventType.ADMIN_DOCUMENT_CREATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "Document",
          errorMessage: (error as Error).message,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 },
    );
  }
}
