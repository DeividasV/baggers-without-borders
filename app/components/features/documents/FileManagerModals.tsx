"use client";

import { X, Trash2, Download, Copy, MoveRight } from "lucide-react";
import { Document } from "./types";
import { formatFileSize, formatDate } from "./utils";

interface FileManagerModalsProps {
  // New Folder Modal
  showNewFolderModal: boolean;
  newFolderName: string;
  onNewFolderNameChange: (name: string) => void;
  onCreateFolder: () => void;
  onCloseNewFolder: () => void;

  // Rename Modal
  showRenameModal: boolean;
  renameTarget: Document | null;
  renameName: string;
  onRenameNameChange: (name: string) => void;
  onRename: () => void;
  onCloseRename: () => void;
  onOpenDeleteFromRename: () => void;
  onOpenCopyFromRename?: () => void;
  onOpenMoveFromRename?: () => void;

  // Delete Modal
  showDeleteModal: boolean;
  deleteTarget: Document | null;
  onDelete: () => void;
  onCloseDelete: () => void;

  // Preview Modal
  showPreviewModal: boolean;
  previewDocument: Document | null;
  previewContent: string;
  onDownload: (doc: Document) => void;
  onClosePreview: () => void;
}

export default function FileManagerModals({
  showNewFolderModal,
  newFolderName,
  onNewFolderNameChange,
  onCreateFolder,
  onCloseNewFolder,
  showRenameModal,
  renameTarget,
  renameName,
  onRenameNameChange,
  onRename,
  onCloseRename,
  onOpenDeleteFromRename,
  onOpenCopyFromRename,
  onOpenMoveFromRename,
  showDeleteModal,
  deleteTarget,
  onDelete,
  onCloseDelete,
  showPreviewModal,
  previewDocument,
  previewContent,
  onDownload,
  onClosePreview,
}: FileManagerModalsProps) {
  return (
    <>
      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Create New Folder
              </h3>
              <button
                onClick={onCloseNewFolder}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <input
              type="text"
              value={newFolderName}
              onChange={(e) => onNewFolderNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onCreateFolder()}
              placeholder="Folder name"
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={onCloseNewFolder}
                className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onCreateFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && renameTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Rename {renameTarget.isFolder ? "Folder" : "File"}
              </h3>
              <button
                onClick={onCloseRename}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <input
              type="text"
              value={renameName}
              onChange={(e) => onRenameNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onRename()}
              placeholder="New name"
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={onCloseRename}
                className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onRename}
                disabled={!renameName.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rename
              </button>
            </div>

            {/* Copy and Move Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {onOpenCopyFromRename && (
                <button
                  onClick={onOpenCopyFromRename}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              )}
              {onOpenMoveFromRename && (
                <button
                  onClick={onOpenMoveFromRename}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MoveRight className="h-4 w-4" />
                  Move
                </button>
              )}
            </div>

            {/* Delete Button */}
            <button
              onClick={onOpenDeleteFromRename}
              className="w-full mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete {renameTarget.isFolder ? "Folder" : "File"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Delete {deleteTarget.isFolder ? "Folder" : "File"}
              </h3>
              <button
                onClick={onCloseDelete}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="text-white font-medium">
                "{deleteTarget.name}"
              </span>
              ?
              {deleteTarget.isFolder &&
                " This folder must be empty to be deleted."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCloseDelete}
                className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-dark-600 shrink-0">
              <h3 className="text-lg font-semibold text-white truncate">
                {previewDocument.originalName || previewDocument.name}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDownload(previewDocument)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={onClosePreview}
                  className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
              {previewDocument.mimeType?.startsWith("image/") ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={`/api/documents/${previewDocument.id}`}
                    alt={previewDocument.name}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </div>
              ) : previewDocument.mimeType === "application/pdf" ? (
                <object
                  data={`/api/documents/${previewDocument.id}#toolbar=1&navpanes=1&scrollbar=1`}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <iframe
                    src={`/api/documents/${previewDocument.id}`}
                    className="w-full h-full"
                    title={previewDocument.name}
                  >
                    <p className="text-gray-400 text-center p-4">
                      Your browser does not support PDF preview.{" "}
                      <button
                        onClick={() => onDownload(previewDocument)}
                        className="text-primary-400 hover:text-primary-300 underline"
                      >
                        Download the PDF
                      </button>
                    </p>
                  </iframe>
                </object>
              ) : (
                <pre className="bg-dark-900 text-gray-300 p-4 rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap wrap-break-word h-full">
                  {previewContent || "Loading..."}
                </pre>
              )}
            </div>

            <div className="p-4 border-t border-dark-600 bg-dark-700/50 shrink-0">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                  {previewDocument.mimeType || "Unknown type"} •{" "}
                  {formatFileSize(previewDocument.size)}
                </span>
                <span>{formatDate(previewDocument.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
