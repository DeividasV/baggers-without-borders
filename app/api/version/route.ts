import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Try to read version.json first
    const versionFilePath = path.join(process.cwd(), "version.json");

    if (fs.existsSync(versionFilePath)) {
      const versionData = fs.readFileSync(versionFilePath, "utf8");
      const versionInfo = JSON.parse(versionData);

      return NextResponse.json({
        version: versionInfo.version,
        lastCommit: versionInfo.lastCommit?.substring(0, 8),
        updatedAt: versionInfo.updatedAt,
        major: versionInfo.major,
        minor: versionInfo.minor,
        patch: versionInfo.patch,
      });
    }

    // Fallback to package.json
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageData = fs.readFileSync(packageJsonPath, "utf8");
    const packageInfo = JSON.parse(packageData);

    return NextResponse.json({
      version: packageInfo.version,
      source: "package.json",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error reading version info:", error);

    return NextResponse.json(
      {
        error: "Could not read version information",
        version: "0.0.0",
      },
      { status: 500 }
    );
  }
}
