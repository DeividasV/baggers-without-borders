/**
 * Integration Test: Document Management Workflows
 *
 * Tests complete document management scenarios including:
 * - Folder creation and hierarchy
 * - File upload and metadata tracking
 * - Document search and retrieval
 * - File and folder deletion
 */

import { getTestDb, cleanTestDb } from "../utils/test-db-setup";

describe("Integration: Document Management", () => {
  let db: ReturnType<typeof getTestDb>;

  beforeAll(async () => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
  });

  describe("Folder Management", () => {
    it("should create root-level folder", async () => {
      const folder = await db.document.create({
        data: {
          name: "Reports",
          isFolder: true,
          path: "/Reports/",
        },
      });

      expect(folder.id).toBeDefined();
      expect(folder.name).toBe("Reports");
      expect(folder.isFolder).toBe(true);
      expect(folder.path).toBe("/Reports/");
      expect(folder.parentId).toBeNull();
    });

    it("should create nested folder hierarchy", async () => {
      const rootFolder = await db.document.create({
        data: {
          name: "Documents",
          isFolder: true,
          path: "/Documents/",
        },
      });

      const subFolder = await db.document.create({
        data: {
          name: "2024",
          isFolder: true,
          parentId: rootFolder.id,
          path: "/Documents/2024/",
        },
      });

      const subSubFolder = await db.document.create({
        data: {
          name: "January",
          isFolder: true,
          parentId: subFolder.id,
          path: "/Documents/2024/January/",
        },
      });

      expect(subFolder.parentId).toBe(rootFolder.id);
      expect(subSubFolder.parentId).toBe(subFolder.id);
      expect(subSubFolder.path).toBe("/Documents/2024/January/");
    });

    it("should list folders in parent directory", async () => {
      const rootFolder = await db.document.create({
        data: {
          name: "Root",
          isFolder: true,
          path: "/Root/",
        },
      });

      await db.document.createMany({
        data: [
          {
            name: "Folder1",
            isFolder: true,
            parentId: rootFolder.id,
            path: "/Root/Folder1/",
          },
          {
            name: "Folder2",
            isFolder: true,
            parentId: rootFolder.id,
            path: "/Root/Folder2/",
          },
          {
            name: "Folder3",
            isFolder: true,
            parentId: rootFolder.id,
            path: "/Root/Folder3/",
          },
        ],
      });

      const subFolders = await db.document.findMany({
        where: {
          parentId: rootFolder.id,
          isFolder: true,
        },
        orderBy: { name: "asc" },
      });

      expect(subFolders).toHaveLength(3);
      expect(subFolders.map((f) => f.name)).toEqual([
        "Folder1",
        "Folder2",
        "Folder3",
      ]);
    });

    it("should rename folder", async () => {
      const folder = await db.document.create({
        data: {
          name: "OldName",
          isFolder: true,
          path: "/OldName/",
        },
      });

      const updated = await db.document.update({
        where: { id: folder.id },
        data: {
          name: "NewName",
          path: "/NewName/",
        },
      });

      expect(updated.name).toBe("NewName");
      expect(updated.path).toBe("/NewName/");
    });

    it("should delete empty folder", async () => {
      const folder = await db.document.create({
        data: {
          name: "EmptyFolder",
          isFolder: true,
          path: "/EmptyFolder/",
        },
      });

      await db.document.delete({ where: { id: folder.id } });

      const found = await db.document.findUnique({
        where: { id: folder.id },
      });

      expect(found).toBeNull();
    });

    it("should cascade delete folder contents", async () => {
      const parentFolder = await db.document.create({
        data: {
          name: "Parent",
          isFolder: true,
          path: "/Parent/",
        },
      });

      const childFolder = await db.document.create({
        data: {
          name: "Child",
          isFolder: true,
          parentId: parentFolder.id,
          path: "/Parent/Child/",
        },
      });

      const file = await db.document.create({
        data: {
          name: "test.pdf",
          isFolder: false,
          parentId: childFolder.id,
          path: "/Parent/Child/test.pdf",
          filename: "test123.pdf",
          originalName: "test.pdf",
          mimeType: "application/pdf",
          size: 1024,
        },
      });

      // Delete parent folder
      await db.document.delete({ where: { id: parentFolder.id } });

      // Verify cascade deletion
      const childExists = await db.document.findUnique({
        where: { id: childFolder.id },
      });
      const fileExists = await db.document.findUnique({
        where: { id: file.id },
      });

      expect(childExists).toBeNull();
      expect(fileExists).toBeNull();
    });
  });

  describe("File Management", () => {
    it("should create file with metadata", async () => {
      const file = await db.document.create({
        data: {
          name: "report.pdf",
          isFolder: false,
          path: "/report.pdf",
          filename: "abc123-report.pdf",
          originalName: "report.pdf",
          mimeType: "application/pdf",
          size: 2048,
        },
      });

      expect(file.id).toBeDefined();
      expect(file.name).toBe("report.pdf");
      expect(file.isFolder).toBe(false);
      expect(file.filename).toBe("abc123-report.pdf");
      expect(file.mimeType).toBe("application/pdf");
      expect(file.size).toBe(2048);
    });

    it("should store file in folder", async () => {
      const folder = await db.document.create({
        data: {
          name: "Uploads",
          isFolder: true,
          path: "/Uploads/",
        },
      });

      const file = await db.document.create({
        data: {
          name: "image.jpg",
          isFolder: false,
          parentId: folder.id,
          path: "/Uploads/image.jpg",
          filename: "xyz789-image.jpg",
          originalName: "image.jpg",
          mimeType: "image/jpeg",
          size: 5120,
        },
      });

      expect(file.parentId).toBe(folder.id);
      expect(file.path).toContain("/Uploads/");
    });

    it("should list files in folder", async () => {
      const folder = await db.document.create({
        data: {
          name: "Documents",
          isFolder: true,
          path: "/Documents/",
        },
      });

      await db.document.createMany({
        data: [
          {
            name: "file1.pdf",
            isFolder: false,
            parentId: folder.id,
            path: "/Documents/file1.pdf",
            filename: "file1.pdf",
            originalName: "file1.pdf",
            mimeType: "application/pdf",
            size: 1024,
          },
          {
            name: "file2.docx",
            isFolder: false,
            parentId: folder.id,
            path: "/Documents/file2.docx",
            filename: "file2.docx",
            originalName: "file2.docx",
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size: 2048,
          },
        ],
      });

      const files = await db.document.findMany({
        where: {
          parentId: folder.id,
          isFolder: false,
        },
        orderBy: { name: "asc" },
      });

      expect(files).toHaveLength(2);
      expect(files[0].name).toBe("file1.pdf");
      expect(files[1].name).toBe("file2.docx");
    });

    it("should update file metadata", async () => {
      const file = await db.document.create({
        data: {
          name: "old-name.pdf",
          isFolder: false,
          path: "/old-name.pdf",
          filename: "uuid123.pdf",
          originalName: "old-name.pdf",
          mimeType: "application/pdf",
          size: 1024,
        },
      });

      const updated = await db.document.update({
        where: { id: file.id },
        data: {
          name: "new-name.pdf",
          originalName: "new-name.pdf",
        },
      });

      expect(updated.name).toBe("new-name.pdf");
      expect(updated.originalName).toBe("new-name.pdf");
      expect(updated.filename).toBe("uuid123.pdf"); // Filename unchanged
    });

    it("should delete file", async () => {
      const file = await db.document.create({
        data: {
          name: "temp.txt",
          isFolder: false,
          path: "/temp.txt",
          filename: "temp123.txt",
          originalName: "temp.txt",
          mimeType: "text/plain",
          size: 512,
        },
      });

      await db.document.delete({ where: { id: file.id } });

      const found = await db.document.findUnique({
        where: { id: file.id },
      });

      expect(found).toBeNull();
    });

    it("should track multiple file versions with different filenames", async () => {
      const folder = await db.document.create({
        data: {
          name: "Versions",
          isFolder: true,
          path: "/Versions/",
        },
      });

      // Simulate versioning by storing files with same original name
      const v1 = await db.document.create({
        data: {
          name: "document.pdf",
          isFolder: false,
          parentId: folder.id,
          path: "/Versions/document.pdf",
          filename: "uuid-v1.pdf",
          originalName: "document.pdf",
          mimeType: "application/pdf",
          size: 1024,
        },
      });

      const v2 = await db.document.create({
        data: {
          name: "document.pdf",
          isFolder: false,
          parentId: folder.id,
          path: "/Versions/document-v2.pdf",
          filename: "uuid-v2.pdf",
          originalName: "document.pdf",
          mimeType: "application/pdf",
          size: 2048,
        },
      });

      const versions = await db.document.findMany({
        where: {
          parentId: folder.id,
          originalName: "document.pdf",
        },
        orderBy: { createdAt: "asc" },
      });

      expect(versions).toHaveLength(2);
      expect(versions[0].filename).toBe("uuid-v1.pdf");
      expect(versions[1].filename).toBe("uuid-v2.pdf");
    });
  });

  describe("Document Search and Filtering", () => {
    beforeEach(async () => {
      const folder1 = await db.document.create({
        data: { name: "Reports", isFolder: true, path: "/Reports/" },
      });

      const folder2 = await db.document.create({
        data: { name: "Images", isFolder: true, path: "/Images/" },
      });

      await db.document.createMany({
        data: [
          {
            name: "annual-report-2024.pdf",
            isFolder: false,
            parentId: folder1.id,
            path: "/Reports/annual-report-2024.pdf",
            filename: "annual-report-2024.pdf",
            originalName: "annual-report-2024.pdf",
            mimeType: "application/pdf",
            size: 10240,
          },
          {
            name: "quarterly-report-q1.pdf",
            isFolder: false,
            parentId: folder1.id,
            path: "/Reports/quarterly-report-q1.pdf",
            filename: "quarterly-report-q1.pdf",
            originalName: "quarterly-report-q1.pdf",
            mimeType: "application/pdf",
            size: 5120,
          },
          {
            name: "logo.png",
            isFolder: false,
            parentId: folder2.id,
            path: "/Images/logo.png",
            filename: "logo.png",
            originalName: "logo.png",
            mimeType: "image/png",
            size: 2048,
          },
        ],
      });
    });

    it("should search documents by name (case-insensitive)", async () => {
      const allDocs = await db.document.findMany();
      const searchTerm = "report";

      const results = allDocs.filter((doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(
        results.every((r) => r.name.toLowerCase().includes("report"))
      ).toBe(true);
    });

    it("should filter files by MIME type", async () => {
      const pdfFiles = await db.document.findMany({
        where: {
          mimeType: "application/pdf",
          isFolder: false,
        },
      });

      expect(pdfFiles).toHaveLength(2);
      expect(pdfFiles.every((f) => f.mimeType === "application/pdf")).toBe(
        true
      );
    });

    it("should filter by file size range", async () => {
      const largeFiles = await db.document.findMany({
        where: {
          isFolder: false,
          size: { gte: 5000 },
        },
      });

      expect(largeFiles.length).toBeGreaterThanOrEqual(2);
      expect(largeFiles.every((f) => f.size !== null && f.size >= 5000)).toBe(
        true
      );
    });

    it("should list only folders", async () => {
      const folders = await db.document.findMany({
        where: { isFolder: true },
        orderBy: { name: "asc" },
      });

      expect(folders).toHaveLength(2);
      expect(folders.every((f) => f.isFolder === true)).toBe(true);
    });

    it("should list only files", async () => {
      const files = await db.document.findMany({
        where: { isFolder: false },
      });

      expect(files).toHaveLength(3);
      expect(files.every((f) => f.isFolder === false)).toBe(true);
    });

    it("should get documents at root level only", async () => {
      await db.document.create({
        data: {
          name: "root-file.txt",
          isFolder: false,
          path: "/root-file.txt",
          filename: "root-file.txt",
          originalName: "root-file.txt",
          mimeType: "text/plain",
          size: 100,
        },
      });

      const rootDocs = await db.document.findMany({
        where: { parentId: null },
      });

      expect(rootDocs.length).toBeGreaterThanOrEqual(3); // 2 folders + 1 file
      expect(rootDocs.every((d) => d.parentId === null)).toBe(true);
    });
  });

  describe("Document Statistics and Aggregation", () => {
    beforeEach(async () => {
      const folder = await db.document.create({
        data: { name: "Storage", isFolder: true, path: "/Storage/" },
      });

      await db.document.createMany({
        data: [
          {
            name: "file1.pdf",
            isFolder: false,
            parentId: folder.id,
            path: "/Storage/file1.pdf",
            filename: "file1.pdf",
            originalName: "file1.pdf",
            mimeType: "application/pdf",
            size: 10000,
          },
          {
            name: "file2.jpg",
            isFolder: false,
            parentId: folder.id,
            path: "/Storage/file2.jpg",
            filename: "file2.jpg",
            originalName: "file2.jpg",
            mimeType: "image/jpeg",
            size: 20000,
          },
          {
            name: "file3.png",
            isFolder: false,
            parentId: folder.id,
            path: "/Storage/file3.png",
            filename: "file3.png",
            originalName: "file3.png",
            mimeType: "image/png",
            size: 15000,
          },
        ],
      });
    });

    it("should count total files", async () => {
      const fileCount = await db.document.count({
        where: { isFolder: false },
      });

      expect(fileCount).toBe(3);
    });

    it("should count total folders", async () => {
      const folderCount = await db.document.count({
        where: { isFolder: true },
      });

      expect(folderCount).toBeGreaterThanOrEqual(1);
    });

    it("should calculate total storage used", async () => {
      const files = await db.document.findMany({
        where: { isFolder: false },
        select: { size: true },
      });

      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

      expect(totalSize).toBe(45000); // 10000 + 20000 + 15000
    });

    it("should group files by MIME type", async () => {
      const files = await db.document.findMany({
        where: { isFolder: false },
      });

      const grouped = files.reduce((acc, file) => {
        const mimeType = file.mimeType || "unknown";
        if (!acc[mimeType]) {
          acc[mimeType] = 0;
        }
        acc[mimeType]++;
        return acc;
      }, {} as Record<string, number>);

      expect(grouped["application/pdf"]).toBe(1);
      expect(grouped["image/jpeg"]).toBe(1);
      expect(grouped["image/png"]).toBe(1);
    });
  });

  describe("Path and Hierarchy Validation", () => {
    it("should maintain correct path structure for nested items", async () => {
      const root = await db.document.create({
        data: { name: "Root", isFolder: true, path: "/Root/" },
      });

      const sub1 = await db.document.create({
        data: {
          name: "Sub1",
          isFolder: true,
          parentId: root.id,
          path: "/Root/Sub1/",
        },
      });

      const sub2 = await db.document.create({
        data: {
          name: "Sub2",
          isFolder: true,
          parentId: sub1.id,
          path: "/Root/Sub1/Sub2/",
        },
      });

      const file = await db.document.create({
        data: {
          name: "file.txt",
          isFolder: false,
          parentId: sub2.id,
          path: "/Root/Sub1/Sub2/file.txt",
          filename: "file.txt",
          originalName: "file.txt",
          mimeType: "text/plain",
          size: 100,
        },
      });

      expect(file.path).toBe("/Root/Sub1/Sub2/file.txt");
      expect(file.path.startsWith(root.path)).toBe(true);
      expect(file.path.startsWith(sub1.path)).toBe(true);
      expect(file.path.startsWith(sub2.path)).toBe(true);
    });

    it("should retrieve full folder path hierarchy", async () => {
      const root = await db.document.create({
        data: { name: "Root", isFolder: true, path: "/Root/" },
      });

      const sub1 = await db.document.create({
        data: {
          name: "Sub1",
          isFolder: true,
          parentId: root.id,
          path: "/Root/Sub1/",
        },
      });

      const sub2 = await db.document.create({
        data: {
          name: "Sub2",
          isFolder: true,
          parentId: sub1.id,
          path: "/Root/Sub1/Sub2/",
        },
      });

      // Build path from leaf to root
      let currentPath = sub2;
      const pathParts = [currentPath.name];

      while (currentPath.parentId) {
        currentPath = (await db.document.findUnique({
          where: { id: currentPath.parentId },
        })) as any;
        pathParts.unshift(currentPath.name);
      }

      expect(pathParts).toEqual(["Root", "Sub1", "Sub2"]);
    });
  });
});
