# 📁 Document Management System

## Overview

The Document Management System allows administrators to store, organize, and manage BWB-related documents including images, PDFs, Word documents, Excel spreadsheets, text files, and Markdown files.

## Features

- **File Upload**: Support for multiple file types (images, PDFs, Word, Excel, text, Markdown)
- **Folder Management**: Create nested folder structures
- **File Operations**:
  - Upload files (with progress indicator)
  - Download files
  - Rename files and folders
  - Delete files and folders
  - Browse files in grid or list view
- **File Size Limit**: 50MB per file (configurable)
- **Admin-Only Access**: Only administrators can access the document management system

## Supported File Types

- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, TXT, MD (Markdown)
- **Microsoft Office**: DOC, DOCX, XLS, XLSX

## Storage Structure

### Development

- **Location**: `public/uploads/documents/`
- Files are stored in a hierarchical folder structure

### Production

- **Location**: `/srv/bwb/uploads/documents/`
- Persistent storage outside the application directory

## Database Schema

The `Document` model tracks all files and folders:

```prisma
model Document {
  id           String     @id @default(cuid())
  name         String
  isFolder     Boolean    @default(false)
  parentId     String?
  path         String
  filename     String?
  originalName String?
  mimeType     String?
  size         Int?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  parent       Document?  @relation("DocumentHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children     Document[] @relation("DocumentHierarchy")
}
```

## API Endpoints

### List Documents

```
GET /api/documents?parentId={folderId}
```

### Upload File

```
POST /api/documents
Body: FormData with 'file' and optional 'parentId'
```

### Create Folder

```
POST /api/documents
Body: FormData with 'folderName' and optional 'parentId'
```

### Download File

```
GET /api/documents/{id}
```

### Rename File/Folder

```
PATCH /api/documents/{id}
Body: { "name": "new-name" }
```

### Delete File/Folder

```
DELETE /api/documents/{id}
```

## Security

- All endpoints require admin authentication
- Files are stored with UUID filenames to prevent conflicts
- MIME type validation on upload
- File size validation (50MB max)
- Middleware protection ensures only admins can access

## Usage

1. Navigate to **Admin → Documents** in the sidebar
2. Use the toolbar to:
   - Toggle between grid and list view
   - Create new folders
   - Upload files
3. Double-click folders to navigate
4. Use breadcrumbs to navigate back
5. Hover over items to see action buttons (download, rename, delete)

## Future Enhancements

- [ ] Bulk operations (multi-select)
- [ ] File preview for images and PDFs
- [ ] Search functionality
- [ ] File versioning
- [ ] File sharing with specific users
- [ ] Drag-and-drop upload
- [ ] Move files between folders
