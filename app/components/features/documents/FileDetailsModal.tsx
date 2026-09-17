"use client";

import {
  X,
  Folder,
  Calendar,
  HardDrive,
  Hash,
  Clock,
  FileType,
  Tag,
  Files,
  FolderTree,
} from "lucide-react";
import { Document } from "./types";
import { formatFileSize, formatDate, getFileIcon } from "./utils";
import { useState, useEffect } from "react";

interface FolderStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  directFiles: number;
  directFolders: number;
  directSize: number;
}

interface FileDetailsModalProps {
  document: Document;
  onClose: () => void;
}

export default function FileDetailsModal({
  document,
  onClose,
}: FileDetailsModalProps) {
  const [folderStats, setFolderStats] = useState<FolderStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (document.isFolder) {
      setLoadingStats(true);
      fetch(`/api/documents/${document.id}/stats`)
        .then((res) => res.json())
        .then((data) => {
          setFolderStats(data);
          setLoadingStats(false);
        })
        .catch((error) => {
          console.error("Error loading folder stats:", error);
          setLoadingStats(false);
        });
    }
  }, [document.id, document.isFolder]);

  const details = [
    {
      label: "Type",
      value: document.isFolder ? "Folder" : "File",
      icon: document.isFolder ? Folder : getFileIcon(document),
    },
    {
      label: "Name",
      value: document.name,
      icon: Tag,
    },
    {
      label: "Size",
      value: formatFileSize(document.size),
      icon: HardDrive,
    },
    {
      label: "Created",
      value: formatDate(document.createdAt),
      icon: Calendar,
    },
    {
      label: "Modified",
      value: formatDate(document.updatedAt),
      icon: Clock,
    },
    {
      label: "ID",
      value: document.id,
      icon: Hash,
    },
  ];

  // Add file-specific details
  if (!document.isFolder) {
    details.push(
      {
        label: "MIME Type",
        value: document.mimeType || "Unknown",
        icon: FileType,
      },
      {
        label: "Original Name",
        value: document.originalName || document.name,
        icon: Tag,
      },
      {
        label: "Stored Filename",
        value: document.filename || "N/A",
        icon: FileType,
      }
    );
  }

  // Calculate folder depth
  const depth = document.parentId ? document.path?.split("/").length || 0 : 0;
  if (depth > 0) {
    details.push({
      label: "Folder Depth",
      value: depth.toString(),
      icon: Folder,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            {(() => {
              const IconComponent = document.isFolder
                ? Folder
                : getFileIcon(document);
              return <IconComponent className="h-6 w-6 text-gray-400" />;
            })()}
            <div>
              <h2 className="text-xl font-semibold text-white">File Details</h2>
              <p className="text-sm text-gray-400 mt-1">{document.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {details.map((detail, index) => {
              const Icon = detail.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-dark-700/50 rounded-lg border border-dark-600 hover:border-dark-500 transition-colors"
                >
                  <div className="p-2 bg-dark-600 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 mb-1">{detail.label}</p>
                    <p className="text-white font-medium break-all">
                      {detail.value}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Folder Statistics */}
            {document.isFolder && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  Folder Contents
                </h3>
                {loadingStats ? (
                  <p className="text-sm text-gray-400">Loading statistics...</p>
                ) : folderStats ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Direct Files</p>
                        <p className="text-sm text-white font-mono">
                          {folderStats.directFiles.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Direct Folders</p>
                        <p className="text-sm text-white font-mono">
                          {folderStats.directFolders.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">
                          Total Files (All)
                        </p>
                        <p className="text-sm text-white font-mono">
                          {folderStats.totalFiles.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">
                          Total Folders (All)
                        </p>
                        <p className="text-sm text-white font-mono">
                          {folderStats.totalFolders.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-yellow-500/20 pt-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Direct Size</p>
                          <p className="text-sm text-white font-mono">
                            {formatFileSize(folderStats.directSize)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">
                            Total Size (All)
                          </p>
                          <p className="text-sm text-white font-mono font-semibold">
                            {formatFileSize(folderStats.totalSize)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Unable to load statistics
                  </p>
                )}
              </div>
            )}

            {/* Additional Statistics */}
            {!document.isFolder && (
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-400 mb-3">
                  Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Size in Bytes</p>
                    <p className="text-sm text-white font-mono">
                      {(document.size || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Size in KB</p>
                    <p className="text-sm text-white font-mono">
                      {((document.size || 0) / 1024).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Size in MB</p>
                    <p className="text-sm text-white font-mono">
                      {((document.size || 0) / (1024 * 1024)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Age (Days)</p>
                    <p className="text-sm text-white font-mono">
                      {Math.floor(
                        (Date.now() - new Date(document.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-400 mb-3">
                Timestamps
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Created (ISO)</p>
                  <p className="text-sm text-white font-mono break-all">
                    {new Date(document.createdAt).toISOString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Modified (ISO)</p>
                  <p className="text-sm text-white font-mono break-all">
                    {new Date(document.updatedAt).toISOString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">
                    Created (Unix Timestamp)
                  </p>
                  <p className="text-sm text-white font-mono">
                    {new Date(document.createdAt).getTime()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">
                    Modified (Unix Timestamp)
                  </p>
                  <p className="text-sm text-white font-mono">
                    {new Date(document.updatedAt).getTime()}
                  </p>
                </div>
              </div>
            </div>

            {/* IDs and References */}
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h3 className="text-sm font-semibold text-green-400 mb-3">
                References
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Document ID</p>
                  <p className="text-sm text-white font-mono break-all">
                    {document.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Parent Folder ID</p>
                  <p className="text-sm text-white font-mono break-all">
                    {document.parentId || "Root Level"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Path</p>
                  <p className="text-sm text-white font-mono break-all">
                    {document.path || "/"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
