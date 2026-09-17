import { Eye, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Document, BreadcrumbItem, SortBy, SortDirection } from "./types";
import {
  formatFileSize,
  formatDate,
  truncatePath,
  canPreview,
  getFileIcon,
} from "./utils";
import FileActionsMenu from "./FileActionsMenu";

interface FileManagerListProps {
  documents: Document[];
  searchQuery: string;
  breadcrumbs: BreadcrumbItem[];
  dropTarget: string | null;
  sortBy: SortBy;
  sortDirection: SortDirection;
  onOpenFolder: (folder: Document) => void;
  onBreadcrumbClick: (index: number) => void;
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onRename: (doc: Document) => void;
  onCopy: (doc: Document) => void;
  onMoveDocument: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onDetails: (doc: Document) => void;
  onSort: (column: SortBy) => void;
  onDragStart: (e: React.DragEvent, doc: Document) => void;
  onDragOver: (e: React.DragEvent, target: Document | null) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, target: Document | null) => void;
  onMove: (documentId: string, newParentId: string | null) => void;
}

export default function FileManagerList({
  documents,
  searchQuery,
  breadcrumbs,
  dropTarget,
  sortBy,
  sortDirection,
  onOpenFolder,
  onBreadcrumbClick,
  onPreview,
  onDownload,
  onRename,
  onCopy,
  onMoveDocument,
  onDelete,
  onDetails,
  onSort,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onMove,
}: FileManagerListProps) {
  const renderFileIcon = (doc: Document) => {
    const IconComponent = getFileIcon(doc);
    return <IconComponent className="h-8 w-8 text-gray-400" />;
  };

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

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg overflow-hidden hidden md:block">
      <table className="w-full">
        <thead className="bg-dark-700 border-b border-dark-600">
          <tr>
            <th
              className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white transition-colors select-none"
              onClick={() => onSort("name")}
            >
              <div className="flex items-center gap-2">
                Name
                {sortBy === "name" ? (
                  sortDirection === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )
                ) : (
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                )}
              </div>
            </th>
            <th
              className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white transition-colors select-none"
              onClick={() => onSort("size")}
            >
              <div className="flex items-center gap-2">
                Size
                {sortBy === "size" ? (
                  sortDirection === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )
                ) : (
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                )}
              </div>
            </th>
            <th
              className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white transition-colors select-none"
              onClick={() => onSort("modified")}
            >
              <div className="flex items-center gap-2">
                Modified
                {sortBy === "modified" ? (
                  sortDirection === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )
                ) : (
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                )}
              </div>
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-700">
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className={`hover:bg-dark-700 cursor-pointer ${
                dropTarget === doc.id ||
                (dropTarget === "parent-folder" && doc.id === "parent-folder")
                  ? "bg-primary-900/20"
                  : ""
              } ${doc.id === "parent-folder" ? "bg-dark-700/50" : ""}`}
              draggable={doc.id !== "parent-folder"}
              onDragStart={(e) =>
                doc.id !== "parent-folder" && onDragStart(e, doc)
              }
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
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {renderFileIcon(doc)}
                  <div className="flex flex-col">
                    <span className="text-white">{doc.name}</span>
                    {searchQuery && doc.path && doc.id !== "parent-folder" && (
                      <span
                        className="text-xs text-gray-500 truncate max-w-md"
                        title={doc.path}
                      >
                        {truncatePath(doc.path)}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400">
                {doc.isFolder ? "-" : formatFileSize(doc.size)}
              </td>
              <td className="px-4 py-3 text-gray-400">
                {doc.id === "parent-folder" ? "-" : formatDate(doc.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {!doc.isFolder &&
                    canPreview(doc) &&
                    doc.id !== "parent-folder" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview(doc);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-dark-600 rounded-lg"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
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
                    onMove={
                      doc.id !== "parent-folder" ? onMoveDocument : undefined
                    }
                    onDelete={doc.id !== "parent-folder" ? onDelete : undefined}
                    onDetails={
                      doc.id !== "parent-folder" ? onDetails : undefined
                    }
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
