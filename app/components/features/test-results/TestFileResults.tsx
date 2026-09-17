"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface TestResult {
  name: string;
  numFailingTests: number;
  numPassingTests: number;
  numPendingTests: number;
  perfStats?: {
    start: number;
    end: number;
    runtime: number;
  };
  testResults?: Array<{
    ancestorTitles: string[];
    title: string;
    status: "passed" | "failed" | "pending" | "skipped";
    duration: number;
    failureMessages?: string[];
  }>;
}

interface TestFileResultsProps {
  testFile: TestResult;
  statusFilter?: Set<"passed" | "failed" | "skipped">;
}

export default function TestFileResults({
  testFile,
  statusFilter = new Set(),
}: TestFileResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState<{ [key: number]: boolean }>(
    {}
  );

  const fileName = testFile.name.split("/").pop() || testFile.name;
  // Extract path after __tests__/
  const pathAfterTests = testFile.name.includes("__tests__/")
    ? testFile.name.split("__tests__/")[1]
    : testFile.name;

  // Calculate filtered counts based on statusFilter
  const getFilteredCounts = () => {
    // When filter is active (has selections) or no individual test data
    if (!testFile.testResults) {
      // No individual test data, use suite-level counts
      return {
        totalTests:
          testFile.numPassingTests +
          testFile.numFailingTests +
          testFile.numPendingTests,
        numPassingTests: testFile.numPassingTests,
        numFailingTests: testFile.numFailingTests,
        numPendingTests: testFile.numPendingTests,
        duration: (testFile.perfStats?.runtime || 0) / 1000,
      };
    }

    // Filter individual tests based on selected statuses
    const filteredTests = testFile.testResults.filter((test) => {
      if (statusFilter.has("passed") && test.status === "passed") return true;
      if (statusFilter.has("failed") && test.status === "failed") return true;
      if (
        statusFilter.has("skipped") &&
        (test.status === "skipped" || test.status === "pending")
      )
        return true;
      return false;
    });

    const numPassingTests = filteredTests.filter(
      (t) => t.status === "passed"
    ).length;
    const numFailingTests = filteredTests.filter(
      (t) => t.status === "failed"
    ).length;
    const numPendingTests = filteredTests.filter(
      (t) => t.status === "pending" || t.status === "skipped"
    ).length;

    // Calculate total duration of filtered tests (convert from ms to seconds)
    const totalDuration =
      filteredTests.reduce((sum, test) => sum + test.duration, 0) / 1000;

    return {
      totalTests: filteredTests.length,
      numPassingTests,
      numFailingTests,
      numPendingTests,
      duration: totalDuration,
    };
  };

  const filteredCounts = getFilteredCounts();
  const hasFailures = filteredCounts.numFailingTests > 0;
  const hasSkipped = filteredCounts.numPendingTests > 0;
  const duration = filteredCounts.duration;

  // Determine border color: red if any failed, yellow if any skipped (and no failures), green otherwise
  const getBorderColor = () => {
    if (hasFailures) return "border-l-red-500";
    if (hasSkipped) return "border-l-yellow-500";
    return "border-l-green-500";
  };

  const toggleDetails = (index: number) => {
    setShowDetails((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Remove absolute path, keep only project-relative path
  const sanitizeErrorMessage = (message: string) => {
    // Replace absolute paths with relative paths
    // Remove everything before and including /bwb/ (project folder)
    return message.replace(/.*\/bwb\//g, "");
  };

  return (
    <div className="bg-dark-800 rounded-lg border border-dark-700 mb-4">
      {/* File Header */}
      <div
        className={`p-4 cursor-pointer hover:bg-dark-750 transition-colors border-l-4 ${getBorderColor()}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-lg font-semibold text-white">{fileName}</h3>
              <p className="text-sm text-gray-400 truncate">{pathAfterTests}</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 ml-4 shrink-0">
            {/* Total Tests */}
            <div className="text-sm text-gray-400 min-w-12 text-right">
              <span className="text-gray-300 font-medium">
                {filteredCounts.totalTests}
              </span>
            </div>
            {/* Passed */}
            <div className="text-sm text-green-400 font-medium min-w-12 text-right">
              {filteredCounts.numPassingTests}
            </div>
            {/* Failed */}
            <div className="text-sm text-red-400 font-medium min-w-12 text-right">
              {filteredCounts.numFailingTests}
            </div>
            {/* Skipped */}
            <div className="text-sm text-yellow-400 font-medium min-w-12 text-right">
              {filteredCounts.numPendingTests}
            </div>
            {/* Duration */}
            <div className="text-sm text-purple-400 font-medium min-w-16 text-right">
              {duration.toFixed(2)}s
            </div>
          </div>
        </div>
      </div>

      {/* Test Details */}
      {isExpanded && (
        <div className="border-t border-dark-700 p-4 bg-dark-850">
          <div className="space-y-2">
            {testFile.testResults && testFile.testResults.length > 0 ? (
              testFile.testResults
                .filter((test) => {
                  // Apply status filter - only show tests matching selected statuses
                  if (statusFilter.has("passed") && test.status === "passed")
                    return true;
                  if (statusFilter.has("failed") && test.status === "failed")
                    return true;
                  if (
                    statusFilter.has("skipped") &&
                    (test.status === "skipped" || test.status === "pending")
                  )
                    return true;
                  return false;
                })
                .map((test, index) => {
                  const fullTitle =
                    test.ancestorTitles.length > 0
                      ? `${test.ancestorTitles.join(" › ")} › ${test.title}`
                      : test.title;

                  return (
                    <div
                      key={index}
                      className="bg-dark-900 rounded-md p-3 border border-dark-700"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          {test.status === "passed" && (
                            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                          )}
                          {test.status === "failed" && (
                            <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                          )}
                          {(test.status === "pending" ||
                            test.status === "skipped") && (
                            <Clock className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white wrap-break-word">
                              {fullTitle}
                            </p>
                            {test.status === "failed" &&
                              test.failureMessages && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => toggleDetails(index)}
                                    className="text-xs text-red-400 hover:text-red-300 underline"
                                  >
                                    {showDetails[index]
                                      ? "Hide details"
                                      : "Show error details"}
                                  </button>
                                  {showDetails[index] && (
                                    <div className="mt-2 bg-dark-950 rounded p-3 border border-red-900/30">
                                      <pre className="text-xs text-red-300 whitespace-pre-wrap overflow-x-auto">
                                        {sanitizeErrorMessage(
                                          test.failureMessages.join("\n")
                                        )}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Status Label */}
                          {test.status === "passed" && (
                            <span className="text-xs text-green-400 font-medium">
                              Passed
                            </span>
                          )}
                          {test.status === "failed" && (
                            <span className="text-xs text-red-400 font-medium">
                              Failed
                            </span>
                          )}
                          {(test.status === "pending" ||
                            test.status === "skipped") && (
                            <span className="text-xs text-yellow-400 font-medium">
                              Skipped
                            </span>
                          )}
                          {/* Duration */}
                          <span className="text-xs text-purple-400 font-medium">
                            {(test.duration / 1000).toFixed(3)}s
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="bg-dark-900 rounded-md p-6 text-center">
                <p className="text-gray-400">
                  No test results available for this file.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
