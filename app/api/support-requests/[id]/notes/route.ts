import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession, getCurrentUserId, isAdmin } from "@/src/lib/api-auth";
import { checkRateLimit } from "@/src/lib/rateLimit";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { getNotesDir } from "@/src/lib/constants";
import {
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_CONTENT_LENGTH,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  NOTE_RATE_LIMIT,
} from "@/src/lib/helpdesk-constants";

// GET /api/support-requests/[id]/notes - List notes with attachments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const notes = await prisma.ticketNote.findMany({
      where: { ticketId: id },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

// POST /api/support-requests/[id]/notes - Create note with attachments
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // SECURITY: Rate limiting to prevent abuse
  // Why 20 notes per 15 minutes?
  // - Prevents spam and database flooding from compromised accounts
  // - Allows legitimate support workflows (typical tickets need 2-5 notes)
  // - Balances security without impacting real usage patterns
  const rateLimitAllowed = await checkRateLimit(
    request.headers.get("x-forwarded-for") || session.user.id,
    "note-creation",
    NOTE_RATE_LIMIT,
  );

  if (!rateLimitAllowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  // Track uploaded files for cleanup on failure (declared here for catch block access)
  let uploadedFiles: string[] = [];

  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ticket exists
    const ticket = await prisma.supportRequest.findUnique({
      where: { id },
      include: { notes: { where: { isInternal: true } } },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const content = formData.get("content") as string;
    const isInternal = formData.get("isInternal") === "true";
    const files = formData.getAll("files") as File[];

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 },
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Note content exceeds ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 },
      );
    }

    // Validate file sizes
    let totalSize = 0;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File "${file.name}" exceeds 5MB limit`,
          },
          { status: 400 },
        );
      }
      totalSize += file.size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: "Total file size exceeds 25MB limit" },
        { status: 400 },
      );
    }

    // Process file uploads
    const uploadDir = getNotesDir();

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    const attachmentData: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      path: string;
    }> = [];

    for (const file of files) {
      // SECURITY: Whitelist approach for file validation
      // Why whitelist instead of blacklist?
      // - Prevents Remote Code Execution (RCE) by blocking executables (.exe, .sh, .bat)
      // - Impossible to blacklist all dangerous file types (new ones emerge)
      // - Whitelist ensures only known-safe formats are accepted
      // - Validates both MIME type (prevents spoofing) and extension (prevents bypasses)

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `File type not allowed: ${file.type}. Allowed types: images, PDFs, documents.`,
          },
          { status: 400 },
        );
      }

      // Validate file extension
      const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `File extension not allowed: ${ext}` },
          { status: 400 },
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `${uuidv4()}${ext}`;
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      uploadedFiles.push(filepath); // Track for potential cleanup

      attachmentData.push({
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `/api/uploads/notes/${filename}`,
      });
    }

    // Create note with attachments in transaction
    const note = await prisma.$transaction(async (prisma) => {
      const newNote = await prisma.ticketNote.create({
        data: {
          ticketId: id,
          authorId: userId,
          content: content.trim(),
          isInternal,
          attachments: {
            create: attachmentData,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
          attachments: true,
        },
      });

      // Auto-set firstResponseAt if this is the first internal note
      const hasInternalNotes = ticket.notes && ticket.notes.length > 0;
      if (isInternal && !hasInternalNotes && !ticket.respondedAt) {
        await prisma.supportRequest.update({
          where: { id },
          data: { respondedAt: new Date() },
        });
      }

      return newNote;
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    // SECURITY: Clean up uploaded files if database transaction failed
    // Why cleanup on failure?
    // - Prevents orphaned files (disk space exhaustion attacks)
    // - Ensures filesystem matches database state (no dangling references)
    // - Tracks files BEFORE transaction to enable cleanup even if DB write fails
    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const filepath of uploadedFiles) {
        try {
          await unlink(filepath);
        } catch (unlinkErr) {
          console.error(`Failed to clean up file ${filepath}:`, unlinkErr);
        }
      }
    }

    console.error("Error creating note:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create note",
      },
      { status: 500 },
    );
  }
}
