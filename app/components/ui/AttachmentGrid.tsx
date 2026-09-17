import { Upload, FileText } from "lucide-react";

type Attachment = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
};

interface AttachmentGridProps {
  attachments: Attachment[];
  onPreviewClick?: (url: string, name: string) => void;
  onDelete?: (attachmentId: string) => void;
  editable?: boolean;
}

// Convert stored path to API route path for serving files
const getFileUrl = (storedPath: string): string => {
  // Convert /uploads/... to /api/uploads/...
  if (storedPath.startsWith("/uploads/")) {
    return `/api${storedPath}`;
  }
  return storedPath;
};

export default function AttachmentGrid({
  attachments,
  onPreviewClick,
  onDelete,
  editable = false,
}: AttachmentGridProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDelete = (attachmentId: string, attachmentName: string) => {
    if (!confirm(`Are you sure you want to delete "${attachmentName}"?`)) {
      return;
    }
    onDelete?.(attachmentId);
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="group relative bg-dark-600 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
        >
          {/* Image Thumbnail */}
          {attachment.mimeType.startsWith("image/") ? (
            <div
              className="aspect-square cursor-pointer bg-dark-400 overflow-hidden relative group border border-gray-600 hover:border-primary-500 transition-all rounded"
              onClick={() =>
                onPreviewClick?.(
                  getFileUrl(attachment.path),
                  attachment.originalName
                )
              }
            >
              <img
                src={getFileUrl(attachment.path)}
                alt={attachment.originalName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(
                    "Image failed to load:",
                    getFileUrl(attachment.path)
                  );
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-xs px-3 py-1 bg-primary-600 rounded">
                  View Full
                </span>
              </div>
            </div>
          ) : (
            /* File Icon for non-images */
            <div className="aspect-square flex flex-col items-center justify-center p-3 bg-dark-500">
              <FileText className="h-8 w-8 text-primary-400 mb-2" />
              <div className="text-xs text-gray-400 text-center truncate w-full px-2">
                {attachment.mimeType.includes("pdf")
                  ? "PDF"
                  : attachment.mimeType.includes("word")
                  ? "DOC"
                  : attachment.mimeType.includes("text")
                  ? "TXT"
                  : "FILE"}
              </div>
            </div>
          )}

          {/* File Info */}
          <div className="p-2 bg-dark-600">
            <div className="text-xs font-medium text-white truncate">
              {attachment.originalName}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatFileSize(attachment.size)}
            </div>
            <div className="flex space-x-2 mt-1">
              <a
                href={getFileUrl(attachment.path)}
                download={attachment.originalName}
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                Download
              </a>
              {editable && onDelete && (
                <button
                  type="button"
                  onClick={() =>
                    handleDelete(attachment.id, attachment.originalName)
                  }
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
