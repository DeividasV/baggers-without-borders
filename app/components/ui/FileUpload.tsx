"use client";

import { Upload, X, FileText } from "lucide-react";
import { useState, memo, useRef } from "react";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  label?: string;
  helperText?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  previewUrls?: Map<string, string>;
  onPreviewClick?: (url: string, name: string) => void;
}

function FileUpload({
  files,
  onFilesChange,
  label,
  helperText = "Images, PDF, TXT, DOC, DOCX (max 10MB each)",
  accept = "image/*,.pdf,.txt,.doc,.docx",
  multiple = true,
  disabled = false,
  previewUrls = new Map(),
  onPreviewClick,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {label && (
        <div className="text-sm font-medium text-gray-300 mb-3">{label}</div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-dark-500 rounded-xl p-8 text-center hover:border-primary-500 transition-all duration-200">
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          accept={accept}
          id="file-upload"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full cursor-pointer flex flex-col items-center space-y-4 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-xl p-2 bg-transparent border-none appearance-none"
          disabled={disabled}
        >
          <div className="p-4 bg-dark-600 rounded-full">
            <Upload className="h-12 w-12 text-primary-400" />
          </div>
          <div className="space-y-2">
            <div className="text-lg font-medium text-gray-300">
              Drag and drop files here, or click to select
            </div>
            <div className="text-sm text-gray-400">
              Upload screenshots, documents, and supporting materials
            </div>
            <div className="text-xs text-gray-500">{helperText}</div>
          </div>
        </button>
      </div>

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-300">
            Files to upload ({files.length}):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="group relative bg-dark-600 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
              >
                {/* Image Preview or File Icon */}
                {file.type.startsWith("image/") &&
                previewUrls.has(file.name) ? (
                  <div className="aspect-square relative">
                    {onPreviewClick ? (
                      <button
                        type="button"
                        onClick={() =>
                          onPreviewClick(previewUrls.get(file.name)!, file.name)
                        }
                        className="w-full h-full p-0 border-0 bg-transparent cursor-zoom-in"
                        aria-label={`View ${file.name}`}
                      >
                        <img
                          src={previewUrls.get(file.name)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <img
                        src={previewUrls.get(file.name)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Delete button overlay */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="absolute top-0 right-0 m-1 bg-red-600/90 hover:bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all z-10"
                      title="Remove file"
                      disabled={disabled}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  /* File Icon for non-images */
                  <div className="aspect-square flex flex-col items-center justify-center p-4 bg-dark-500 relative">
                    <FileText className="h-10 w-10 text-primary-400 mb-2" />
                    <div className="text-xs text-gray-400 text-center truncate w-full px-2">
                      {file.type.includes("pdf")
                        ? "PDF"
                        : file.type.includes("word")
                        ? "DOC"
                        : file.type.includes("text")
                        ? "TXT"
                        : "FILE"}
                    </div>
                    {/* Delete button for non-images */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-0 right-0 m-1 bg-red-600/90 hover:bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                      title="Remove file"
                      disabled={disabled}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* File Info */}
                <div className="p-2 bg-dark-600">
                  <div className="text-xs font-medium text-white truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(FileUpload);
