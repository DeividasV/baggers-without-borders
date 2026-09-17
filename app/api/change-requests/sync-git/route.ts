import { NextRequest } from "next/server";
import { SITE_NAME } from "@/src/config/site";
import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/api-auth";
import {
  generateChangeRequestTicketIdentifiers,
  isMissingFriendlyTicketSchema,
} from "@/src/lib/changeRequestTickets";

// Batch size for OpenAI API calls
const BATCH_SIZE = 50;

// GitHub repo (owner/name) used to build commit links. Configure GITHUB_REPO
// or NEXT_PUBLIC_GITHUB_REPO for your own fork; empty disables the links.
const GITHUB_REPO = process.env.GITHUB_REPO || process.env.NEXT_PUBLIC_GITHUB_REPO || "";

// Interface for exported commits file
interface ExportedCommits {
  exportedAt: string;
  repoName: string;
  branch: string;
  totalCommits: number;
  commits: CommitInfo[];
}

async function ensureFriendlyTicketSchemaReady() {
  try {
    await prisma.changeRequest.findFirst({
      select: {
        id: true,
        ticketNumber: true,
        ticketSlug: true,
      },
    });
    await prisma.changeRequestTicketCounter.findFirst({
      select: {
        id: true,
      },
    });
  } catch (error) {
    if (!isMissingFriendlyTicketSchema(error)) {
      throw error;
    }

    throw new Error(
      "Change request tickets are still being set up. Run the latest database migrations and try again."
    );
  }
}

// Load commits from exported JSON file (created during deployment)
function loadExportedCommits(since?: string | null, maxCommits?: number): CommitInfo[] {
  const commitsPath = path.join(process.cwd(), "data", "git-commits", "commits.json");

  if (!fs.existsSync(commitsPath)) {
    throw new Error("Git commits file not found. Run deployment to export commits.");
  }

  const fileContent = fs.readFileSync(commitsPath, "utf-8");
  const exportedData: ExportedCommits = JSON.parse(fileContent);

  let commits = exportedData.commits;

  // Filter commits after the 'since' commit
  if (since) {
    const sinceIndex = commits.findIndex((c) => c.hash === since);
    if (sinceIndex !== -1) {
      commits = commits.slice(sinceIndex + 1);
    }
  }

  // Apply maxCommits limit
  if (maxCommits && maxCommits > 0) {
    commits = commits.slice(0, maxCommits);
  }

  return commits;
}

// Map conventional commit types to ChangeRequest types
function mapCommitType(
  commitMessage: string
): "FEATURE" | "BUG" | "ENHANCEMENT" | "DOCUMENTATION" | "OTHER" {
  const match = commitMessage.match(
    /^(feat|fix|docs|style|refactor|test|chore|build|ci)(\([^)]*\))?[!]?:/i
  );

  if (!match) return "OTHER";

  const type = match[1].toLowerCase();
  switch (type) {
    case "feat":
      return "FEATURE";
    case "fix":
      return "BUG";
    case "docs":
      return "DOCUMENTATION";
    case "refactor":
    case "style":
    case "chore":
    case "build":
    case "ci":
    case "test":
      return "ENHANCEMENT";
    default:
      return "OTHER";
  }
}

// Extract scope/category from commit message
function extractCategory(commitMessage: string): string | null {
  const match = commitMessage.match(
    /^(?:feat|fix|docs|style|refactor|test|chore|build|ci)\(([^)]+)\)/i
  );
  if (!match) return null;

  const scope = match[1].toLowerCase();
  const validCategories = ["ui", "api", "db", "auth", "docs", "test", "deploy"];
  return validCategories.includes(scope) ? scope : "other";
}

// Determine impact based on change type and size
function calculateImpact(type: string, linesChanged: number): "LOW" | "MEDIUM" | "HIGH" {
  if (type === "FEATURE" || linesChanged > 200) return "HIGH";
  if (type === "BUG" || linesChanged > 50) return "MEDIUM";
  return "LOW";
}

// Round up to nearest 5 minutes
function roundToFiveMinutes(minutes: number): number {
  return Math.ceil(minutes / 5) * 5;
}

