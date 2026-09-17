"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Button from "@/ui/Button";
import Card from "@/ui/Card";
import FileUpload from "@/ui/FileUpload";
import { Pagination } from "@/ui/Pagination";
import ConfirmationDialog from "@/ui/ConfirmationDialog";
import Badge from "@/ui/Badge";

interface ValidEntry {
  cid: number;
  memberName: string;
  memberId: string;
  hofCode: string;
  hofTitle: string;
  hofId: string;
  peaksInYear: number;
  foreignPeaksInYear: number;
  operation: "create" | "update";
  hasChanges: boolean;
  previousPeaksInYear: number | null;
  previousForeignPeaksInYear: number | null;
}

interface ErrorEntry {
  cid: number;
  hofCode?: string;
  error: string;
}

interface ValidationResult {
  valid: ValidEntry[];
  errors: ErrorEntry[];
  summary: {
    totalProcessed: number;
    validCount: number;
    created: number;
    updated: number;
    modified: number;
    skipped: number;
    errors: number;
  };
}

export default function UploadMemberDataPage() {
  const router = useRouter();
  const params = useParams();
  const yearId = params.id as string;

  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    | "all"
    | "created"
    | "updated"
    | "updated-changed"
    | "updated-unchanged"
    | "errors"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const itemsPerPage = 20;

  // Handle file selection and auto-validate
  const handleFileChange = async (files: File[]) => {
    const file = files[0];
    if (!file) {
      setUploadingFile(null);
      setValidationResult(null);
      return;
    }

    setUploadingFile(file);
    setValidationResult(null);
    setErrorMessage("");
    setSuccessMessage("");
    setIsValidating(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/years/${yearId}/validate-member-data`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to validate file");
        setUploadingFile(null);
        return;
      }

      setValidationResult(data);
      setCurrentPage(1);
      setActiveFilter("all");
    } catch (error) {
      setErrorMessage("Failed to validate file");
      setUploadingFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Filter entries based on active tab and search term (memoized to prevent repeated array scans)
  const filteredData = useMemo(() => {
    if (!validationResult) return { entries: [], errors: [] };

    let filteredEntries: ValidEntry[] = [];
    let filteredErrors: ErrorEntry[] = [];

    switch (activeFilter) {
      case "created":
        filteredEntries = validationResult.valid.filter(
          (e) => e.operation === "create",
        );
        break;
      case "updated":
        filteredEntries = validationResult.valid.filter(
          (e) => e.operation === "update",
        );
        break;
      case "updated-changed":
        filteredEntries = validationResult.valid.filter(
          (e) => e.operation === "update" && e.hasChanges,
        );
        break;
      case "updated-unchanged":
        filteredEntries = validationResult.valid.filter(
          (e) => e.operation === "update" && !e.hasChanges,
        );
        break;
      case "errors":
        filteredErrors = validationResult.errors;
        break;
      default:
        filteredEntries = validationResult.valid;
        filteredErrors = validationResult.errors;
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filteredEntries = filteredEntries.filter(
        (e) =>
          e.cid.toString().includes(search) ||
          e.memberName.toLowerCase().includes(search) ||
          e.hofCode.toLowerCase().includes(search) ||
          e.hofTitle.toLowerCase().includes(search),
      );
      filteredErrors = filteredErrors.filter(
        (e) =>
          e.cid.toString().includes(search) ||
          (e.hofCode && e.hofCode.toLowerCase().includes(search)),
      );
    }

    return {
      entries: filteredEntries,
      errors: filteredErrors,
    };
  }, [validationResult, activeFilter, searchTerm]);
  const allItems = [...filteredData.entries, ...filteredData.errors];
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  const paginatedItems = allItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Handle import confirmation
  const handleImportClick = () => {
    if (!validationResult || validationResult.valid.length === 0) return;
    setShowWarningDialog(true);
  };

  const handleWarningConfirm = () => {
    setShowWarningDialog(false);
    setShowConfirmDialog(true);
  };

  const handleFinalImport = async () => {
    setShowConfirmDialog(false);
    setIsImporting(true);
    setErrorMessage("");

    try {
      const entries = validationResult!.valid.map((e) => ({
        memberId: e.memberId,
        hofId: e.hofId,
        peaksInYear: e.peaksInYear,
        foreignPeaksInYear: e.foreignPeaksInYear,
      }));

      const response = await fetch(`/api/years/${yearId}/import-member-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to import data");
        return;
      }

      const result = data.data;
      setSuccessMessage(
        `Successfully imported ${result.imported} entries (${result.created} created, ${result.updated} updated, ${result.recalculated} member+HOF pairs recalculated)`,
      );

      // Clear form after success
      setTimeout(() => {
        router.push(`/admin/years/${yearId}/edit`);
      }, 3000);
    } catch (error) {
      setErrorMessage("Failed to import data");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/years/${yearId}/edit`)}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Year Configuration
        </Button>

        <h1 className="text-2xl font-bold text-primary-400 mb-2">
          Upload Member Data
        </h1>
        <p className="text-gray-400">
          Bulk upload member HOF entries from JSON file. System will validate
          data and show preview before import.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          role="alert"
          className="mb-6 p-4 bg-primary-900/20 border border-primary-500/30 rounded-lg flex items-start gap-3"
        >
          <CheckCircle className="h-5 w-5 text-primary-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-primary-400 font-medium">Import Successful</p>
            <p className="text-gray-300 text-sm mt-1">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3"
        >
          <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-gray-300 text-sm mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-primary-400 mb-4">
            1. Select JSON File
          </h2>
          <FileUpload
            files={uploadingFile ? [uploadingFile] : []}
            onFilesChange={handleFileChange}
            label="Upload JSON File"
            helperText="JSON format: [{ year, cid, 'HOF-CODE': [peaksInYear, foreignPeaksInYear] }]. Max 10MB, 10,000 entries."
            accept=".json"
            multiple={false}
          />

          {isValidating && (
            <div
              className="mt-4 flex items-center gap-2 text-gray-400"
              aria-busy="true"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Validating file...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <>
          {/* Summary */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-primary-400 mb-4">
                2. Validation Results
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                <div className="text-center">
                  <div
                    className="text-2xl font-bold text-gray-300"
                    aria-label="Total processed entries"
                  >
                    {validationResult.summary.totalProcessed}
                  </div>
                  <div className="text-sm text-gray-400" aria-hidden="true">
                    Processed
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold text-primary-400"
                    aria-label="Valid entries"
                  >
                    {validationResult.summary.validCount}
                  </div>
                  <div className="text-sm text-gray-400" aria-hidden="true">
                    Valid
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold text-blue-400"
                    aria-label="Entries to create"
                  >
                    {validationResult.summary.created}
                  </div>
                  <div className="text-sm text-gray-400" aria-hidden="true">
                    Create
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold text-yellow-400"
                    aria-label="Entries to update"
                  >
                    {validationResult.summary.updated}
                  </div>
                  <div className="text-sm text-gray-400" aria-hidden="true">
                    Update
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold text-orange-400"
                    aria-label="Modified entries"
                  >
                    {validationResult.summary.modified}
                  </div>
                  <div className="text-sm text-gray-400" aria-hidden="true">
                    Modified
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold text-red-400"
                    aria-label="Entries with errors"
                  >
                    {validationResult.summary.errors}
                  </div>
                  <div className="text-sm text-gray-400" aria-hidden="true">
                    Errors
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Preview Table */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-primary-400 mb-4">
                3. Preview Changes
              </h2>

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-4" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeFilter === "all"}
                  aria-controls="preview-table"
                  onClick={() => {
                    setActiveFilter("all");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === "all"
                      ? "bg-primary-600 text-white"
                      : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                  }`}
                >
                  All (
                  {validationResult.valid.length +
                    validationResult.errors.length}
                  )
                </button>
                <button
                  role="tab"
                  aria-selected={activeFilter === "created"}
                  aria-controls="preview-table"
                  onClick={() => {
                    setActiveFilter("created");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === "created"
                      ? "bg-primary-600 text-white"
                      : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                  }`}
                >
                  Created ({validationResult.summary.created})
                </button>
                <button
                  role="tab"
                  aria-selected={activeFilter === "updated"}
                  aria-controls="preview-table"
                  onClick={() => {
                    setActiveFilter("updated");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === "updated"
                      ? "bg-primary-600 text-white"
                      : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                  }`}
                >
                  Updated ({validationResult.summary.updated})
                </button>
                <button
                  role="tab"
                  aria-selected={activeFilter === "updated-changed"}
                  aria-controls="preview-table"
                  onClick={() => {
                    setActiveFilter("updated-changed");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === "updated-changed"
                      ? "bg-primary-600 text-white"
                      : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                  }`}
                >
                  Changed (
                  {
                    validationResult.valid.filter(
                      (e) => e.operation === "update" && e.hasChanges,
                    ).length
                  }
                  )
                </button>
                <button
                  role="tab"
                  aria-selected={activeFilter === "updated-unchanged"}
                  aria-controls="preview-table"
                  onClick={() => {
                    setActiveFilter("updated-unchanged");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === "updated-unchanged"
                      ? "bg-primary-600 text-white"
                      : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                  }`}
                >
                  Unchanged (
                  {
                    validationResult.valid.filter(
                      (e) => e.operation === "update" && !e.hasChanges,
                    ).length
                  }
                  )
                </button>
                <button
                  role="tab"
                  aria-selected={activeFilter === "errors"}
                  aria-controls="preview-table"
                  onClick={() => {
                    setActiveFilter("errors");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === "errors"
                      ? "bg-primary-600 text-white"
                      : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                  }`}
                >
                  Errors ({validationResult.summary.errors})
                </button>
              </div>

              {/* Search Box */}
              <div className="mt-4">
                <label htmlFor="search-input" className="sr-only">
                  Search entries by CID, member name, or HOF category
                </label>
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search by CID, member name, or HOF category..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Table */}
              <div className="mt-4 overflow-x-auto">
                <table
                  className="w-full"
                  aria-label="Member data import preview"
                >
                  <caption className="sr-only">
                    Preview of member entries to be imported with validation
                    results
                  </caption>
                  <thead>
                    <tr className="border-b border-dark-600">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        CID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        Member Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        HOF Category
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">
                        Peaks This Year
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">
                        Foreign This Year
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody id="preview-table">
                    {paginatedItems.map((item, idx) => {
                      if ("error" in item) {
                        // Error entry
                        return (
                          <tr
                            key={`error-${idx}`}
                            className="border-b border-dark-700 hover:bg-dark-800 focus-within:ring-1 focus-within:ring-primary-500 focus-within:ring-inset"
                          >
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {item.cid}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              -
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {item.hofCode || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-300">
                              -
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-300">
                              -
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge
                                variant="danger"
                                className="flex items-center gap-1 wrap-break-word"
                              >
                                <XCircle className="h-3 w-3 shrink-0" />
                                <span className="max-w-xs">{item.error}</span>
                              </Badge>
                            </td>
                          </tr>
                        );
                      } else {
                        // Valid entry
                        return (
                          <tr
                            key={`valid-${idx}`}
                            className="border-b border-dark-700 hover:bg-dark-800 focus-within:ring-1 focus-within:ring-primary-500 focus-within:ring-inset"
                          >
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {item.cid}
                            </td>
                            <td
                              className="px-4 py-3 text-sm text-gray-300 truncate max-w-xs"
                              title={item.memberName}
                            >
                              {item.memberName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {item.hofTitle}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-300">
                              {item.operation === "update" &&
                              item.previousPeaksInYear !== null &&
                              item.previousPeaksInYear !== item.peaksInYear ? (
                                <span className="text-yellow-400">
                                  {item.previousPeaksInYear} →{" "}
                                  {item.peaksInYear}
                                </span>
                              ) : (
                                item.peaksInYear
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-300">
                              {item.operation === "update" &&
                              item.previousForeignPeaksInYear !== null &&
                              item.previousForeignPeaksInYear !==
                                item.foreignPeaksInYear ? (
                                <span className="text-yellow-400">
                                  {item.previousForeignPeaksInYear} →{" "}
                                  {item.foreignPeaksInYear}
                                </span>
                              ) : (
                                item.foreignPeaksInYear
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {item.operation === "create" ? (
                                <Badge variant="info">Create</Badge>
                              ) : item.hasChanges ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="warning">Update</Badge>
                                  <span className="text-xs text-yellow-400">
                                    (Modified)
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge variant="default">Update</Badge>
                                  <span className="text-xs text-gray-500">
                                    (No changes)
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalCount={allItems.length}
                      pageSize={itemsPerPage}
                      onPageChange={setCurrentPage}
                      itemName="entries"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Import Button */}
          {validationResult.valid.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-primary-400 mb-4">
                  4. Confirm Import
                </h2>
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-gray-300 mb-4">
                      This will import {validationResult.valid.length} entries (
                      {validationResult.summary.created} new,{" "}
                      {validationResult.summary.updated} updates). All
                      cumulative totals will be automatically recalculated.
                    </p>
                    <Button
                      variant="primary"
                      onClick={handleImportClick}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing {validationResult.valid.length} entries...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Warning Dialog */}
      <ConfirmationDialog
        isOpen={showWarningDialog}
        onClose={() => setShowWarningDialog(false)}
        onConfirm={handleWarningConfirm}
        title="Import Member Data?"
        message={`This will import ${validationResult?.valid.length || 0} entries (${validationResult?.summary.created || 0} new, ${validationResult?.summary.updated || 0} updates). This action cannot be undone, but all changes are wrapped in a transaction and will rollback completely if any error occurs.`}
        confirmText="Continue"
        variant="warning"
      />

      {/* Final Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleFinalImport}
        title="Final Confirmation"
        message={`Please type "${yearId}" to confirm this import. All changes will be committed to the database.`}
        confirmText="Import Data"
        requireTextConfirmation={{
          expectedText: yearId,
          placeholder: "Enter code",
          instructionText: `Type "${yearId}" to confirm`,
        }}
        variant="danger"
      />
    </div>
  );
}
