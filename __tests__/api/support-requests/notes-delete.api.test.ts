/**
 * API tests for support request note deletion
 * Tests file cleanup, permissions, and cascade deletion
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

import { getServerSession } from "next-auth";
const mockedGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe.skip("DELETE /api/support-requests/[id]/notes/[noteId]", () => {
  let adminUser: any;
  let otherAdmin: any;
  let supportRequest: any;
  let testNote: any;
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "support-requests",
  );

  beforeEach(async () => {
    // Create test users
    adminUser = await createTestUser({ role: "ADMIN" });
    otherAdmin = await createTestUser({
      role: "ADMIN",
      username: "otheradmin",
    });

    // Create test support request
    supportRequest = await createTestSupportRequest();

    // Create test note
    testNote = await prisma.ticketNote.create({
      data: {
        content: "Test note to delete",
        isInternal: true,
        supportRequestId: supportRequest.id,
        authorId: adminUser.id,
      },
    });

    // Mock authenticated session
    mockedGetServerSession.mockResolvedValue({
      user: { id: adminUser.id, role: "ADMIN" },
    } as any);

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
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
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
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toMatch(/forbidden|admin/i);
    });

    it("allows note author to delete their own note", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.message).toMatch(/deleted/i);

      // Verify note was deleted
      const deleted = await prisma.ticketNote.findUnique({
        where: { id: testNote.id },
      });
      expect(deleted).toBeNull();
    });

    it("allows other admins to delete any note", async () => {
      mockedGetServerSession.mockResolvedValueOnce({
        user: { id: otherAdmin.id, role: "ADMIN" },
      } as any);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(200);

      // Verify note was deleted
      const deleted = await prisma.ticketNote.findUnique({
        where: { id: testNote.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe("File Cleanup", () => {
    it("deletes all associated file attachments from filesystem", async () => {
      // Create test files
      const file1Path = path.join(uploadDir, "test-file-1.jpg");
      const file2Path = path.join(uploadDir, "test-file-2.pdf");
      fs.writeFileSync(file1Path, "fake image data");
      fs.writeFileSync(file2Path, "fake pdf data");

      // Create attachment records
      await prisma.ticketNoteAttachment.createMany({
        data: [
          {
            noteId: testNote.id,
            filename: "test-file-1.jpg",
            originalName: "image.jpg",
            mimeType: "image/jpeg",
            size: 100,
            path: `/uploads/support-requests/test-file-1.jpg`,
          },
          {
            noteId: testNote.id,
            filename: "test-file-2.pdf",
            originalName: "document.pdf",
            mimeType: "application/pdf",
            size: 200,
            path: `/uploads/support-requests/test-file-2.pdf`,
          },
        ],
      });

      // Verify files exist before deletion
      expect(fs.existsSync(file1Path)).toBe(true);
      expect(fs.existsSync(file2Path)).toBe(true);

      // Delete note
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(200);

      // Verify files were deleted
      expect(fs.existsSync(file1Path)).toBe(false);
      expect(fs.existsSync(file2Path)).toBe(false);
    });

    it("handles missing files gracefully during deletion", async () => {
      // Create attachment record for non-existent file
      await prisma.ticketNoteAttachment.create({
        data: {
          noteId: testNote.id,
          filename: "missing-file.jpg",
          originalName: "missing.jpg",
          mimeType: "image/jpeg",
          size: 100,
          path: `/uploads/support-requests/missing-file.jpg`,
        },
      });

      // Delete note (should not throw error for missing file)
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(200);

      // Verify note was still deleted
      const deleted = await prisma.ticketNote.findUnique({
        where: { id: testNote.id },
      });
      expect(deleted).toBeNull();
    });

    it("deletes note from database even if file deletion fails", async () => {
      // Create attachment with invalid path
      await prisma.ticketNoteAttachment.create({
        data: {
          noteId: testNote.id,
          filename: "test.jpg",
          originalName: "test.jpg",
          mimeType: "image/jpeg",
          size: 100,
          path: `/invalid/path/test.jpg`,
        },
      });

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(200);

      // Verify note was deleted from database
      const deleted = await prisma.ticketNote.findUnique({
        where: { id: testNote.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe("Cascade Deletion", () => {
    it("deletes all attachment records from database", async () => {
      // Create multiple attachments
      const attachment1 = await prisma.ticketNoteAttachment.create({
        data: {
          noteId: testNote.id,
          filename: "file1.jpg",
          originalName: "file1.jpg",
          mimeType: "image/jpeg",
          size: 100,
          path: "/uploads/file1.jpg",
        },
      });

      const attachment2 = await prisma.ticketNoteAttachment.create({
        data: {
          noteId: testNote.id,
          filename: "file2.pdf",
          originalName: "file2.pdf",
          mimeType: "application/pdf",
          size: 200,
          path: "/uploads/file2.pdf",
        },
      });

      // Delete note
      await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      // Verify attachments were deleted
      const deletedAttachment1 = await prisma.ticketNoteAttachment.findUnique({
        where: { id: attachment1.id },
      });
      const deletedAttachment2 = await prisma.ticketNoteAttachment.findUnique({
        where: { id: attachment2.id },
      });

      expect(deletedAttachment1).toBeNull();
      expect(deletedAttachment2).toBeNull();
    });

    it("does not delete notes from other tickets", async () => {
      // Create another support request with note
      const otherRequest = await createTestSupportRequest();
      const otherNote = await prisma.ticketNote.create({
        data: {
          content: "Other note",
          isInternal: true,
          supportRequestId: otherRequest.id,
          authorId: adminUser.id,
        },
      });

      // Delete first note
      await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      // Verify other note still exists
      const otherNoteExists = await prisma.ticketNote.findUnique({
        where: { id: otherNote.id },
      });
      expect(otherNoteExists).not.toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("returns 404 when note does not exist", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/nonexistent-id`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toMatch(/not found/i);
    });

    it("returns 404 when note belongs to different support request", async () => {
      const otherRequest = await createTestSupportRequest();

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${otherRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toMatch(/not found/i);
    });

    it("handles database errors gracefully", async () => {
      // Mock Prisma error
      const originalDelete = prisma.ticketNote.delete;
      prisma.ticketNote.delete = jest
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeTruthy();

      // Restore original function
      prisma.ticketNote.delete = originalDelete;
    });
  });

  describe("Transaction Integrity", () => {
    it("collects file paths BEFORE deleting database records", async () => {
      // Create attachment
      const filePath = path.join(uploadDir, "test-file.jpg");
      fs.writeFileSync(filePath, "test data");

      await prisma.ticketNoteAttachment.create({
        data: {
          noteId: testNote.id,
          filename: "test-file.jpg",
          originalName: "test.jpg",
          mimeType: "image/jpeg",
          size: 100,
          path: `/uploads/support-requests/test-file.jpg`,
        },
      });

      // Delete note
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(200);

      // Verify both database AND filesystem cleanup
      const deletedNote = await prisma.ticketNote.findUnique({
        where: { id: testNote.id },
      });
      expect(deletedNote).toBeNull();
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });

  describe("Response Format", () => {
    it("returns success message on deletion", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("message");
      expect(data.data.message).toMatch(/deleted/i);
    });

    it("includes deleted note ID in response", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();
      expect(data.data.id).toBe(testNote.id);
    });
  });

  describe("Edge Cases", () => {
    it("handles note with no attachments", async () => {
      // testNote has no attachments by default
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(200);

      const deleted = await prisma.ticketNote.findUnique({
        where: { id: testNote.id },
      });
      expect(deleted).toBeNull();
    });

    it("handles note with many attachments (10+)", async () => {
      // Create 10 attachment records
      const attachments = [];
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(uploadDir, `file-${i}.jpg`);
        fs.writeFileSync(filePath, `data ${i}`);

        attachments.push({
          noteId: testNote.id,
          filename: `file-${i}.jpg`,
          originalName: `file-${i}.jpg`,
          mimeType: "image/jpeg",
          size: 100,
          path: `/uploads/support-requests/file-${i}.jpg`,
        });
      }

      await prisma.ticketNoteAttachment.createMany({ data: attachments });

      // Delete note
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(200);

      // Verify all files deleted
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(uploadDir, `file-${i}.jpg`);
        expect(fs.existsSync(filePath)).toBe(false);
      }
    });

    it("handles concurrent deletion attempts", async () => {
      // Attempt two simultaneous deletes
      const promise1 = fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        { method: "DELETE" },
      );

      const promise2 = fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        { method: "DELETE" },
      );

      const [response1, response2] = await Promise.all([promise1, promise2]);

      // One should succeed, one should fail with 404
      const statuses = [response1.status, response2.status].sort();
      expect(statuses).toEqual([200, 404]);
    });
  });
});
