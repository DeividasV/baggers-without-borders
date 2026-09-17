/**
 * API tests for support request note editing
 * Tests edit window enforcement, permissions, and content validation
 */

import { prisma } from "@/src/lib/prisma";
import {
  createTestUser,
  createTestSupportRequest,
} from "@/__tests__/utils/test-data-factory";
import { EDIT_WINDOW_MS } from "@/src/lib/helpdesk-constants";

// Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from "next-auth";
const mockedGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe.skip("PUT /api/support-requests/[id]/notes/[noteId]", () => {
  let adminUser: any;
  let otherAdmin: any;
  let supportRequest: any;
  let testNote: any;

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
        content: "Original content",
        isInternal: true,
        supportRequestId: supportRequest.id,
        authorId: adminUser.id,
      },
    });

    // Mock authenticated session
    mockedGetServerSession.mockResolvedValue({
      user: { id: adminUser.id, role: "ADMIN" },
    } as any);
  });

  afterEach(async () => {
    await prisma.ticketNoteAttachment.deleteMany();
    await prisma.ticketNote.deleteMany();
    await prisma.supportRequest.deleteMany();
    await prisma.user.deleteMany();
    jest.clearAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockedGetServerSession.mockResolvedValueOnce(null);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Updated content" }),
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
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Updated content" }),
        },
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toMatch(/forbidden|admin/i);
    });

    it("allows note author to edit their own note", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Updated by author" }),
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.content).toBe("Updated by author");
    });

    it("allows other admins to edit any note", async () => {
      mockedGetServerSession.mockResolvedValueOnce({
        user: { id: otherAdmin.id, role: "ADMIN" },
      } as any);

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Updated by other admin" }),
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.content).toBe("Updated by other admin");
    });
  });

  describe("Edit Window Enforcement", () => {
    it("allows edit within 5-minute window", async () => {
      // Note was just created in beforeEach
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Quick edit within window" }),
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.content).toBe("Quick edit within window");
      expect(data.data.isEdited).toBe(true);
      expect(data.data.lastEditedAt).toBeTruthy();
    });

    it("blocks edit after 5-minute window", async () => {
      // Update note to be older than 5 minutes
      const oldDate = new Date(Date.now() - EDIT_WINDOW_MS - 1000); // 5 minutes + 1 second ago
      await prisma.ticketNote.update({
        where: { id: testNote.id },
        data: { createdAt: oldDate },
      });

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Late edit attempt" }),
        },
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toMatch(/edit window expired/i);
    });

    it("calculates remaining edit time correctly", async () => {
      // Note created 2 minutes ago
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      await prisma.ticketNote.update({
        where: { id: testNote.id },
        data: { createdAt: twoMinutesAgo },
      });

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Edit with 3 minutes left" }),
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.content).toBe("Edit with 3 minutes left");
    });

    it("blocks edit exactly at 5-minute mark", async () => {
      const exactlyFiveMinutesAgo = new Date(Date.now() - EDIT_WINDOW_MS);
      await prisma.ticketNote.update({
        where: { id: testNote.id },
        data: { createdAt: exactlyFiveMinutesAgo },
      });

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Edit at exact boundary" }),
        },
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toMatch(/edit window expired/i);
    });
  });

  describe("Content Validation", () => {
    it("returns 400 when content is missing", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
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
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: longContent }),
        },
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/exceeds.*9999.*character/i);
    });

    it("updates note with valid content", async () => {
      const newContent = "This is updated valid content";

      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent }),
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.content).toBe(newContent);
      expect(data.data.isEdited).toBe(true);
      expect(data.data.lastEditedAt).toBeTruthy();
    });
  });

  describe("Edit Metadata", () => {
    it("sets isEdited flag to true on first edit", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "First edit" }),
        },
      );

      const data = await response.json();
      expect(data.data.isEdited).toBe(true);
      expect(data.data.lastEditedAt).toBeTruthy();
    });

    it("updates lastEditedAt timestamp on each edit", async () => {
      // First edit
      await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "First edit" }),
        },
      );

      const firstEdit = await prisma.ticketNote.findUnique({
        where: { id: testNote.id },
      });

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Second edit
      await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Second edit" }),
        },
      );

      const secondEdit = await prisma.ticketNote.findUnique({
        where: { id: testNote.id },
      });

      expect(new Date(secondEdit!.lastEditedAt!).getTime()).toBeGreaterThan(
        new Date(firstEdit!.lastEditedAt!).getTime(),
      );
    });

    it("does not modify createdAt timestamp on edit", async () => {
      const originalCreatedAt = testNote.createdAt;

      await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Edited content" }),
        },
      );

      const updated = await prisma.ticketNote.findUnique({
        where: { id: testNote.id },
      });

      expect(updated!.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe("Error Handling", () => {
    it("returns 404 when note does not exist", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/nonexistent-id`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Update nonexistent" }),
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
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Update wrong request" }),
        },
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toMatch(/not found/i);
    });
  });

  describe("Response Format", () => {
    it("returns updated note with correct structure", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Updated content" }),
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("data");
      expect(data.data).toMatchObject({
        id: testNote.id,
        content: "Updated content",
        isEdited: true,
        lastEditedAt: expect.any(String),
        supportRequestId: supportRequest.id,
        authorId: adminUser.id,
      });
    });

    it("includes author information in response", async () => {
      const response = await fetch(
        `http://localhost:3000/api/support-requests/${supportRequest.id}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Updated content" }),
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
