import { prisma } from "../../src/lib/prisma";
import { getMeisterReportImagePath } from "../../src/lib/constants";

// These tests verify database schema and basic setup
// Full integration tests for file upload require running server
describe("HoF Meister Image API - Schema Validation", () => {
  let configId: string;
  let hofId: string;
  let yearId: string;

  beforeEach(async () => {
    // Create test data
    const uniqueCode = `test-hof-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;
    const hof = await prisma.hallOfFame.create({
      data: {
        code: uniqueCode,
        title: "Test HOF",
        displayOrder: 1,
        isActive: true,
      },
    });
    hofId = hof.id;

    const year = await prisma.year.create({
      data: {
        code: `2026-${uniqueCode}`,
        title: "2026",
        isActive: true,
        displayOrder: 1,
      },
    });
    yearId = year.id;

    const config = await prisma.hofYearConfig.create({
      data: {
        hofId: hof.id,
        yearId: year.id,
        minPeaks: 10,
      },
    });
    configId = config.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.hofYearConfig.deleteMany({ where: { id: configId } });
    await prisma.hallOfFame.deleteMany({ where: { id: hofId } });
    await prisma.year.deleteMany({ where: { id: yearId } });
  });

  it("should allow creating config without meister report fields", async () => {
    const config = await prisma.hofYearConfig.findUnique({
      where: { id: configId },
    });

    expect(config).toBeDefined();
    expect(config?.meisterReportContent).toBeNull();
    expect(config?.meisterReportImage).toBeNull();
    expect(config?.meisterReportImageTitle).toBeNull();
    expect(config?.meisterReportImageAttribution).toBeNull();
  });

  it("should allow updating config with meister report content", async () => {
    const updated = await prisma.hofYearConfig.update({
      where: { id: configId },
      data: {
        meisterReportContent: "# Test Report\n\nContent here.",
      },
    });

    expect(updated.meisterReportContent).toBe("# Test Report\n\nContent here.");
  });

  it("should allow updating config with meister report image fields", async () => {
    const updated = await prisma.hofYearConfig.update({
      where: { id: configId },
      data: {
        meisterReportImage: "/uploads/meister-reports/test.webp",
        meisterReportImageTitle: "Test Mountain",
        meisterReportImageAttribution: "Photo by Test User",
      },
    });

    expect(updated.meisterReportImage).toBe(
      "/uploads/meister-reports/test.webp"
    );
    expect(updated.meisterReportImageTitle).toBe("Test Mountain");
    expect(updated.meisterReportImageAttribution).toBe("Photo by Test User");
  });

  it("should generate correct image path for config", () => {
    const path = getMeisterReportImagePath(configId);
    expect(path).toContain(configId);
    expect(path).toContain(".webp");
  });
});
