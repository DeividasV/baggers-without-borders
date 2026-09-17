import { Eye } from "lucide-react";
import { Document, BreadcrumbItem } from "./types";
import { formatFileSize, truncatePath, canPreview, getFileIcon } from "./utils";
import FileActionsMenu from "./FileActionsMenu";

interface FileManagerMobileViewProps {
  documents: Document[];
  searchQuery: string;
  breadcrumbs: BreadcrumbItem[];
  dropTarget: string | null;
  onOpenFolder: (folder: Document) => void;
  onBreadcrumbClick: (index: number) => void;
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onRename: (doc: Document) => void;
  onCopy: (doc: Document) => void;
  onMoveDocument: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onDetails: (doc: Document) => void;
  onDragStart: (e: React.DragEvent, doc: Document) => void;
  onDragOver: (e: React.DragEvent, target: Document | null) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, target: Document | null) => void;
  onMove: (documentId: string, newParentId: string | null) => void;
}

export default function FileManagerMobileView({
  documents,
  searchQuery,
  breadcrumbs,
  dropTarget,
  onOpenFolder,
  onBreadcrumbClick,
  onPreview,
  onDownload,
  onRename,
  onCopy,
  onMoveDocument,
  onDelete,
  onDetails,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onMove,
}: FileManagerMobileViewProps) {
  const handleParentFolderDrop = (e: React.DragEvent, doc: Document) => {
    if (doc.id === "parent-folder") {
      e.preventDefault();
      const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
      const parentId = parentBreadcrumb?.id || null;

      const draggedItem = e.dataTransfer.getData("document");
      if (!draggedItem) return;

      const draggedDoc = JSON.parse(draggedItem);
      if (draggedDoc.parentId === parentId) return;

      onMove(draggedDoc.id, parentId);
    } else if (doc.isFolder) {
      onDrop(e, doc);
    }
  };

  const handleParentFolderClick = (doc: Document) => {
    if (doc.id === "parent-folder") {
      onBreadcrumbClick(breadcrumbs.length - 2);
    } else if (doc.isFolder) {
      onOpenFolder(doc);
    } else if (canPreview(doc)) {
      onPreview(doc);
    }
  };

  const handleNavigate = (doc: Document) => {
    if (doc.id === "parent-folder") {
      onBreadcrumbClick(breadcrumbs.length - 2);
    } else {
      onOpenFolder(doc);
    }
  };

  const handleItemClick = (doc: Document) => {
    if (doc.id === "parent-folder") {
      onBreadcrumbClick(breadcrumbs.length - 2);
    } else if (!doc.isFolder && canPreview(doc)) {
      onPreview(doc);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:hidden">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className={`group bg-dark-800 border border-dark-600 rounded-lg overflow-hidden hover:bg-dark-700 transition-all cursor-pointer flex ${
            dropTarget === doc.id ||
            (dropTarget === "parent-folder" && doc.id === "parent-folder")
              ? "ring-2 ring-primary-500"
              : ""
          } ${doc.id === "parent-folder" ? "bg-dark-700" : ""}`}
          draggable={doc.id !== "parent-folder"}
          onDragStart={(e) => doc.id !== "parent-folder" && onDragStart(e, doc)}
          onDragOver={(e) => {
            if (doc.id === "parent-folder") {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            } else if (doc.isFolder) {
              onDragOver(e, doc);
            }
          }}
          onDragLeave={onDragLeave}
          onDrop={(e) => handleParentFolderDrop(e, doc)}
          onDoubleClick={() => handleParentFolderClick(doc)}
          onClick={() => handleItemClick(doc)}
        >
          {/* Icon area */}
          <div className="flex items-center justify-center w-20 bg-dark-700">
            <div className="transform group-hover:scale-110 transition-transform">
              {(() => {
                const IconComponent = getFileIcon(doc);
                return <IconComponent className="h-10 w-10 text-gray-400" />;
              })()}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {doc.name}
            </div>
            {searchQuery && doc.path && doc.id !== "parent-folder" && (
              <div className="text-xs text-gray-500 mt-0.5 truncate">
                {truncatePath(doc.path)}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {doc.isFolder ? "Folder" : formatFileSize(doc.size)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 px-2">
            {!doc.isFolder && canPreview(doc) && doc.id !== "parent-folder" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(doc);
                }}
                className="p-2 hover:bg-dark-600 rounded transition-all"
                title="Preview"
              >
                <Eye className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <FileActionsMenu
              document={doc}
              onPreview={
                doc.id !== "parent-folder" && canPreview(doc)
                  ? onPreview
                  : undefined
              }
              onDownload={
                doc.id !== "parent-folder" && !doc.isFolder
                  ? onDownload
                  : undefined
              }
              onNavigate={doc.isFolder ? handleNavigate : undefined}
              onRename={doc.id !== "parent-folder" ? onRename : undefined}
              onCopy={doc.id !== "parent-folder" ? onCopy : undefined}
              onMove={doc.id !== "parent-folder" ? onMoveDocument : undefined}
              onDelete={doc.id !== "parent-folder" ? onDelete : undefined}
              onDetails={doc.id !== "parent-folder" ? onDetails : undefined}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
