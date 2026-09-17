import { Home, ChevronRight, Search, X } from "lucide-react";
import { BreadcrumbItem, Document } from "./types";

interface FileManagerBreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  searchQuery: string;
  dropTarget: string | null;
  draggedItem: Document | null;
  onBreadcrumbClick: (index: number) => void;
  onSearchChange: (value: string) => void;
  onDragOver: (e: React.DragEvent, target: Document | null) => void;
  onDragLeave: () => void;
  onMove: (documentId: string, newParentId: string | null) => void;
}

export default function FileManagerBreadcrumbs({
  breadcrumbs,
  searchQuery,
  dropTarget,
  draggedItem,
  onBreadcrumbClick,
  onSearchChange,
  onDragOver,
  onDragLeave,
  onMove,
}: FileManagerBreadcrumbsProps) {
  const handleDrop = (
    e: React.DragEvent,
    item: BreadcrumbItem,
    index: number
  ) => {
    e.preventDefault();
    if (!draggedItem) return;

    const targetParentId = item.id;

    if (draggedItem.parentId === targetParentId) {
      return;
    }

    onMove(draggedItem.id, targetParentId);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-800 border border-dark-600 rounded-lg p-4">
      <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            <button
              onClick={() => onBreadcrumbClick(index)}
              onDragOver={(e) => onDragOver(e, null)}
              onDragLeave={onDragLeave}
              onDrop={(e) => handleDrop(e, item, index)}
              className={`hover:text-white transition-colors px-2 py-1 rounded ${
                index === breadcrumbs.length - 1 ? "text-white font-medium" : ""
              } ${
                dropTarget === "current" && index === breadcrumbs.length - 1
                  ? "bg-primary-600/20 ring-2 ring-primary-500"
                  : ""
              }`}
            >
              {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
              {item.name}
            </button>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files..."
          className="w-full pl-10 pr-10 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
