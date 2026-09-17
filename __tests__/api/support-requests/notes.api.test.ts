/**
 * API tests for support request notes creation
 * Tests file upload security, validation, and rate limiting
 */

import { prisma } from "@/src/lib/prisma";
import {
  createTestUser,
  createTestSupportRequest,
} from "@/__tests__/utils/test-data-factory";
import fs from "fs";
import path from "path";

// Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock rate limiting
jest.mock("@/src/lib/rateLimit", () => ({
  checkRateLimit: jest.fn(),
}));

import { getServerSession } from "next-auth";
import { checkRateLimit } from "@/src/lib/rateLimit";

const mockedGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockedCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;

describe.skip("POST /api/support-requests/[id]/notes", () => {
  let adminUser: any;
  let supportRequest: any;
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "support-requests",
  );

  beforeEach(async () => {
    // Create test admin user
    adminUser = await createTestUser({ role: "ADMIN" });

    // Create test support request
    supportRequest = await createTestSupportRequest();

    // Mock authenticated session
    mockedGetServerSession.mockResolvedValue({
      user: { id: adminUser.id, role: "ADMIN" },
    } as any);

    // Mock rate limit as allowed
    mockedCheckRateLimit.mockResolvedValue({ allowed: true });

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.ticketNoteAttachment.deleteMany();
    await prisma.ticketNote.deleteMany();
    await prisma.supportRequest.deleteMany();
    await prisma.user.deleteMany();

    // Clean up uploaded files
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(uploadDir, file));
      });
    }

    jest.clearAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockedGetServerSession.mockResolvedValueOnce(null);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Test note" }),
        },
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toMatch(/unauthorized/i);
    });

    it("returns 403 when user is not an admin", async () => {
      const regularUser = await createTestUser({ role: "USER" });
      mockedGetServerSession.mockResolvedValueOnce({
        user: { id: regularUser.id, role: "USER" },
      } as any);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Test note" }),
        },
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toMatch(/forbidden|admin/i);
    });
  });

  describe("Content Validation", () => {
    it("returns 400 when content is missing", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "" }),
        },
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/content.*required/i);
    });

    it("returns 400 when content exceeds 9999 characters", async () => {
      const longContent = "a".repeat(10000);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: longContent }),
        },
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/exceeds.*9999.*character/i);
    });

    it("creates note with valid content", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "This is a valid test note",
            isInternal: true,
          }),
        },
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.data).toHaveProperty("id");
      expect(data.data.content).toBe("This is a valid test note");
      expect(data.data.isInternal).toBe(true);
    });
  });

  describe("File Upload Security", () => {
    it("rejects executable file extensions (.exe)", async () => {
      const formData = new FormData();
      formData.append("content", "Test note");
      const maliciousFile = new File(["malicious content"], "virus.exe", {
        type: "application/octet-stream",
      });
      formData.append("files", maliciousFile);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          body: formData,
        },
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/file type.*not allowed/i);
    });

    it("rejects shell script files (.sh, .bat)", async () => {
      const formData = new FormData();
      formData.append("content", "Test note");
      const shellScript = new File(["#!/bin/bash\nrm -rf /"], "evil.sh", {
        type: "text/plain",
      });
      formData.append("files", shellScript);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          body: formData,
        },
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/file type.*not allowed/i);
    });

    it("rejects files exceeding 5MB per-file limit", async () => {
      const formData = new FormData();
      formData.append("content", "Test note");

      // Create a 6MB file
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, "a");
      const largeFile = new File([largeBuffer], "large.jpg", {
        type: "image/jpeg",
      });
      formData.append("files", largeFile);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          body: formData,
        },
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/exceeds.*5MB.*limit/i);
    });

    it("rejects total upload exceeding 25MB limit", async () => {
      const formData = new FormData();
      formData.append("content", "Test note");

      // Create 6 files × 5MB = 30MB total
      for (let i = 0; i < 6; i++) {
        const buffer = Buffer.alloc(5 * 1024 * 1024, "a");
        const file = new File([buffer], `file${i}.jpg`, { type: "image/jpeg" });
        formData.append("files", file);
      }

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          body: formData,
        },
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/total.*exceeds.*25MB/i);
    });

    it("accepts valid image files", async () => {
      const formData = new FormData();
      formData.append("content", "Test note with image");

      const imageBuffer = Buffer.from("fake image data");
      const imageFile = new File([imageBuffer], "test-image.jpg", {
        type: "image/jpeg",
      });
      formData.append("files", imageFile);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          body: formData,
        },
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.data.attachments).toHaveLength(1);
      expect(data.data.attachments[0].originalName).toBe("test-image.jpg");
      expect(data.data.attachments[0].mimeType).toBe("image/jpeg");
    });

    it("accepts valid PDF files", async () => {
      const formData = new FormData();
      formData.append("content", "Test note with PDF");

      const pdfBuffer = Buffer.from("%PDF-1.4 fake pdf");
      const pdfFile = new File([pdfBuffer], "document.pdf", {
        type: "application/pdf",
      });
      formData.append("files", pdfFile);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          body: formData,
        },
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.data.attachments).toHaveLength(1);
      expect(data.data.attachments[0].originalName).toBe("document.pdf");
    });
  });

  describe("Rate Limiting", () => {
    it("enforces rate limit after 20 notes", async () => {
      mockedCheckRateLimit.mockResolvedValueOnce({ allowed: false });

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Test note" }),
        },
      );

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toMatch(/rate limit/i);
    });

    it("calls checkRateLimit with correct parameters", async () => {
      await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Test note" }),
        },
      );

      expect(mockedCheckRateLimit).toHaveBeenCalledWith(
        adminUser.id,
        "note-creation",
      );
    });
  });

  describe("File Cleanup on Transaction Failure", () => {
    it("cleans up uploaded files when database save fails", async () => {
      // Mock Prisma error after file upload
      const originalCreate = prisma.ticketNote.create;
      prisma.ticketNote.create = jest
        .fn()
        .mockRejectedValueOnce(new Error("Database connection failed"));

      const formData = new FormData();
      formData.append("content", "Test note");
      const file = new File([Buffer.from("test data")], "test.jpg", {
        type: "image/jpeg",
      });
      formData.append("files", file);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          body: formData,
        },
      );

      expect(response.status).toBe(500);

      // Verify no orphaned files remain
      const uploadedFiles = fs.readdirSync(uploadDir);
      expect(uploadedFiles).toHaveLength(0);

      // Restore original function
      prisma.ticketNote.create = originalCreate;
    });
  });

  describe("Response Format", () => {
    it("returns correct structure with note data", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "Test note",
            isInternal: false,
          }),
        },
      );

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("data");
      expect(data.data).toMatchObject({
        id: expect.any(String),
        content: "Test note",
        isInternal: false,
        isEdited: false,
        supportRequestId: supportRequest.id,
        authorId: adminUser.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("includes author information in response", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Test note" }),
        },
      );

      const data = await response.json();
      expect(data.data.author).toMatchObject({
        id: adminUser.id,
        displayName: expect.any(String),
        username: expect.any(String),
      });
    });
  });
});
