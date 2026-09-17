import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import fs from "fs";
import path from "path";

/**
 * GET /api/admin/test-results
 * Returns the latest test results from data/test-results/test-results.json
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Read test results file from data directory
    const testResultsPath = path.join(
      process.cwd(),
      "data",
      "test-results",
      "test-results.json"
    );

    // Check if file exists
    if (!fs.existsSync(testResultsPath)) {
      return NextResponse.json(
        {
          error: "No test results available",
          message:
            "Test results file not found. Run 'npm test' to generate results.",
        },
        { status: 404 }
      );
    }

    // Read and parse the file
    const fileContent = fs.readFileSync(testResultsPath, "utf-8");
    const rawTestResults = JSON.parse(fileContent);

    // Transform the data to match our interface
    const transformedResults = {
      numTotalTests: rawTestResults.numTotalTests,
      numPassedTests: rawTestResults.numPassedTests,
      numFailedTests: rawTestResults.numFailedTests,
      numPendingTests: rawTestResults.numPendingTests,
      numTotalTestSuites: rawTestResults.numTotalTestSuites,
      numPassedTestSuites: rawTestResults.numPassedTestSuites,
      numFailedTestSuites: rawTestResults.numFailedTestSuites,
      numPendingTestSuites: rawTestResults.numPendingTestSuites,
      startTime: rawTestResults.startTime,
      testResults: rawTestResults.testResults.map((testFile: any) => ({
        name: testFile.name,
        numFailingTests: testFile.numFailingTests || 0,
        numPassingTests: testFile.numPassingTests || 0,
        numPendingTests: testFile.numPendingTests || 0,
        perfStats: {
          start: testFile.startTime,
          end: testFile.endTime,
          runtime: testFile.endTime - testFile.startTime,
        },
        testResults: testFile.assertionResults?.map((test: any) => ({
          ancestorTitles: test.ancestorTitles || [],
          title: test.title,
          status: test.status,
          duration: test.duration || 0,
          failureMessages: test.failureMessages || [],
        })),
      })),
    };

    // Get file stats for last modified time
    const stats = fs.statSync(testResultsPath);

    return NextResponse.json({
      data: transformedResults,
      lastRun: stats.mtime.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching test results:", error);
    return NextResponse.json(
      { error: "Failed to fetch test results" },
      { status: 500 }
    );
  }
}
