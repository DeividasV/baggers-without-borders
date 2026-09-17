"use client";

import { FolderPlus, Upload, Grid3x3, List, FileText } from "lucide-react";
import { ViewMode } from "./types";

interface FileManagerToolbarProps {
  viewMode: ViewMode;
  uploading: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onNewFolder: () => void;
  onNewMarkdown: () => void;
  onFileUpload: (files: FileList) => void;
}

export default function FileManagerToolbar({
  viewMode,
  uploading,
  onViewModeChange,
  onNewFolder,
  onNewMarkdown,
  onFileUpload,
}: FileManagerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* View Mode Toggle - Hidden on mobile */}
      <div className="hidden md:flex bg-dark-800 border border-dark-600 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange("grid")}
          className={`p-2 rounded ${
            viewMode === "grid"
              ? "bg-primary-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Grid3x3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className={`p-2 rounded ${
            viewMode === "list"
              ? "bg-primary-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <List className="h-4 w-4" />
        </button>
      </div>

      {/* Actions */}
      <button
        onClick={onNewFolder}
        className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white rounded-lg transition-colors"
      >
        <FolderPlus className="h-4 w-4" />
        <span>New Folder</span>
      </button>

      <button
        onClick={onNewMarkdown}
        className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white rounded-lg transition-colors"
      >
        <FileText className="h-4 w-4" />
        <span>New Note</span>
      </button>

      <label className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors cursor-pointer">
        <Upload className="h-4 w-4" />
        <span>Upload</span>
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && onFileUpload(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>
  );
}
