import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Force Node.js runtime for filesystem access
export const runtime = "nodejs";

/**
 * GET /api/legal/[documentType]
 * Serves legal document markdown files (privacy-policy, terms-of-service)
 * Public endpoint - no authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentType: string }> }
) {
  try {
    const { documentType } = await params;

    // Whitelist allowed document types to prevent path traversal
    const allowedDocuments = ["privacy-policy", "terms-of-service"];

    if (!allowedDocuments.includes(documentType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    // Construct safe file path
    const legalDir = path.join(process.cwd(), "data", "legal");
    const filePath = path.join(legalDir, `${documentType}.md`);

    // Verify the resolved path is within legal directory (extra security)
    const resolvedPath = path.resolve(filePath);
    const resolvedLegalDir = path.resolve(legalDir);

    if (!resolvedPath.startsWith(resolvedLegalDir)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Read and return file content
    const content = await fs.readFile(filePath, "utf-8");

    // Get file modification time for ETag
    const stats = await fs.stat(filePath);
    const etag = `"${stats.mtime.getTime()}"`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=300, must-revalidate", // Cache for 5 minutes with revalidation
        ETag: etag,
        "Last-Modified": stats.mtime.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error serving legal document:", error);
    return NextResponse.json(
      { error: "Failed to load document" },
      { status: 500 }
    );
  }
}
