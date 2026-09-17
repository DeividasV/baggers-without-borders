"use client";

import { useState, useEffect } from "react";
import { SITE_NAME } from "@/src/config/site";
import { Loader2, Folder } from "lucide-react";
import FileManagerStats from "./FileManagerStats";
import FileManagerBreadcrumbs from "./FileManagerBreadcrumbs";
import FileManagerToolbar from "./FileManagerToolbar";
import FileManagerGrid from "./FileManagerGrid";
import FileManagerList from "./FileManagerList";
import FileManagerMobileView from "./FileManagerMobileView";
import FileManagerModals from "./FileManagerModals";
import UploadProgress from "./UploadProgress";
import CopyMoveModal from "./CopyMoveModal";
import FileDetailsModal from "./FileDetailsModal";
import MarkdownEditor from "./MarkdownEditor";
import type { Document, BreadcrumbItem, ViewMode, SortBy, SortDirection } from "./types";
import { canPreview, isMarkdown } from "./utils";

export default function DocumentsManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: "Documents" },
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Modals
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCopyMoveModal, setShowCopyMoveModal] = useState(false);
  const [copyMoveMode, setCopyMoveMode] = useState<"copy" | "move">("copy");
  const [copyMoveTarget, setCopyMoveTarget] = useState<Document | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<Document | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [renameName, setRenameName] = useState("");
  const [detailsDocument, setDetailsDocument] = useState<Document | null>(null);
  const [markdownDocument, setMarkdownDocument] = useState<Document | null>(null);
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);
  const [isNewMarkdown, setIsNewMarkdown] = useState(false);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<Document | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Fetch documents when folder changes or after search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentFolder, searchQuery]);

  // ESC key handler to close modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showPreviewModal) {
          setShowPreviewModal(false);
          setPreviewDocument(null);
          setPreviewContent("");
        } else if (showCopyMoveModal) {
          setShowCopyMoveModal(false);
          setCopyMoveTarget(null);
        } else if (showDeleteModal) {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        } else if (detailsDocument) {
          setDetailsDocument(null);
        } else if (showMarkdownEditor) {
          setShowMarkdownEditor(false);
          setMarkdownDocument(null);
        } else if (showRenameModal) {
          setShowRenameModal(false);
          setRenameTarget(null);
          setRenameName("");
        } else if (showNewFolderModal) {
          setShowNewFolderModal(false);
          setNewFolderName("");
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [
    showPreviewModal,
    showCopyMoveModal,
    showDeleteModal,
    showRenameModal,
    showNewFolderModal,
    detailsDocument,
    showMarkdownEditor,
  ]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      } else if (currentFolder) {
        params.set("parentId", currentFolder);
      }

      const response = await fetch(`/api/documents?${params}`);
      if (response.ok) {
        const data = await response.json();

        // Add parent folder item if we're in a subfolder and not searching
        if (currentFolder && !searchQuery.trim()) {
          const parentFolderItem: Document = {
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
          setDocuments([parentFolderItem, ...data]);
        } else {
          setDocuments(data);
        }
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      alert("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        const formData = new FormData();
        formData.append("file", file);
        if (currentFolder) {
          formData.append("parentId", currentFolder);
        }

        const response = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        } else {
          const error = await response.json();
          alert(`Failed to upload ${file.name}: ${error.error}`);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    setUploadProgress({});
    fetchDocuments();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const formData = new FormData();
      formData.append("folderName", newFolderName);
      if (currentFolder) {
        formData.append("parentId", currentFolder);
      }

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setShowNewFolderModal(false);
        setNewFolderName("");
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Failed to create folder: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder");
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;

    try {
      const response = await fetch(`/api/documents/${renameTarget.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: renameName }),
      });

      if (response.ok) {
        setShowRenameModal(false);
        setRenameTarget(null);
        setRenameName("");
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Failed to rename: ${error.error}`);
      }
    } catch (error) {
      console.error("Error renaming:", error);
      alert("Failed to rename");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch(`/api/documents/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete");
    }
  };

  const handleDownload = async (document: Document) => {
    if (document.isFolder) return;

    try {
      const response = await fetch(`/api/documents/${document.id}?download=true`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = document.originalName || document.name;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        alert("Failed to download file");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  const handleMove = async (documentId: string, newParentId: string | null) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parentId: newParentId }),
      });

      if (response.ok) {
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Failed to move: ${error.error}`);
      }
    } catch (error) {
      console.error("Error moving document:", error);
      alert("Failed to move document");
    }
  };

  const handleDragStart = (e: React.DragEvent, document: Document) => {
    setDraggedItem(document);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetFolder: Document | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (targetFolder?.isFolder) {
      setDropTarget(targetFolder.id);
    } else if (targetFolder === null) {
      setDropTarget("current");
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolder: Document | null) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedItem) return;

    if (targetFolder && draggedItem.id === targetFolder.id) {
      return;
    }

    const newParentId = targetFolder?.id || currentFolder;

    if (draggedItem.parentId === newParentId) {
      setDraggedItem(null);
      return;
    }

    await handleMove(draggedItem.id, newParentId);
    setDraggedItem(null);
  };

  const handlePreview = async (document: Document) => {
    if (document.isFolder) return;

    // Open markdown files in editor instead of preview
    if (isMarkdown(document)) {
      setMarkdownDocument(document);
      setIsNewMarkdown(false);
      setShowMarkdownEditor(true);
      return;
    }

    setPreviewDocument(document);
    setShowPreviewModal(true);

    const textTypes = [
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/json",
      "text/html",
      "text/css",
      "text/javascript",
      "application/xml",
    ];

    if (document.mimeType && textTypes.includes(document.mimeType)) {
      try {
        const response = await fetch(`/api/documents/${document.id}`);
        if (response.ok) {
          const text = await response.text();
          setPreviewContent(text);
        }
      } catch (error) {
        console.error("Error fetching preview:", error);
      }
    }
  };

  const handleOpenFolder = (folder: Document) => {
    setCurrentFolder(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const item = breadcrumbs[index];
    setCurrentFolder(item.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const handleOpenRename = (doc: Document) => {
    setRenameTarget(doc);
    setRenameName(doc.name);
    setShowRenameModal(true);
  };

  const handleOpenCopy = (doc: Document) => {
    setCopyMoveTarget(doc);
    setCopyMoveMode("copy");
    setShowCopyMoveModal(true);
    setShowRenameModal(false);
  };

  const handleOpenMove = (doc: Document) => {
    setCopyMoveTarget(doc);
    setCopyMoveMode("move");
    setShowCopyMoveModal(true);
    setShowRenameModal(false);
  };

  const handleOpenDelete = (doc: Document) => {
    setDeleteTarget(doc);
    setShowDeleteModal(true);
  };

  const handleOpenDetails = (doc: Document) => {
    setDetailsDocument(doc);
  };

  const handleNewMarkdown = () => {
    setMarkdownDocument(null);
    setIsNewMarkdown(true);
    setShowMarkdownEditor(true);
  };

  const handleSaveMarkdown = async (fileName: string, content: string) => {
    try {
      // Create a blob from the content
      const blob = new Blob([content], { type: "text/markdown" });
      const file = new File([blob], fileName, { type: "text/markdown" });

      // Use FormData to upload
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolder) {
        formData.append("parentId", currentFolder);
      }

      if (!isNewMarkdown && markdownDocument) {
        // For updates, delete the old file first
        await fetch(`/api/documents/${markdownDocument.id}`, {
          method: "DELETE",
        });
      }

      // Create the new/updated file
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save markdown file");
      }

      await fetchDocuments();
    } catch (error) {
      console.error("Error saving markdown:", error);
      throw error;
    }
  };

  const handleCopyMove = async (targetFolderId: string | null) => {
    if (!copyMoveTarget) return;

    try {
      const endpoint =
        copyMoveMode === "copy"
          ? `/api/documents/${copyMoveTarget.id}/copy`
          : `/api/documents/${copyMoveTarget.id}`;

      const response = await fetch(endpoint, {
        method: copyMoveMode === "copy" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parentId: targetFolderId }),
      });

      if (response.ok) {
        setShowCopyMoveModal(false);
        setCopyMoveTarget(null);
        fetchDocuments();
        alert(
          `${copyMoveTarget.name} ${copyMoveMode === "copy" ? "copied" : "moved"} successfully`
        );
      } else {
        const error = await response.json();
        alert(`Failed to ${copyMoveMode}: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error(`Error ${copyMoveMode}ing:`, error);
      alert(`Failed to ${copyMoveMode}`);
    }
  };

  // Sort documents (parent folder is already in the documents array if needed)
  const filteredDocuments = [...documents].sort((a, b) => {
    // Keep parent folder at the top always
    if (a.id === "parent-folder") return -1;
    if (b.id === "parent-folder") return 1;

    if (a.isFolder !== b.isFolder) {
      return a.isFolder ? -1 : 1;
    }

    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "size":
        comparison = (a.size || 0) - (b.size || 0);
        break;
      case "modified":
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div
      className="space-y-6"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileUpload(e.dataTransfer.files);
        }
      }}
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-400">Documents</h1>
        <p className="text-gray-400 mt-1">Manage {SITE_NAME} documents and files</p>
      </div>
      {/* Stats */}
      <div className="card bg-dark-800 border border-dark-600">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <FileManagerStats documents={documents} />
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex justify-start md:justify-end">
        <FileManagerToolbar
          viewMode={viewMode}
          uploading={uploading}
          onViewModeChange={setViewMode}
          onNewFolder={() => setShowNewFolderModal(true)}
          onNewMarkdown={handleNewMarkdown}
          onFileUpload={handleFileUpload}
        />
      </div>
      {/* Breadcrumbs and Search */}
      <FileManagerBreadcrumbs
        breadcrumbs={breadcrumbs}
        searchQuery={searchQuery}
        dropTarget={dropTarget}
        draggedItem={draggedItem}
        onBreadcrumbClick={handleBreadcrumbClick}
        onSearchChange={setSearchQuery}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMove={handleMove}
      />
      {/* Upload Progress */}
      {uploading && <UploadProgress uploadProgress={uploadProgress} />}
      {/* Documents Grid/List */}
      {loading ? (
        <div className="bg-dark-800 border border-dark-600 rounded-lg flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-12 text-center">
          <Folder className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-white text-lg font-medium mb-2">
            {searchQuery ? "No files found" : "This folder is empty"}
          </p>
          <p className="text-sm text-gray-500">
            {searchQuery
              ? "Try a different search term"
              : "Upload files or create folders to get started"}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile view - Always grid */}
          <FileManagerMobileView
            documents={filteredDocuments}
            searchQuery={searchQuery}
            breadcrumbs={breadcrumbs}
            dropTarget={dropTarget}
            onOpenFolder={handleOpenFolder}
            onBreadcrumbClick={handleBreadcrumbClick}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onRename={handleOpenRename}
            onCopy={handleOpenCopy}
            onMoveDocument={handleOpenMove}
            onDelete={handleOpenDelete}
            onDetails={handleOpenDetails}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMove={handleMove}
          />

          {/* Desktop view - Grid or List based on viewMode */}
          {viewMode === "grid" ? (
            <FileManagerGrid
              documents={filteredDocuments}
              searchQuery={searchQuery}
              breadcrumbs={breadcrumbs}
              dropTarget={dropTarget}
              onOpenFolder={handleOpenFolder}
              onBreadcrumbClick={handleBreadcrumbClick}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onRename={handleOpenRename}
              onCopy={handleOpenCopy}
              onMoveDocument={handleOpenMove}
              onDelete={handleOpenDelete}
              onDetails={handleOpenDetails}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onMove={handleMove}
            />
          ) : (
            <FileManagerList
              documents={filteredDocuments}
              searchQuery={searchQuery}
              breadcrumbs={breadcrumbs}
              dropTarget={dropTarget}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onOpenFolder={handleOpenFolder}
              onBreadcrumbClick={handleBreadcrumbClick}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onRename={handleOpenRename}
              onCopy={handleOpenCopy}
              onMoveDocument={handleOpenMove}
              onDelete={handleOpenDelete}
              onDetails={handleOpenDetails}
              onSort={handleSort}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onMove={handleMove}
            />
          )}
        </>
      )}{" "}
      {/* Modals */}
      <FileManagerModals
        showNewFolderModal={showNewFolderModal}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onCreateFolder={handleCreateFolder}
        onCloseNewFolder={() => {
          setShowNewFolderModal(false);
          setNewFolderName("");
        }}
        showRenameModal={showRenameModal}
        renameTarget={renameTarget}
        renameName={renameName}
        onRenameNameChange={setRenameName}
        onRename={handleRename}
        onCloseRename={() => {
          setShowRenameModal(false);
          setRenameTarget(null);
          setRenameName("");
        }}
        onOpenDeleteFromRename={() => {
          setShowRenameModal(false);
          setDeleteTarget(renameTarget);
          setShowDeleteModal(true);
          setRenameName("");
        }}
        onOpenCopyFromRename={() => {
          if (renameTarget) {
            handleOpenCopy(renameTarget);
          }
        }}
        onOpenMoveFromRename={() => {
          if (renameTarget) {
            handleOpenMove(renameTarget);
          }
        }}
        showDeleteModal={showDeleteModal}
        deleteTarget={deleteTarget}
        onDelete={handleDelete}
        onCloseDelete={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        showPreviewModal={showPreviewModal}
        previewDocument={previewDocument}
        previewContent={previewContent}
        onDownload={handleDownload}
        onClosePreview={() => {
          setShowPreviewModal(false);
          setPreviewDocument(null);
          setPreviewContent("");
        }}
      />
      {/* Copy/Move Modal */}
      <CopyMoveModal
        show={showCopyMoveModal}
        mode={copyMoveMode}
        sourceDocument={copyMoveTarget}
        onClose={() => {
          setShowCopyMoveModal(false);
          setCopyMoveTarget(null);
        }}
        onConfirm={handleCopyMove}
      />
      {/* File Details Modal */}
      {detailsDocument && (
        <FileDetailsModal document={detailsDocument} onClose={() => setDetailsDocument(null)} />
      )}
      {/* Markdown Editor */}
      {showMarkdownEditor && (
        <MarkdownEditor
          document={markdownDocument}
          isNewFile={isNewMarkdown}
          onClose={() => {
            setShowMarkdownEditor(false);
            setMarkdownDocument(null);
            setIsNewMarkdown(false);
          }}
          onSave={handleSaveMarkdown}
        />
      )}
    </div>
  );
}
