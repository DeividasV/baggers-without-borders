"use client";

import { useState, useEffect } from "react";
import {
  X,
  Folder,
  Copy,
  MoveRight,
  Home,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Document, BreadcrumbItem } from "./types";

interface CopyMoveModalProps {
  show: boolean;
  mode: "copy" | "move";
  sourceDocument: Document | null;
  onClose: () => void;
  onConfirm: (targetFolderId: string | null) => void;
}

export default function CopyMoveModal({
  show,
  mode,
  sourceDocument,
  onClose,
  onConfirm,
}: CopyMoveModalProps) {
  const [folders, setFolders] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: "Documents" },
  ]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      fetchFolders();
    }
  }, [show, currentFolder]);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFolder) {
        params.set("parentId", currentFolder);
      }

      const response = await fetch(`/api/documents?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Only show folders, exclude the source document to prevent copying/moving into itself
        const folderList = data.filter(
          (doc: Document) => doc.isFolder && doc.id !== sourceDocument?.id
        );
        setFolders(folderList);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFolder = (folder: Document) => {
    setCurrentFolder(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedFolder(null); // Reset selection when navigating
  };

  const handleBreadcrumbClick = (index: number) => {
    const item = breadcrumbs[index];
    setCurrentFolder(item.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setSelectedFolder(null); // Reset selection when navigating
  };

  const handleConfirm = () => {
    // If no folder is selected, use current folder (from breadcrumbs)
    const targetId = selectedFolder !== null ? selectedFolder : currentFolder;
    onConfirm(targetId);
  };

  const handleClose = () => {
    // Reset state
    setCurrentFolder(null);
    setBreadcrumbs([{ id: null, name: "Documents" }]);
    setSelectedFolder(null);
    onClose();
  };

  if (!show || !sourceDocument) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-lg w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600 shrink-0">
          <div className="flex items-center gap-3">
            {mode === "copy" ? (
              <Copy className="h-5 w-5 text-primary-500" />
            ) : (
              <MoveRight className="h-5 w-5 text-primary-500" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">
                {mode === "copy" ? "Copy" : "Move"} "{sourceDocument.name}"
              </h3>
              <p className="text-sm text-gray-400">Select destination folder</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Breadcrumbs */}
        <div className="p-4 border-b border-dark-600 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="h-4 w-4" />}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`hover:text-white transition-colors px-2 py-1 rounded ${
                    index === breadcrumbs.length - 1
                      ? "text-white font-medium"
                      : ""
                  }`}
                >
                  {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                  {item.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Option to select current folder */}
              <button
                onClick={() => setSelectedFolder(currentFolder)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 ${
                  selectedFolder === currentFolder
                    ? "bg-primary-600/20 border-2 border-primary-500"
                    : "bg-dark-700 hover:bg-dark-600 border-2 border-transparent"
                }`}
              >
                <Folder className="h-6 w-6 text-primary-500" />
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">
                    Current folder{" "}
                    {breadcrumbs[breadcrumbs.length - 1].name !== "Documents" &&
                      `(${breadcrumbs[breadcrumbs.length - 1].name})`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {mode === "copy" ? "Copy" : "Move"} to this location
                  </div>
                </div>
                {selectedFolder === currentFolder && (
                  <div className="text-primary-500 text-sm font-medium">
                    Selected
                  </div>
                )}
              </button>

              {/* Subfolders */}
              {folders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No subfolders available
                </div>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedFolder === folder.id
                          ? "bg-primary-600/20 border-2 border-primary-500"
                          : "bg-dark-700 hover:bg-dark-600 border-2 border-transparent"
                      }`}
                    >
                      <button
                        onClick={() => handleOpenFolder(folder)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <Folder className="h-6 w-6 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-white">{folder.name}</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSelectedFolder(folder.id)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          selectedFolder === folder.id
                            ? "bg-primary-600 text-white"
                            : "bg-dark-600 text-gray-300 hover:bg-dark-500"
                        }`}
                      >
                        {selectedFolder === folder.id ? "Selected" : "Select"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-600 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {mode === "copy" ? (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Here
                </>
              ) : (
                <>
                  <MoveRight className="h-4 w-4" />
                  Move Here
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