// Calculate estimated time (in minutes) based on commit complexity
function calculateEstimatedTime(
  type: string,
  linesChanged: number,
  filesChanged: number,
  category: string | null
): number {
  // Base time by type (in minutes) - realistic shorter estimates
  const baseTimeByType: Record<string, number> = {
    FEATURE: 25, // 25 min base for features
    BUG: 15, // 15 min base for bugs
    ENHANCEMENT: 20, // 20 min base for enhancements
    DOCUMENTATION: 10, // 10 min for docs
    OTHER: 15, // 15 min default
  };

  // Category complexity multiplier
  const categoryMultiplier: Record<string, number> = {
    db: 1.3, // Database changes are complex
    auth: 1.2, // Auth changes need careful review
    api: 1.15, // API changes need testing
    ui: 1.0, // UI is baseline
    test: 0.8, // Tests are usually straightforward
    docs: 0.5, // Docs are quick
    deploy: 1.1, // Deploy needs verification
    other: 1.0,
  };

  let baseTime = baseTimeByType[type] || 15;

  // Add time based on lines changed (1 min per 20 lines, capped)
  const linesTime = Math.min(Math.floor(linesChanged / 20), 45);

  // Add time based on files changed (2 min per file, capped)
  const filesTime = Math.min(filesChanged * 2, 20);

  // Apply category multiplier
  const multiplier = categoryMultiplier[category || "other"] || 1.0;

  // Calculate total
  const totalTime = (baseTime + linesTime + filesTime) * multiplier;

  // Round up to 5 minute segments, min 5, max 180 (3 hours)
  return Math.max(5, Math.min(roundToFiveMinutes(totalTime), 180));
}

// Calculate actual time with realistic variance
function calculateActualTime(estimatedTime: number, type: string): number {
  // Add some variance - actual time often slightly less than estimate
  const varianceByType: Record<string, { min: number; max: number }> = {
    FEATURE: { min: 0.75, max: 1.1 }, // Features sometimes run over
    BUG: { min: 0.6, max: 0.95 }, // Bugs often quicker than expected
    ENHANCEMENT: { min: 0.7, max: 1.0 },
    DOCUMENTATION: { min: 0.5, max: 0.85 }, // Docs usually quick
    OTHER: { min: 0.7, max: 1.0 },
  };

  const variance = varianceByType[type] || { min: 0.7, max: 1.0 };
  const factor = variance.min + Math.random() * (variance.max - variance.min);

  // Round to 5 minute segments, minimum 5 minutes
  return Math.max(5, roundToFiveMinutes(estimatedTime * factor));
}

// Parse git log output to extract commit details with stats
interface CommitInfo {
  hash: string;
  message: string;
  date: string;
  author: string;
  linesAdded: number;
  linesDeleted: number;
  filesChanged: number;
}

// Generate business-friendly descriptions using OpenAI
async function generateBusinessSummaries(
  openai: OpenAI,
  commits: CommitInfo[]
): Promise<
  Map<
    string,
    {
      title: string;
      description: string;
      businessValue: string;
      affectedAreas: string[];
      estimatedMinutes: number;
    }
  >
