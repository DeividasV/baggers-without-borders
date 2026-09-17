"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
} from "lucide-react";
import TestSummaryCards from "@/components/features/test-results/TestSummaryCards";
import TestFileResults from "@/components/features/test-results/TestFileResults";

interface TestData {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  numTotalTestSuites: number;
  numPassedTestSuites: number;
  numFailedTestSuites: number;
  numPendingTestSuites: number;
  startTime: number;
  testResults: Array<{
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
  }>;
}

interface TestResultsResponse {
  data: TestData;
  lastRun: string;
}

export default function TestResultsView() {
  const [testResults, setTestResults] = useState<TestResultsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<
    Set<"passed" | "failed" | "skipped">
  >(new Set<"passed" | "failed" | "skipped">(["passed", "failed", "skipped"])); // All selected by default
  const [searchText, setSearchText] = useState("");

  const fetchTestResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/test-results");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch test results");
      }

      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestResults();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
          <span className="ml-3 text-lg text-gray-300">
            Loading test results...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-red-400 mb-2">
                Error Loading Test Results
              </h2>
              <p className="text-red-300">{error}</p>
              <button
                onClick={fetchTestResults}
                className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!testResults) {
    return null;
  }

  const { data, lastRun } = testResults;
  const duration =
    data.testResults.reduce(
      (acc, result) => acc + (result.perfStats?.runtime || 0),
      0
    ) / 1000;

  // Toggle status filter
  const toggleStatus = (status: "passed" | "failed" | "skipped") => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setSelectedStatuses(newStatuses);
  };

  // Filter test files based on selected statuses and search text
  const filteredTestFiles = data.testResults.filter((file) => {
    // Apply text search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const fileName = file.name.toLowerCase();
      if (!fileName.includes(searchLower)) {
        return false;
      }
    }

    // Apply status filter
    // If no status filters selected, show nothing
    if (selectedStatuses.size === 0) {
      return false;
    }

    // Check if file has tests matching any selected status
    // We need to look at individual tests within the suite
    if (file.testResults && file.testResults.length > 0) {
      return file.testResults.some((test) => {
        if (selectedStatuses.has("passed") && test.status === "passed") {
          return true;
        }
        if (selectedStatuses.has("failed") && test.status === "failed") {
          return true;
        }
        if (
          selectedStatuses.has("skipped") &&
          (test.status === "skipped" || test.status === "pending")
        ) {
          return true;
        }
        return false;
      });
    }

    // Fallback to suite-level counts if no individual test results
    const hasPassed =
      file.numPassingTests > 0 && selectedStatuses.has("passed");
    const hasFailed =
      file.numFailingTests > 0 && selectedStatuses.has("failed");
    const hasSkipped =
      file.numPendingTests > 0 && selectedStatuses.has("skipped");

    return hasPassed || hasFailed || hasSkipped;
  });

  // Calculate filtered stats for summary cards
  const getFilteredStats = () => {
    if (selectedStatuses.size === 0) {
      // No filter, return all stats
      return {
        totalTests: data.numTotalTests,
        passedTests: data.numPassedTests,
        failedTests: data.numFailedTests,
        skippedTests: data.numPendingTests,
        totalSuites: data.numTotalTestSuites,
        passedSuites: data.numPassedTestSuites,
        failedSuites: data.numFailedTestSuites,
        skippedSuites: data.numPendingTestSuites,
      };
    }

    // Calculate stats from filtered files only
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let totalSuites = filteredTestFiles.length;
    let passedSuites = 0;
    let failedSuites = 0;
    let skippedSuites = 0;

    filteredTestFiles.forEach((file) => {
      if (selectedStatuses.has("passed")) {
        passedTests += file.numPassingTests;
        totalTests += file.numPassingTests;
      }
      if (selectedStatuses.has("failed")) {
        failedTests += file.numFailingTests;
        totalTests += file.numFailingTests;
      }
      if (selectedStatuses.has("skipped")) {
        skippedTests += file.numPendingTests;
        totalTests += file.numPendingTests;
      }

      // Suite counts
      if (
        file.numFailingTests === 0 &&
        file.numPendingTests === 0 &&
        file.numPassingTests > 0
      ) {
        passedSuites++;
      } else if (file.numFailingTests > 0) {
        failedSuites++;
      } else if (file.numPendingTests > 0 && file.numFailingTests === 0) {
        skippedSuites++;
      }
    });

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalSuites,
      passedSuites,
      failedSuites,
      skippedSuites,
    };
  };

  const filteredStats = getFilteredStats();

  const lastRunDate = new Date(lastRun);
  const isRecent = Date.now() - lastRunDate.getTime() < 60 * 60 * 1000; // Within last hour

  // Calculate time ago
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ago`;
    if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    if (minutes > 0)
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    return "Just now";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-400">Testing Results</h1>
        <p className="text-gray-400 mt-1">
          Application quality and test coverage overview
        </p>
      </div>

      {/* Summary Cards */}
      <TestSummaryCards
        totalTests={data.numTotalTests}
        passedTests={data.numPassedTests}
        failedTests={data.numFailedTests}
        skippedTests={data.numPendingTests}
        totalSuites={data.numTotalTestSuites}
        passedSuites={data.numPassedTestSuites}
        failedSuites={data.numFailedTestSuites}
        skippedSuites={data.numPendingTestSuites}
      />

      {/* Overall Status Banner - Always shown with Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Status Message - Takes 2 columns */}
        {data.numFailedTests === 0 ? (
          <div className="lg:col-span-2 bg-green-900/20 border border-green-800 rounded-lg p-4 relative">
            <CheckCircle2 className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
            <div className="pr-8">
              <p className="text-lg font-semibold text-green-400">
                All Tests Passing!
              </p>
              <p className="text-sm text-green-300">
                Great job! The application is working as expected.
                {data.numPendingTests > 0 && (
                  <span className="text-yellow-300">
                    {" "}
                    However, {data.numPendingTests}{" "}
                    {data.numPendingTests === 1 ? "test is" : "tests are"}{" "}
                    currently skipped and should be reviewed.
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-red-900/20 border border-red-800 rounded-lg p-4 relative">
            <XCircle className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
            <div className="pr-8">
              <p className="text-lg font-semibold text-red-400">
                {data.numFailedTests}{" "}
                {data.numFailedTests === 1 ? "Test" : "Tests"} Need Attention
              </p>
              <p className="text-sm text-red-300">
                Some tests are failing. Review the details below to understand
                what needs to be fixed.
                {data.numPendingTests > 0 && (
                  <span className="text-yellow-300">
                    {" "}
                    ({data.numPendingTests}{" "}
                    {data.numPendingTests === 1 ? "test" : "tests"} skipped)
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Duration Card */}
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 border-l-4 border-l-purple-500 relative">
          <Clock className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
          <p className="text-sm text-gray-400 mb-2">Duration</p>
          <p className="text-2xl font-bold text-white mb-1">
            {duration >= 60
              ? `${Math.floor(duration / 60)}m ${(duration % 60).toFixed(0)}s`
              : `${duration.toFixed(1)}s`}
          </p>
          <p className="text-xs text-purple-400">
            {duration.toFixed(2)} seconds total
          </p>
        </div>

        {/* Last Run Card */}
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 border-l-4 border-l-purple-500 relative">
          <Clock className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
          <p className="text-sm text-gray-400 mb-2">Last run</p>
          <p className="text-2xl font-bold text-white mb-1">
            {getTimeAgo(lastRunDate)}
          </p>
          <p className="text-xs text-purple-400">
            {lastRunDate.toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            ,{" "}
            {lastRunDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchTestResults}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
          title="Refresh test results"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search test files..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>

            {/* Status Filter Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => toggleStatus("passed")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                  selectedStatuses.has("passed")
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "bg-dark-800 border-dark-600 text-gray-400 hover:border-green-500/50"
                }`}
              >
                Passed ({data.numPassedTests})
              </button>
              <button
                onClick={() => toggleStatus("failed")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                  selectedStatuses.has("failed")
                    ? "bg-red-500/20 border-red-500 text-red-400"
                    : "bg-dark-800 border-dark-600 text-gray-400 hover:border-red-500/50"
                }`}
              >
                Failed ({data.numFailedTests})
              </button>
              <button
                onClick={() => toggleStatus("skipped")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                  selectedStatuses.has("skipped")
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                    : "bg-dark-800 border-dark-600 text-gray-400 hover:border-yellow-500/50"
                }`}
              >
                Skipped ({data.numPendingTests})
              </button>
            </div>
          </div>

          {/* Info and Clear Button */}
          <div className="flex justify-between items-center gap-2 pt-2">
            <div className="text-xs text-gray-400">
              <span className="font-medium text-gray-300">
                {data.testResults.length}
              </span>{" "}
              {data.testResults.length === 1 ? "record" : "records"} •{" "}
              <span className="font-medium text-gray-300">
                {filteredTestFiles.length}
              </span>{" "}
              displayed
            </div>
            <button
              onClick={() => {
                setSelectedStatuses(
                  new Set<"passed" | "failed" | "skipped">([
                    "passed",
                    "failed",
                    "skipped",
                  ])
                );
                setSearchText("");
              }}
              disabled={selectedStatuses.size === 3 && !searchText.trim()}
              className="text-xs text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Test Suites */}
      <div className="mt-6">
        {filteredTestFiles.length > 0 ? (
          filteredTestFiles.map((testFile, index) => (
            <TestFileResults
              key={index}
              testFile={testFile}
              statusFilter={selectedStatuses}
            />
          ))
        ) : (
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-8 text-center">
            <p className="text-gray-400">
              No test suites match the current filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
