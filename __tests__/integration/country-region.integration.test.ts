/**
 * Integration Test: Country and Region Data Management
 *
 * Tests complete country and region workflows including:
 * - Country data retrieval and filtering
 * - Region hierarchies and relationships
 * - Continental grouping
 * - Data integrity across relationships
 */

import { getTestDb, cleanTestDb } from "../utils/test-db-setup";
import {
  createBaseTestData,
  TestDataContext,
} from "../utils/test-data-factory";

describe("Integration: Country and Region Management", () => {
  let db: ReturnType<typeof getTestDb>;
  let testData: TestDataContext;

  beforeAll(async () => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
    testData = await createBaseTestData(db);
  });

  describe("Country Data Management", () => {
    it("should retrieve all countries with metadata", async () => {
      const countries = await db.country.findMany({
        orderBy: { name: "asc" },
      });

      expect(countries.length).toBeGreaterThan(0);
      expect(countries[0].code).toBeDefined();
      expect(countries[0].name).toBeDefined();
      expect(countries[0].continent).toBeDefined();
    });

    it("should retrieve country by ISO code", async () => {
      const uk = await db.country.findUnique({
        where: { code: "GB" },
      });

      expect(uk).toBeDefined();
      expect(uk?.name).toBe("United Kingdom");
      expect(uk?.code3).toBe("GBR");
    });

    it("should retrieve country by ISO3 code", async () => {
      const usa = await db.country.findUnique({
        where: { code3: "USA" },
      });

      expect(usa).toBeDefined();
      expect(usa?.name).toBe("United States");
      expect(usa?.code).toBe("US");
    });

    it("should filter countries by continent", async () => {
      const europeanCountries = await db.country.findMany({
        where: { continent: "Europe" },
        orderBy: { name: "asc" },
      });

      expect(europeanCountries.length).toBeGreaterThan(0);
      expect(europeanCountries.every((c) => c.continent === "Europe")).toBe(
        true
      );

      const ukIndex = europeanCountries.findIndex((c) => c.code === "GB");
      const franceIndex = europeanCountries.findIndex((c) => c.code === "FR");

      expect(ukIndex).toBeGreaterThan(-1);
      expect(franceIndex).toBeGreaterThan(-1);
    });

    it("should identify countries with regions", async () => {
      const countriesWithRegions = await db.country.findMany({
        where: { hasRegions: true },
      });

      expect(countriesWithRegions.length).toBeGreaterThan(0);
      expect(countriesWithRegions.every((c) => c.hasRegions === true)).toBe(
        true
      );
    });

    it("should group countries by continent", async () => {
      const countries = await db.country.findMany();

      const grouped = countries.reduce((acc, country) => {
        if (!acc[country.continent]) {
          acc[country.continent] = [];
        }
        acc[country.continent].push(country);
        return acc;
      }, {} as Record<string, typeof countries>);

      expect(Object.keys(grouped).length).toBeGreaterThan(0);
      expect(grouped["Europe"]).toBeDefined();
      expect(grouped["Europe"].length).toBeGreaterThan(0);
    });

    it("should retrieve country with all metadata fields", async () => {
      const country = await db.country.findFirst();

      expect(country).toHaveProperty("id");
      expect(country).toHaveProperty("code");
      expect(country).toHaveProperty("code3");
      expect(country).toHaveProperty("name");
      expect(country).toHaveProperty("continent");
      expect(country).toHaveProperty("hasRegions");
    });

    it("should search countries by name (case-insensitive)", async () => {
      const allCountries = await db.country.findMany();
      const searchTerm = "united";

      const results = allCountries.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.name === "United Kingdom")).toBe(true);
      expect(results.some((c) => c.name === "United States")).toBe(true);
    });
  });

  describe("Region Management", () => {
    it("should create regions for a country", async () => {
      const regions = await db.region.createMany({
        data: [
          {
            countryId: testData.countries.uk.id,
            code: "ENG",
            name: "England",
            type: "region",
          },
          {
            countryId: testData.countries.uk.id,
            code: "SCT",
            name: "Scotland",
            type: "region",
          },
          {
            countryId: testData.countries.uk.id,
            code: "WLS",
            name: "Wales",
            type: "region",
          },
          {
            countryId: testData.countries.uk.id,
            code: "NIR",
            name: "Northern Ireland",
            type: "region",
          },
        ],
      });

      expect(regions.count).toBe(4);

      const ukRegions = await db.region.findMany({
        where: { countryId: testData.countries.uk.id },
        orderBy: { name: "asc" },
      });

      expect(ukRegions).toHaveLength(4);
      expect(ukRegions.map((r) => r.name)).toContain("Scotland");
    });

    it("should retrieve regions for a country", async () => {
      await db.region.createMany({
        data: [
          {
            countryId: testData.countries.france.id,
            code: "IDF",
            name: "Île-de-France",
            type: "region",
          },
          {
            countryId: testData.countries.france.id,
            code: "ARA",
            name: "Auvergne-Rhône-Alpes",
            type: "region",
          },
        ],
      });

      const franceRegions = await db.region.findMany({
        where: { countryId: testData.countries.france.id },
      });

      expect(franceRegions).toHaveLength(2);
      expect(
        franceRegions.every((r) => r.countryId === testData.countries.france.id)
      ).toBe(true);
    });

    it("should retrieve region with country relationship", async () => {
      const region = await db.region.create({
        data: {
          countryId: testData.countries.uk.id,
          code: "SCT",
          name: "Scotland",
          type: "region",
        },
      });

      const regionWithCountry = await db.region.findUnique({
        where: { id: region.id },
        include: { country: true },
      });

      expect(regionWithCountry?.country.name).toBe("United Kingdom");
      expect(regionWithCountry?.country.code).toBe("GB");
    });

    it("should create multiple regions with different types for same country", async () => {
      await db.region.createMany({
        data: [
          {
            countryId: testData.countries.usa.id,
            code: "CA",
            name: "California",
            type: "state",
          },
          {
            countryId: testData.countries.usa.id,
            code: "TX",
            name: "Texas",
            type: "state",
          },
          {
            countryId: testData.countries.usa.id,
            code: "FL",
            name: "Florida",
            type: "state",
          },
        ],
      });

      const states = await db.region.findMany({
        where: {
          countryId: testData.countries.usa.id,
          type: "state",
        },
        orderBy: { name: "asc" },
      });

      expect(states).toHaveLength(3);
      expect(states.map((s) => s.name)).toEqual([
        "California",
        "Florida",
        "Texas",
      ]);
    });

    it("should retrieve region with country relationship", async () => {
      const texas = await db.region.create({
        data: {
          countryId: testData.countries.usa.id,
          code: "TX",
          name: "Texas",
          type: "state",
        },
      });

      const regionWithCountry = await db.region.findUnique({
        where: { id: texas.id },
        include: {
          country: true,
        },
      });

      expect(regionWithCountry?.country.name).toBe("United States");
      expect(regionWithCountry?.country.code).toBe("US");
    });

    it("should update region information", async () => {
      const region = await db.region.create({
        data: {
          countryId: testData.countries.uk.id,
          code: "OLD",
          name: "Old Name",
          type: "region",
        },
      });

      const updated = await db.region.update({
        where: { id: region.id },
        data: {
          code: "NEW",
          name: "New Name",
        },
      });

      expect(updated.code).toBe("NEW");
      expect(updated.name).toBe("New Name");
    });

    it("should delete region", async () => {
      const region = await db.region.create({
        data: {
          countryId: testData.countries.uk.id,
          code: "TMP",
          name: "Temporary Region",
          type: "region",
        },
      });

      await db.region.delete({ where: { id: region.id } });

      const found = await db.region.findUnique({
        where: { id: region.id },
      });

      expect(found).toBeNull();
    });

    it("should cascade delete regions when country is deleted", async () => {
      // Create a temporary country
      const tempCountry = await db.country.create({
        data: {
          code: "TMP",
          code3: "TMP",
          name: "Temporary Country",
          continent: "Europe",
          hasRegions: true,
        },
      });

      await db.region.createMany({
        data: [
          {
            countryId: tempCountry.id,
            code: "RG1",
            name: "Region 1",
            type: "region",
          },
          {
            countryId: tempCountry.id,
            code: "RG2",
            name: "Region 2",
            type: "region",
          },
        ],
      });

      let regions = await db.region.findMany({
        where: { countryId: tempCountry.id },
      });
      expect(regions).toHaveLength(2);

      // Delete country - should cascade delete regions
      await db.country.delete({ where: { id: tempCountry.id } });

      regions = await db.region.findMany({
        where: { countryId: tempCountry.id },
      });
      expect(regions).toHaveLength(0);
    });

    it("should filter regions by type", async () => {
      await db.region.createMany({
        data: [
          {
            countryId: testData.countries.usa.id,
            code: "ST1",
            name: "State 1",
            type: "state",
          },
          {
            countryId: testData.countries.usa.id,
            code: "ST2",
            name: "State 2",
            type: "state",
          },
          {
            countryId: testData.countries.uk.id,
            code: "RG1",
            name: "Region 1",
            type: "region",
          },
        ],
      });

      const states = await db.region.findMany({
        where: { type: "state" },
      });

      const regions = await db.region.findMany({
        where: { type: "region" },
      });

      expect(states).toHaveLength(2);
      expect(states.every((s) => s.type === "state")).toBe(true);
      expect(regions.every((r) => r.type === "region")).toBe(true);
    });
  });

  describe("Country-Region Relationships", () => {
    it("should retrieve country with all its regions", async () => {
      await db.region.createMany({
        data: [
          {
            countryId: testData.countries.uk.id,
            code: "ENG",
            name: "England",
            type: "region",
          },
          {
            countryId: testData.countries.uk.id,
            code: "SCT",
            name: "Scotland",
            type: "region",
          },
          {
            countryId: testData.countries.uk.id,
            code: "WLS",
            name: "Wales",
            type: "region",
          },
        ],
      });

      const ukWithRegions = await db.country.findUnique({
        where: { id: testData.countries.uk.id },
        include: {
          regions: {
            orderBy: { name: "asc" },
          },
        },
      });

      expect(ukWithRegions?.regions).toHaveLength(3);
      expect(ukWithRegions?.regions[0].name).toBe("England");
    });

    it("should count regions per country", async () => {
      await db.region.createMany({
        data: [
          {
            countryId: testData.countries.uk.id,
            code: "ENG",
            name: "England",
            type: "region",
          },
          {
            countryId: testData.countries.uk.id,
            code: "SCT",
            name: "Scotland",
            type: "region",
          },
          {
            countryId: testData.countries.france.id,
            code: "IDF",
            name: "Île-de-France",
            type: "region",
          },
        ],
      });

      const ukRegionCount = await db.region.count({
        where: { countryId: testData.countries.uk.id },
      });

      const franceRegionCount = await db.region.count({
        where: { countryId: testData.countries.france.id },
      });

      expect(ukRegionCount).toBe(2);
      expect(franceRegionCount).toBe(1);
    });

    it("should retrieve countries with region counts", async () => {
      await db.region.createMany({
        data: [
          {
            countryId: testData.countries.uk.id,
            code: "ENG",
            name: "England",
            type: "region",
          },
          {
            countryId: testData.countries.uk.id,
            code: "SCT",
            name: "Scotland",
            type: "region",
          },
          {
            countryId: testData.countries.france.id,
            code: "IDF",
            name: "Île-de-France",
            type: "region",
          },
        ],
      });

      const countries = await db.country.findMany({
        include: {
          _count: {
            select: { regions: true },
          },
        },
      });

      const uk = countries.find((c) => c.code === "GB");
      const france = countries.find((c) => c.code === "FR");

      expect(uk?._count.regions).toBe(2);
      expect(france?._count.regions).toBe(1);
    });

    it("should validate region belongs to correct country", async () => {
      const region = await db.region.create({
        data: {
          countryId: testData.countries.uk.id,
          code: "SCT",
          name: "Scotland",
          type: "region",
        },
      });

      const regionWithCountry = await db.region.findUnique({
        where: { id: region.id },
        include: { country: true },
      });

      expect(regionWithCountry?.countryId).toBe(testData.countries.uk.id);
      expect(regionWithCountry?.country.code).toBe("GB");
    });
  });

  describe("Data Integrity and Constraints", () => {
    it("should enforce unique country codes", async () => {
      const existingCode = testData.countries.uk.code;

      await expect(
        db.country.create({
          data: {
            code: existingCode,
            code3: "XXX",
            name: "Duplicate Country",
            continent: "Europe",
            hasRegions: false,
          },
        })
      ).rejects.toThrow();
    });

    it("should enforce unique region codes within country", async () => {
      await db.region.create({
        data: {
          countryId: testData.countries.uk.id,
          code: "SCT",
          name: "Scotland",
          type: "region",
        },
      });

      await expect(
        db.region.create({
          data: {
            countryId: testData.countries.uk.id,
            code: "SCT",
            name: "Scotland Duplicate",
            type: "region",
          },
        })
      ).rejects.toThrow();
    });

    it("should allow same region code in different countries", async () => {
      const region1 = await db.region.create({
        data: {
          countryId: testData.countries.uk.id,
          code: "NORTH",
          name: "Northern Region UK",
          type: "region",
        },
      });

      const region2 = await db.region.create({
        data: {
          countryId: testData.countries.france.id,
          code: "NORTH",
          name: "Northern Region FR",
          type: "region",
        },
      });

      expect(region1.code).toBe(region2.code);
      expect(region1.countryId).not.toBe(region2.countryId);
    });
  });
});