> {
  const results = new Map<
    string,
    {
      title: string;
      description: string;
      businessValue: string;
      affectedAreas: string[];
      estimatedMinutes: number;
    }
  >();

  const prompt = `You are writing change request documentation for ${SITE_NAME}, a climbing club management application.

Convert these git commits into professional change requests. Write as if requesting a change BEFORE it was implemented.

Commits:
${commits
  .map(
    (c, i) =>
      `${i + 1}. [${c.hash.substring(0, 7)}] ${c.message} | ${
        c.filesChanged
      } files, +${c.linesAdded}/-${c.linesDeleted} lines`
  )
  .join("\n")}

Respond with JSON array:
[
  {
    "hash": "abc1234",
    "title": "Clear action title - what needs to be done (max 50 chars)",
    "description": "Write as a REQUEST: 'Add feature to...' or 'Fix the issue where...'. Explain what the change does and why. 2-3 sentences.",
    "businessValue": "Concrete benefit: 'Saves 10 minutes per entry' or 'Prevents data loss'. Be specific about WHO benefits and HOW.",
    "affectedAreas": ["ui"],
    "estimatedMinutes": 20
  }
]

Title: Clear action ("Add bulk import" not "Implemented import")
Description: Start with verb (Add, Fix, Update, Improve), sound like a request
BusinessValue: WHO benefits + HOW (measurable when possible)

estimatedMinutes guidelines (be realistic, most tasks are quick):
- Simple text/style change: 5-10 min
- Small bug fix: 10-20 min  
- UI component update: 15-30 min
- New small feature: 20-45 min
- Complex feature: 45-90 min
- Major refactor: 60-120 min
Consider: lines changed, files touched, complexity of the change type

Valid affectedAreas: ui, reports, security, data-management, user-management, documentation, performance, quality, administration, integration`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini as fallback if gpt-5-nano not available
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "[]";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);

    for (const item of parsed) {
      if (item.hash && item.title && item.description) {
        // Match by short hash
        const commit = commits.find(
          (c) => c.hash.startsWith(item.hash) || item.hash.startsWith(c.hash.substring(0, 7))
        );
        if (commit) {
          results.set(commit.hash, {
            title: item.title.substring(0, 100),
            description: item.description,
            businessValue: item.businessValue || "",
            affectedAreas: Array.isArray(item.affectedAreas) ? item.affectedAreas : [],
            estimatedMinutes: item.estimatedMinutes || 15,
          });
        }
      }
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }

  // Fallback for any commits not processed by AI
  for (const commit of commits) {
    if (!results.has(commit.hash)) {
      results.set(commit.hash, {
        title: commit.message.substring(0, 100),
        description: `Technical change: ${commit.message}`,
        businessValue: "Technical improvement to the system.",
        affectedAreas: [],
        estimatedMinutes: 15,
      });
    }
  }

  return results;
}

