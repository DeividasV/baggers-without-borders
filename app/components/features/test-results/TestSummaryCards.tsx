"use client";

import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileCode2,
} from "lucide-react";

interface TestSummaryCardsProps {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  skippedSuites: number;
}

export default function TestSummaryCards({
  totalTests,
  passedTests,
  failedTests,
  skippedTests,
  totalSuites,
  passedSuites,
  failedSuites,
  skippedSuites,
}: TestSummaryCardsProps) {
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const suitePassRate =
    totalSuites > 0 ? (passedSuites / totalSuites) * 100 : 0;

  return (
    <div className="space-y-6 mb-6">
      {/* Test Suites Row */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Test Suites
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Suites */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 border-l-4 border-l-gray-500 relative">
            <FileCode2 className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
            <p className="text-sm text-gray-400 mb-2">Total Suites</p>
            <p className="text-2xl font-bold text-white mb-1">{totalSuites}</p>
            <p className="text-xs text-gray-400">
              {suitePassRate.toFixed(1)}% pass rate
            </p>
          </div>

          {/* Passed Suites */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 border-l-4 border-l-green-500 relative">
            <CheckCircle2 className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
            <p className="text-sm text-gray-400 mb-2">Passed</p>
            <p className="text-2xl font-bold text-white mb-1">{passedSuites}</p>
            <p className="text-xs text-green-400">
              {suitePassRate.toFixed(1)}% pass rate
            </p>
          </div>

          {/* Failed Suites */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 border-l-4 border-l-red-500 relative">
            <XCircle className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
            <p className="text-sm text-gray-400 mb-2">Failed</p>
            <p className="text-2xl font-bold text-white mb-1">{failedSuites}</p>
            <p className="text-xs text-red-400">
              {failedSuites > 0
                ? `${((failedSuites / totalSuites) * 100).toFixed(
                    1
                  )}% need fixing`
                : "None"}
            </p>
          </div>

          {/* Skipped Suites */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 border-l-4 border-l-yellow-500 relative">
            <Clock className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
            <p className="text-sm text-gray-400 mb-2">Skipped</p>
            <p className="text-2xl font-bold text-white mb-1">
              {skippedSuites}
            </p>
            <p className="text-xs text-yellow-400">
              {skippedSuites > 0
                ? `${((skippedSuites / totalSuites) * 100).toFixed(1)}% skipped`
                : "None"}
            </p>
          </div>
        </div>
      </div>

      {/* Individual Tests Row */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Individual Tests
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tests */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 border-l-4 border-l-gray-500 relative">
            <AlertCircle className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
            <p className="text-sm text-gray-400 mb-2">Total Tests</p>
            <p className="text-2xl font-bold text-white mb-1">{totalTests}</p>
            <p className="text-xs text-gray-400">
              {passRate.toFixed(1)}% pass rate
            </p>
          </div>

          {/* Passed Tests */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 border-l-4 border-l-green-500 relative">
            <CheckCircle2 className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
            <p className="text-sm text-gray-400 mb-2">Passed</p>
            <p className="text-2xl font-bold text-white mb-1">{passedTests}</p>
            <p className="text-xs text-green-400">
              {passRate.toFixed(1)}% pass rate
            </p>
          </div>

          {/* Failed Tests */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 border-l-4 border-l-red-500 relative">
            <XCircle className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
            <p className="text-sm text-gray-400 mb-2">Failed</p>
            <p className="text-2xl font-bold text-white mb-1">{failedTests}</p>
            <p className="text-xs text-red-400">
              {failedTests > 0
                ? `${((failedTests / totalTests) * 100).toFixed(
                    1
                  )}% need review`
                : "None"}
            </p>
          </div>

          {/* Skipped Tests */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 border-l-4 border-l-yellow-500 relative">
            <Clock className="h-4 w-4 text-gray-500 absolute top-4 right-4" />
            <p className="text-sm text-gray-400 mb-2">Skipped</p>
            <p className="text-2xl font-bold text-white mb-1">{skippedTests}</p>
            <p className="text-xs text-yellow-400">
              {skippedTests > 0
                ? `${((skippedTests / totalTests) * 100).toFixed(1)}% skipped`
                : "None"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
