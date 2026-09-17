import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { getDocumentsDir } from "@/src/lib/constants";
import { unlink, rmdir } from "fs/promises";
import path from "path";
import fs from "fs";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";
import { safeResolvePath } from "@/src/lib/fileUtils";

// GET /api/documents/[id] - Download file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;
    console.log("Download request for document ID:", id);

    const document = await prisma.document.findUnique({
      where: { id },
    });

    console.log(
      "Document query result:",
      document ? "FOUND" : "NOT FOUND",
      document,
    );

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (document.isFolder) {
      return NextResponse.json(
        { error: "Cannot download a folder" },
        { status: 400 },
      );
    }

    // Get storage location from centralized config
    const uploadsBaseDir = getDocumentsDir();

    // Safely resolve path (prevents traversal attacks)
    const filePath = safeResolvePath(uploadsBaseDir, document.path);
    if (!filePath) {
      console.error("Path traversal attempt detected:", {
        documentPath: document.path,
        uploadsBaseDir,
      });
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 },
      );
    }

    console.log("Download debug:", {
      documentId: document.id,
      documentName: document.name,
      documentPath: document.path,
      uploadsBaseDir,
      filePath,
      fileExists: fs.existsSync(filePath),
    });

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", {
        filePath,
        documentPath: document.path,
        uploadsBaseDir,
      });
      return NextResponse.json(
        { error: "File not found on disk" },
        { status: 404 },
      );
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    console.log("File read successfully, buffer length:", fileBuffer.length);

    // Check if this is a preview request (inline) or download request
    const url = new URL(request.url);
    const download = url.searchParams.get("download") === "true";

    // Log document download
    await logAdminAction(
      EventType.ADMIN_DOCUMENT_DOWNLOAD,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "Document",
        resourceId: id,
        actionDetails: {
          name: document.name,
          originalName: document.originalName,
          mimeType: document.mimeType,
          size: document.size,
          isDownload: download,
        },
      },
    );

    // Sanitize filename for Content-Disposition header (remove non-ASCII characters)
    const sanitizedFilename =
      document.originalName?.replace(/[^\x00-\x7F]/g, "") || document.name; // Remove non-ASCII

    // Return file with appropriate headers
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": download
          ? `attachment; filename="${sanitizedFilename}"`
          : `inline; filename="${sanitizedFilename}"`,
        "Content-Length":
          document.size?.toString() || fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading file - FULL ERROR:", error);
    console.error("Error stack:", (error as Error).stack);

    // Log failure
    if (session) {
      const params_resolved = await params;
      await logAdminAction(
        EventType.ADMIN_DOCUMENT_DOWNLOAD,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "Document",
          resourceId: params_resolved.id,
          errorMessage: (error as Error).message,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to download file", details: (error as Error).message },
      { status: 500 },
    );
  }
}

// PATCH /api/documents/[id] - Rename file or folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;
    const { name, parentId } = await request.json();

    if (!name && parentId === undefined) {
      return NextResponse.json(
        { error: "Name or parentId is required" },
        { status: 400 },
      );
    }

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (parentId !== undefined) updateData.parentId = parentId;

    // Update in database
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    // Log document update
    await logAdminAction(
      EventType.ADMIN_DOCUMENT_UPDATE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "Document",
        resourceId: id,
        actionDetails: {
          oldName: document.name,
          newName: name,
          oldParentId: document.parentId,
          newParentId: parentId,
        },
      },
    );

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error updating document:", error);

    // Log failure
    if (session) {
      const params_resolved = await params;
      await logAdminAction(
        EventType.ADMIN_DOCUMENT_UPDATE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "Document",
          resourceId: params_resolved.id,
          errorMessage: (error as Error).message,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 },
    );
  }
}

// DELETE /api/documents/[id] - Delete file or folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Prevent deleting non-empty folders
    if (document.isFolder && document.children.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete non-empty folder" },
        { status: 400 },
      );
    }

    // Get storage location from centralized config
    const uploadsBaseDir = getDocumentsDir();

    // Remove leading slash from path if present to avoid path.join treating it as absolute
    const normalizedPath = document.path.startsWith("/")
      ? document.path.substring(1)
      : document.path;

    const physicalPath = path.join(uploadsBaseDir, normalizedPath);

    // Delete physical file/folder if exists
    if (fs.existsSync(physicalPath)) {
      if (document.isFolder) {
        await rmdir(physicalPath);
      } else {
        await unlink(physicalPath);
      }
    }

    // Delete from database (cascade will handle children if any)
    await prisma.document.delete({
      where: { id },
    });

    // Log document deletion
    await logAdminAction(
      EventType.ADMIN_DOCUMENT_DELETE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "Document",
        resourceId: id,
        actionDetails: {
          name: document.name,
          isFolder: document.isFolder,
          path: document.path,
        },
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);

    // Log failure
    if (session) {
      const params_resolved = await params;
      await logAdminAction(
        EventType.ADMIN_DOCUMENT_DELETE,
        EventStatus.FAILURE,
        request.headers,
        session.user.id,
        {
          resourceType: "Document",
          resourceId: params_resolved.id,
          errorMessage: (error as Error).message,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