// Stream progress updates using Server-Sent Events
function createProgressStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  const sendEvent = (data: object) => {
    if (controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    }
  };

  const close = () => {
    if (controller) {
      controller.close();
    }
  };

  return { stream, sendEvent, close };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      await ensureFriendlyTicketSchemaReady();
    } catch (error) {
      if (error instanceof Error && isMissingFriendlyTicketSchema(error)) {
        return new Response(
          JSON.stringify({
            error:
              "Change request tickets are still being set up. Run the latest database migrations and try again.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (
        error instanceof Error &&
        error.message ===
          "Change request tickets are still being set up. Run the latest database migrations and try again."
      ) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw error;
    }

    // Check OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({ apiKey });

    // Get last synced commit from AppSetting
    const lastSyncSetting = await prisma.appSetting.findUnique({
      where: { key: "git_sync_last_commit" },
    });
    const lastSyncedCommit = lastSyncSetting?.value || null;

    // Get current version from version.json
    let currentVersion = "0.0.0";
    try {
      const versionPath = require("path").join(process.cwd(), "version.json");
      const versionData = require("fs").readFileSync(versionPath, "utf8");
      const versionJson = JSON.parse(versionData);
      currentVersion = versionJson.version || "0.0.0";
    } catch {
      console.log("Could not read version.json, using default version");
    }

    // Get maxCommits from query params
    const { searchParams } = new URL(request.url);
    const maxCommits = parseInt(searchParams.get("maxCommits") || "0");

    // Always load from exported commits file (created during deployment)
    let commits: CommitInfo[];
    try {
      commits = loadExportedCommits(lastSyncedCommit, maxCommits || 100);
      console.log(`Loaded ${commits.length} commits from exported file`);
    } catch (error) {
      console.error("Failed to load exported commits:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to load commits",
          details:
            error instanceof Error
              ? error.message
              : "Git commits file not found. Deploy the app to export commits.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (commits.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No new commits to sync",
          processed: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Filter out commits that already exist in database
    const existingHashes = await prisma.changeRequest.findMany({
      where: {
        commitHash: { in: commits.map((c) => c.hash) },
      },
      select: { commitHash: true },
    });
    const existingHashSet = new Set(existingHashes.map((e) => e.commitHash));
    let newCommits = commits.filter((c) => !existingHashSet.has(c.hash));

    // Apply maxCommits limit if provided (for testing)
    if (maxCommits > 0 && newCommits.length > maxCommits) {
      newCommits = newCommits.slice(0, maxCommits);
    }

    if (newCommits.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "All commits already synced",
          processed: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create SSE stream for progress updates
    const { stream, sendEvent, close } = createProgressStream();

    // Process commits in background
    (async () => {
      try {
        const totalBatches = Math.ceil(newCommits.length / BATCH_SIZE);
        let processed = 0;
        let lastProcessedHash = lastSyncedCommit;

        sendEvent({
          type: "start",
          total: newCommits.length,
          batches: totalBatches,
        });

        for (let i = 0; i < newCommits.length; i += BATCH_SIZE) {
          const batch = newCommits.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;

          sendEvent({
            type: "batch_start",
            batch: batchNum,
            total: totalBatches,
            processed,
            commits: batch.map((c) => c.message.substring(0, 50)),
          });

          // Generate business summaries for this batch
          const summaries = await generateBusinessSummaries(openai, batch);

          // Create change requests for each commit in batch
          for (const commit of batch) {
            const summary = summaries.get(commit.hash) || {
              title: commit.message.substring(0, 100),
              description: commit.message,
              businessValue: "Technical improvement to the system.",
              affectedAreas: [] as string[],
              estimatedMinutes: 15,
            };

            const type = mapCommitType(commit.message);
            const category = extractCategory(commit.message);
            const linesChanged = commit.linesAdded + commit.linesDeleted;
            const impact = calculateImpact(type, linesChanged);

            // Use AI-estimated time, with slight variance for actual time
            const plannedTime = roundToFiveMinutes(summary.estimatedMinutes);
            const actualTime = calculateActualTime(plannedTime, type);

            await prisma.$transaction(async (tx) => {
              const createdAt = new Date(commit.date);
              const { ticketNumber, ticketSlug } = await generateChangeRequestTicketIdentifiers(
                tx,
                createdAt
              );

              await tx.changeRequest.create({
                data: {
                  ticketNumber,
                  ticketSlug,
                  title: summary.title,
                  description: summary.description,
                  type,
                  priority: "MEDIUM",
                  impact,
                  status: "COMPLETED",
                  createdById: session.user.id,
                  commitHash: commit.hash,
                  commitDate: createdAt,
                  createdAt,
                  version: currentVersion,
                  category,
                  linesAdded: commit.linesAdded,
                  linesDeleted: commit.linesDeleted,
                  filesChanged: commit.filesChanged,
                  isFromGit: true,
                  // Enhanced breakdown fields
                  technicalDetails: commit.message,
                  businessValue: summary.businessValue,
                  affectedAreas: JSON.stringify(summary.affectedAreas),
                  // Time estimates
                  plannedTime,
                  actualTime,
                },
              });
            });

            processed++;
            lastProcessedHash = commit.hash;
          }

          sendEvent({
            type: "batch_complete",
            batch: batchNum,
            total: totalBatches,
            processed,
          });

          // Small delay between batches to avoid rate limiting
          if (i + BATCH_SIZE < newCommits.length) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        // Update last synced commit in AppSetting
        if (lastProcessedHash) {
          await prisma.appSetting.upsert({
            where: { key: "git_sync_last_commit" },
            update: { value: lastProcessedHash },
            create: {
              key: "git_sync_last_commit",
              value: lastProcessedHash,
              description: "Last git commit hash synced to change requests",
              category: "sync",
            },
          });
        }

        sendEvent({
          type: "complete",
          success: true,
          processed,
          message: `Successfully synced ${processed} commits`,
        });
      } catch (error) {
        console.error("Sync error:", error);
        sendEvent({
          type: "error",
          error:
            error instanceof Error && isMissingFriendlyTicketSchema(error)
              ? "Change request tickets are still being set up. Run the latest database migrations and try again."
              : error instanceof Error
                ? error.message
                : "Unknown error occurred",
        });
      } finally {
        close();
      }
    })();

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Sync git error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to sync git commits",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lastSyncSetting = await prisma.appSetting.findUnique({
      where: { key: "git_sync_last_commit" },
    });

    const gitCommitCount = await prisma.changeRequest.count({
      where: { isFromGit: true },
    });

    return new Response(
      JSON.stringify({
        lastSyncedCommit: lastSyncSetting?.value || null,
        syncedCommitCount: gitCommitCount,
        githubRepo: GITHUB_REPO,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to get sync status" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
