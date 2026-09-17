/**
 * E2E API Test: Consent Types Endpoint
 *
 * Tests validation logic and request/response format for consent type management.
 * Tests the handler logic assuming middleware auth has passed.
 */

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/consent-types/route";
import { getTestDb, cleanTestDb } from "../../utils/test-db-setup";

describe("E2E API: Consent Types", () => {
  let db: ReturnType<typeof getTestDb>;

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
  });

  describe("POST /api/consent-types - Validation", () => {
    it("should validate required fields", async () => {
      const invalidData = {
        internalNotes: "Some notes",
        // missing title and description
      };

      const request = new NextRequest(
        "http://localhost:3000/api/consent-types",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invalidData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error).toContain("required");
    });

    it("should validate title field is provided", async () => {
      const invalidData = {
        description: "Test description",
        // missing title
      };

      const request = new NextRequest(
        "http://localhost:3000/api/consent-types",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should validate description field is provided", async () => {
      const invalidData = {
        title: "Test Consent",
        // missing description
      };

      const request = new NextRequest(
        "http://localhost:3000/api/consent-types",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should validate status enum values", async () => {
      const invalidData = {
        title: "Test Consent",
        description: "Test description",
        status: "INVALID_STATUS",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/consent-types",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid status");
    });

    it("should accept ACTIVE status", async () => {
      const validData = {
        title: "Test Consent",
        description: "Test description",
        status: "ACTIVE",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/consent-types",
        {
          method: "POST",
          body: JSON.stringify(validData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe("ACTIVE");
    });

    it("should accept INACTIVE status", async () => {
      const validData = {
        title: "Test Consent",
        description: "Test description",
        status: "INACTIVE",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/consent-types",
        {
          method: "POST",
          body: JSON.stringify(validData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe("INACTIVE");
    });

    it("should accept valid consent type creation data", async () => {
      const validData = {
        title: "Privacy Policy",
        description: "User agrees to privacy policy",
        internalNotes: "Added in Q4 2024",
        status: "ACTIVE",
        dateIntroduced: "2024-01-01",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/consent-types",
        {
          method: "POST",
          body: JSON.stringify(validData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("id");
      expect(data.title).toBe("Privacy Policy");
      expect(data.description).toBe("User agrees to privacy policy");
      expect(data.status).toBe("ACTIVE");
    });

    it("should apply default values when not provided", async () => {
      const minimalData = {
        title: "Terms of Service",
        description: "User agrees to terms of service",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/consent-types",
        {
          method: "POST",
          body: JSON.stringify(minimalData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe("ACTIVE");
      expect(data).toHaveProperty("dateIntroduced");
      expect(data.internalNotes).toBeNull();
    });

    it("should set dateIntroduced to current date when not provided", async () => {
      const data = {
        title: "Cookie Policy",
        description: "User agrees to cookie policy",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/consent-types",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.dateIntroduced).toBeDefined();
      const introducedDate = new Date(result.dateIntroduced);
      const now = new Date();
      const diffInHours =
        Math.abs(now.getTime() - introducedDate.getTime()) / 36e5;
      expect(diffInHours).toBeLessThan(1); // Within 1 hour
    });
  });

  describe("GET /api/consent-types - Request handling", () => {
    beforeEach(async () => {
      // Create test consent types
      await db.consentType.createMany({
        data: [
          {
            title: "Privacy Policy",
            description: "Privacy policy consent",
            status: "ACTIVE",
            dateIntroduced: new Date("2024-01-01"),
          },
          {
            title: "Terms of Service",
            description: "Terms of service consent",
            status: "ACTIVE",
            dateIntroduced: new Date("2024-02-01"),
          },
          {
            title: "Old Policy",
            description: "Deprecated policy",
            status: "INACTIVE",
            dateIntroduced: new Date("2023-01-01"),
          },
        ],
      });
    });

    it("should return all consent types when no filter applied", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/consent-types"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("consentTypes");
      expect(Array.isArray(data.consentTypes)).toBe(true);
      expect(data.consentTypes.length).toBeGreaterThanOrEqual(3);
    });

    it("should filter by status parameter", async () => {
      const url = new URL("http://localhost:3000/api/consent-types");
      url.searchParams.set("status", "ACTIVE");

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consentTypes.length).toBeGreaterThanOrEqual(2);
      expect(data.consentTypes.every((ct: any) => ct.status === "ACTIVE")).toBe(
        true
      );
    });

    it("should return consent types ordered by dateIntroduced desc", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/consent-types"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const dates = data.consentTypes.map((ct: any) =>
        new Date(ct.dateIntroduced).getTime()
      );
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it("should include attachments and counts in response", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/consent-types"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const consentType = data.consentTypes[0];
      expect(consentType).toHaveProperty("attachments");
      expect(consentType).toHaveProperty("_count");
      expect(consentType._count).toHaveProperty("attachments");
      expect(consentType._count).toHaveProperty("userConsents");
    });

    it("should return consistent consent type object structure", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/consent-types"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const consentType = data.consentTypes[0];
      expect(consentType).toHaveProperty("id");
      expect(consentType).toHaveProperty("title");
      expect(consentType).toHaveProperty("description");
      expect(consentType).toHaveProperty("status");
      expect(consentType).toHaveProperty("dateIntroduced");
      expect(typeof consentType.title).toBe("string");
      expect(typeof consentType.description).toBe("string");
    });
  });
});
