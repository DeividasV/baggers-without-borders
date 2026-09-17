"use client";

import { memo } from "react";
import Button from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  itemName?: string; // e.g., "users", "items", "records"
  pageSizeOptions?: number[]; // e.g., [10, 20, 50, 100]
}

const PaginationComponent = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemName = "items",
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) => {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="card mt-6">
      <div className="flex flex-col gap-3">
        {/* Info text */}
        <div className="text-xs sm:text-sm text-gray-400">
          Showing {startItem}-{endItem} of {totalCount} • {pageSize} per page
        </div>

        {/* Navigation controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 justify-start flex-wrap">
            {/* First button - show on desktop when not on first page */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="hidden md:inline-flex"
            >
              First
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="md:hidden min-w-[44px] min-h-[44px]"
              aria-label="Previous page"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="hidden md:inline-flex"
            >
              Previous
            </Button>

            {/* Desktop: Page number buttons + input for large datasets */}
            <div className="hidden md:flex items-center gap-1">
              {totalPages <= 10 ? (
                // Show all pages if 10 or fewer
                Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Button
                      key={pageNum}
                      variant={
                        currentPage === pageNum ? "primary" : "secondary"
                      }
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                )
              ) : (
                // For many pages: show input + nearby pages
                <>
                  {currentPage > 3 && (
                    <span className="text-gray-400 px-2">...</span>
                  )}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "primary" : "secondary"
                        }
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {currentPage < totalPages - 2 && (
                    <span className="text-gray-400 px-2">...</span>
                  )}
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={currentPage.toString()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const value = (e.target as HTMLInputElement).value;
                        const page = parseInt(value, 10);
                        if (
                          !isNaN(page) &&
                          Number.isInteger(page) &&
                          page >= 1 &&
                          page <= totalPages
                        ) {
                          onPageChange(page);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      const page = parseInt(value, 10);
                      if (
                        !isNaN(page) &&
                        Number.isInteger(page) &&
                        page >= 1 &&
                        page <= totalPages &&
                        page !== currentPage
                      ) {
                        onPageChange(page);
                      }
                      e.target.value = "";
                    }}
                    className="w-20 h-11 px-2 py-1 ml-2 text-center bg-dark-800 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-500"
                  />
                </>
              )}
            </div>

            <div className="md:hidden flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder={currentPage.toString()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = (e.target as HTMLInputElement).value;
                    const page = parseInt(value, 10);
                    if (
                      !isNaN(page) &&
                      Number.isInteger(page) &&
                      page >= 1 &&
                      page <= totalPages
                    ) {
                      onPageChange(page);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  const page = parseInt(value, 10);
                  if (
                    !isNaN(page) &&
                    Number.isInteger(page) &&
                    page >= 1 &&
                    page <= totalPages &&
                    page !== currentPage
                  ) {
                    onPageChange(page);
                  }
                  e.target.value = "";
                }}
                className="w-16 h-11 px-2 py-1 text-center bg-dark-800 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-500"
              />
              <span className="text-gray-400 text-sm">/ {totalPages}</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="md:hidden"
              aria-label="Next page"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="hidden md:inline-flex"
            >
              Next
            </Button>

            {/* Last button - show on desktop when not on last page */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden md:inline-flex"
              aria-label="Last page"
            >
              Last
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when parent components update
export const Pagination = memo(PaginationComponent);
