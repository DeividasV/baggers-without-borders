/**
 * Mock data for testing document components
 */

import {
  Document,
  BreadcrumbItem,
} from "@/components/features/documents/types";

export const mockFolder: Document = {
  id: "folder-1",
  name: "Test Folder",
  isFolder: true,
  parentId: null,
  path: "/",
  filename: null,
  originalName: null,
  mimeType: null,
  size: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

export const mockSubFolder: Document = {
  id: "folder-2",
  name: "Sub Folder",
  isFolder: true,
  parentId: "folder-1",
  path: "/Test Folder",
  filename: null,
  originalName: null,
  mimeType: null,
  size: null,
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

export const mockPdfFile: Document = {
  id: "file-1",
  name: "document.pdf",
  isFolder: false,
  parentId: null,
  path: "/",
  filename: "abc123.pdf",
  originalName: "document.pdf",
  mimeType: "application/pdf",
  size: 1024 * 500, // 500 KB
  createdAt: "2024-01-03T00:00:00.000Z",
  updatedAt: "2024-01-03T00:00:00.000Z",
};

export const mockImageFile: Document = {
  id: "file-2",
  name: "image.png",
  isFolder: false,
  parentId: "folder-1",
  path: "/Test Folder",
  filename: "def456.png",
  originalName: "image.png",
  mimeType: "image/png",
  size: 1024 * 200, // 200 KB
  createdAt: "2024-01-04T00:00:00.000Z",
  updatedAt: "2024-01-04T00:00:00.000Z",
};

export const mockTextFile: Document = {
  id: "file-3",
  name: "notes.txt",
  isFolder: false,
  parentId: null,
  path: "/",
  filename: "ghi789.txt",
  originalName: "notes.txt",
  mimeType: "text/plain",
  size: 2048, // 2 KB
  createdAt: "2024-01-05T00:00:00.000Z",
  updatedAt: "2024-01-05T00:00:00.000Z",
};

export const mockMarkdownFile: Document = {
  id: "file-4",
  name: "readme.md",
  isFolder: false,
  parentId: null,
  path: "/",
  filename: "jkl012.md",
  originalName: "readme.md",
  mimeType: "text/markdown",
  size: 4096, // 4 KB
  createdAt: "2024-01-06T00:00:00.000Z",
  updatedAt: "2024-01-06T00:00:00.000Z",
};

export const mockVideoFile: Document = {
  id: "file-5",
  name: "video.mp4",
  isFolder: false,
  parentId: null,
  path: "/",
  filename: "mno345.mp4",
  originalName: "video.mp4",
  mimeType: "video/mp4",
  size: 1024 * 1024 * 50, // 50 MB
  createdAt: "2024-01-07T00:00:00.000Z",
  updatedAt: "2024-01-07T00:00:00.000Z",
};

export const mockZipFile: Document = {
  id: "file-6",
  name: "archive.zip",
  isFolder: false,
  parentId: null,
  path: "/",
  filename: "pqr678.zip",
  originalName: "archive.zip",
  mimeType: "application/zip",
  size: 1024 * 1024 * 10, // 10 MB
  createdAt: "2024-01-08T00:00:00.000Z",
  updatedAt: "2024-01-08T00:00:00.000Z",
};

export const mockJavaScriptFile: Document = {
  id: "file-7",
  name: "script.js",
  isFolder: false,
  parentId: "folder-1",
  path: "/Test Folder",
  filename: "stu901.js",
  originalName: "script.js",
  mimeType: "text/javascript",
  size: 8192, // 8 KB
  createdAt: "2024-01-09T00:00:00.000Z",
  updatedAt: "2024-01-09T00:00:00.000Z",
};

export const mockJsonFile: Document = {
  id: "file-8",
  name: "data.json",
  isFolder: false,
  parentId: null,
  path: "/",
  filename: "vwx234.json",
  originalName: "data.json",
  mimeType: "application/json",
  size: 1024, // 1 KB
  createdAt: "2024-01-10T00:00:00.000Z",
  updatedAt: "2024-01-10T00:00:00.000Z",
};

export const mockParentFolder: Document = {
  id: "parent-folder",
  name: "..",
  isFolder: true,
  parentId: null,
  path: "",
  filename: null,
  originalName: null,
  mimeType: null,
  size: null,
  createdAt: "",
  updatedAt: "",
};

export const mockDocuments: Document[] = [
  mockFolder,
  mockSubFolder,
  mockPdfFile,
  mockImageFile,
  mockTextFile,
  mockMarkdownFile,
  mockVideoFile,
  mockZipFile,
  mockJavaScriptFile,
  mockJsonFile,
];

export const mockBreadcrumbs: BreadcrumbItem[] = [
  { id: null, name: "Documents" },
  { id: "folder-1", name: "Test Folder" },
];

export const mockFolderStats = {
  totalFiles: 10,
  totalFolders: 3,
  totalSize: 1024 * 1024 * 100, // 100 MB
  directFiles: 5,
  directFolders: 2,
  directSize: 1024 * 1024 * 50, // 50 MB
};

export const mockUploadProgress = {
  "file1.pdf": 50,
  "file2.png": 100,
  "file3.txt": 25,
};

// Helper to create a mock document with custom properties
export const createMockDocument = (
  overrides: Partial<Document> = {}
): Document => {
  return {
    id: "test-doc-" + Math.random(),
    name: "test-document.txt",
    isFolder: false,
    parentId: null,
    path: "/",
    filename: "test.txt",
    originalName: "test-document.txt",
    mimeType: "text/plain",
    size: 1024,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};

// Helper to create a mock folder with custom properties
export const createMockFolder = (
  overrides: Partial<Document> = {}
): Document => {
  return {
    id: "test-folder-" + Math.random(),
    name: "Test Folder",
    isFolder: true,
    parentId: null,
    path: "/",
    filename: null,
    originalName: null,
    mimeType: null,
    size: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};

// Mock fetch responses
export const mockFetchSuccess = (data: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    } as Response)
  );
};

export const mockFetchError = (error: string = "An error occurred") => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error }),
    } as Response)
  );
};

export const mockFetchReject = (error: string = "Network error") => {
  global.fetch = jest.fn(() => Promise.reject(new Error(error)));
};
