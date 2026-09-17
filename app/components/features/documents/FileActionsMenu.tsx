"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  MoreVertical,
  Eye,
  Download,
  Edit2,
  Copy,
  FolderInput,
  Trash2,
  FileText,
  FolderOpen,
  ArrowUp,
} from "lucide-react";
import { Document } from "./types";

const MENU_WIDTH = 192;
const VIEWPORT_PADDING = 12;
const MENU_OFFSET = 4;

type MenuPosition = {
  left: number;
  top?: number;
  bottom?: number;
  maxHeight?: number;
};

interface FileActionsMenuProps {
  document: Document;
  onPreview?: (doc: Document) => void;
  onDownload?: (doc: Document) => void;
  onNavigate?: (doc: Document) => void;
  onRename?: (doc: Document) => void;
  onCopy?: (doc: Document) => void;
  onMove?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
  onDetails?: (doc: Document) => void;
}

export default function FileActionsMenu({
  document,
  onPreview,
  onDownload,
  onNavigate,
  onRename,
  onCopy,
  onMove,
  onDelete,
  onDetails,
}: FileActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    left: VIEWPORT_PADDING,
  });

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const updateMenuPosition = () => {
      const triggerRect = menuRef.current?.getBoundingClientRect();
      if (!triggerRect) {
        return;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuHeight = menuPanelRef.current?.scrollHeight ?? 0;
      const fallbackHeight = 280;
      const measuredHeight = menuHeight || fallbackHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_PADDING;
      const spaceAbove = triggerRect.top - VIEWPORT_PADDING;
      const canOpenDownward = measuredHeight <= spaceBelow;
      const canOpenUpward = measuredHeight <= spaceAbove;
      const openUpward = canOpenUpward || (!canOpenDownward && spaceAbove > spaceBelow);

      const spaceToLeft = triggerRect.right - VIEWPORT_PADDING;
      const spaceToRight = viewportWidth - triggerRect.left - VIEWPORT_PADDING;
      const preferLeftAlignment =
        MENU_WIDTH <= spaceToLeft || !MENU_WIDTH || spaceToLeft >= spaceToRight;
      const desiredLeft = preferLeftAlignment ? triggerRect.right - MENU_WIDTH : triggerRect.left;

      const left = Math.min(
        Math.max(desiredLeft, VIEWPORT_PADDING),
        Math.max(VIEWPORT_PADDING, viewportWidth - MENU_WIDTH - VIEWPORT_PADDING)
      );

      if (openUpward) {
        const bottom = Math.max(viewportHeight - triggerRect.top + MENU_OFFSET, VIEWPORT_PADDING);
        const maxHeight = Math.max(triggerRect.top - VIEWPORT_PADDING * 2, 0);

        setMenuPosition({
          left,
          bottom,
          maxHeight,
        });

        return;
      }

      const top = Math.max(triggerRect.bottom + MENU_OFFSET, VIEWPORT_PADDING);
      const maxHeight = Math.max(viewportHeight - top - VIEWPORT_PADDING, 0);

      setMenuPosition({
        left,
        top,
        maxHeight,
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="p-2 text-gray-400 hover:text-white hover:bg-dark-600 rounded-lg transition-colors"
        title="More actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-38" onClick={() => setIsOpen(false)}>
          <div
            ref={menuPanelRef}
            role="menu"
            aria-label={`Actions for ${document.name}`}
            className="absolute w-48 overflow-y-auto bg-dark-700 border border-dark-600 rounded-lg shadow-lg z-39 py-1"
            style={menuPosition}
            onClick={(e) => e.stopPropagation()}
          >
            {!document.isFolder && onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onPreview(document));
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            )}
            {!document.isFolder && onDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onDownload(document));
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            )}
            {document.isFolder && onNavigate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onNavigate(document));
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
              >
                {document.id === "parent-folder" ? (
                  <>
                    <ArrowUp className="h-4 w-4" />
                    Navigate up
                  </>
                ) : (
                  <>
                    <FolderOpen className="h-4 w-4" />
                    Navigate inside
                  </>
                )}
              </button>
            )}
            {onDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onDetails(document));
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
              >
                <FileText className="h-4 w-4" />
                Information
              </button>
            )}
            {(onRename || onCopy || onMove) && <div className="border-t border-dark-600 my-1" />}
            {onRename && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onRename(document));
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Rename
              </button>
            )}
            {onCopy && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onCopy(document));
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            )}
            {onMove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMove(document));
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
              >
                <FolderInput className="h-4 w-4" />
                Move
              </button>
            )}
            {onDelete && (
              <>
                <div className="border-t border-dark-600 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onDelete(document));
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
