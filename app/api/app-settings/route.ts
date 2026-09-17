import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

// GET /api/app-settings - Get all settings or a specific setting by key
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");
    const category = searchParams.get("category");

    // If a specific key is requested, return just that setting
    if (key) {
      const setting = await prisma.appSetting.findUnique({
        where: { key },
      });

      if (!setting) {
        return NextResponse.json(
          { error: "Setting not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(setting);
    }

    // Otherwise, return all settings (optionally filtered by category)
    const where = category ? { category } : {};

    const settings = await prisma.appSetting.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch app settings" },
      { status: 500 }
    );
  }
}

// PUT /api/app-settings - Update or create a setting
export async function PUT(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const body = await request.json();
    const { key, value, description, category } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Setting key is required" },
        { status: 400 }
      );
    }

    // Upsert the setting (create if doesn't exist, update if it does)
    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: {
        value,
        description,
        category,
      },
      create: {
        key,
        value,
        description,
        category: category || "general",
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Error updating app setting:", error);
    return NextResponse.json(
      { error: "Failed to update app setting" },
      { status: 500 }
    );
  }
}

// DELETE /api/app-settings?key=<key> - Delete a specific setting
export async function DELETE(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Setting key is required" },
        { status: 400 }
      );
    }

    await prisma.appSetting.delete({
      where: { key },
    });

    return NextResponse.json({ message: "Setting deleted successfully" });
  } catch (error) {
    console.error("Error deleting app setting:", error);
    return NextResponse.json(
      { error: "Failed to delete app setting" },
      { status: 500 }
    );
  }
}
