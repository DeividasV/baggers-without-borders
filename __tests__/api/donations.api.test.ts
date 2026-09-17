/* eslint-disable */
/**
 * Donations API Tests
 * Tests for /api/donations/checkout endpoint including validation and rate limiting
 */

import { NextRequest, NextResponse } from "next/server";
import { SITE_NAME } from "@/src/config/site";

// Clear the global prisma singleton before mocking
const globalForPrisma = globalThis as unknown as { prisma: any };
delete globalForPrisma.prisma;

// Mock dependencies
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    donation: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/src/lib/stripe", () => ({
  stripe: {
    prices: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock("@/src/lib/api-auth", () => ({
  getOptionalSession: jest.fn(),
}));

jest.mock("@/src/lib/rateLimit", () => ({
  checkRateLimit: jest.fn(),
}));

// Import after mocking
import { prisma } from "@/src/lib/prisma";
import { stripe } from "@/src/lib/stripe";
import { getOptionalSession } from "@/src/lib/api-auth";
import { checkRateLimit } from "@/src/lib/rateLimit";
import { POST } from "@/app/api/donations/checkout/route";

describe("Donations API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
    (getOptionalSession as jest.Mock).mockResolvedValue(null);
  });

  describe("POST /api/donations/checkout", () => {
    const validPayload = {
      amount: 50,
      currency: "USD",
      type: "ONE_TIME",
      donorEmail: "donor@example.com",
      donorName: "Test Donor",
    };

    it("should reject when rate limit exceeded", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.1",
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe(
        "Too many donation attempts. Please wait 15 minutes before trying again."
      );
      expect(checkRateLimit).toHaveBeenCalledWith("192.168.1.1", "donation-checkout");
    });

    it("should reject invalid donation amount (too low)", async () => {
      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify({ ...validPayload, amount: 0.5 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Donation amount must be between");
    });

    it("should reject invalid donation amount (too high)", async () => {
      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify({ ...validPayload, amount: 10001 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Maximum donation amount");
    });

    it("should reject invalid currency", async () => {
      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify({ ...validPayload, currency: "JPY" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid currency (must be USD, EUR, or GBP)");
    });

    it("should reject invalid donation type", async () => {
      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify({ ...validPayload, type: "YEARLY" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid donation type (must be ONE_TIME or MONTHLY)");
    });

    it("should reject invalid email", async () => {
      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify({
          ...validPayload,
          donorEmail: "invalid-email",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Valid email address is required");
    });

    it("should create checkout session for one-time donation", async () => {
      const mockPrice = { id: "price_123" };
      const mockSession = {
        id: "cs_123",
        url: "https://checkout.stripe.com/pay/cs_123",
      };

      (stripe.prices.create as jest.Mock).mockResolvedValue(mockPrice);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);
      (prisma.donation.create as jest.Mock).mockResolvedValue({
        id: "donation-123",
      });

      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe("cs_123");
      expect(data.url).toBe("https://checkout.stripe.com/pay/cs_123");

      // Verify Stripe price creation
      expect(stripe.prices.create).toHaveBeenCalledWith({
        unit_amount: 5000, // 50 * 100
        currency: "usd",
        product_data: {
          name: `${SITE_NAME} donation`,
        },
      });

      // Verify Stripe session creation
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price: "price_123", quantity: 1 }],
        success_url: expect.stringContaining("/donate/success"),
        cancel_url: expect.stringContaining("/donate/cancelled"),
        customer_email: "donor@example.com",
        metadata: {
          userId: "",
          donorName: "Test Donor",
          donorEmail: "donor@example.com",
          donationType: "ONE_TIME",
        },
      });

      // Verify database record
      expect(prisma.donation.create).toHaveBeenCalledWith({
        data: {
          amount: 5000,
          currency: "USD",
          type: "ONE_TIME",
          status: "PENDING",
          stripeSessionId: "cs_123",
          userId: null,
          donorEmail: "donor@example.com",
          donorName: "Test Donor",
        },
      });
    });

    it("should create checkout session for monthly donation", async () => {
      const mockPrice = { id: "price_monthly_123" };
      const mockSession = {
        id: "cs_monthly_123",
        url: "https://checkout.stripe.com/pay/cs_monthly_123",
      };

      (stripe.prices.create as jest.Mock).mockResolvedValue(mockPrice);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);
      (prisma.donation.create as jest.Mock).mockResolvedValue({
        id: "donation-monthly-123",
      });

      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify({ ...validPayload, type: "MONTHLY" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify recurring interval
      expect(stripe.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recurring: { interval: "month" },
        })
      );

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "subscription",
        })
      );
    });

    it("should include returnTo parameter in URLs", async () => {
      const mockPrice = { id: "price_123" };
      const mockSession = {
        id: "cs_123",
        url: "https://checkout.stripe.com/pay/cs_123",
      };

      (stripe.prices.create as jest.Mock).mockResolvedValue(mockPrice);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);
      (prisma.donation.create as jest.Mock).mockResolvedValue({
        id: "donation-123",
      });

      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify({ ...validPayload, returnTo: "/profile" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining("returnTo=%2Fprofile"),
          cancel_url: expect.stringContaining("returnTo=%2Fprofile"),
        })
      );
    });

    it("should associate donation with authenticated user", async () => {
      (getOptionalSession as jest.Mock).mockResolvedValue({
        user: { id: "user-123", email: "user@example.com" },
      });

      const mockPrice = { id: "price_123" };
      const mockSession = {
        id: "cs_123",
        url: "https://checkout.stripe.com/pay/cs_123",
      };

      (stripe.prices.create as jest.Mock).mockResolvedValue(mockPrice);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);
      (prisma.donation.create as jest.Mock).mockResolvedValue({
        id: "donation-123",
      });

      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      expect(prisma.donation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
        }),
      });

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: "user-123",
          }),
        })
      );
    });

    it("should handle Stripe API errors gracefully", async () => {
      (stripe.prices.create as jest.Mock).mockRejectedValue(new Error("Stripe API error"));

      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Stripe API error");
    });

    it("should handle database errors gracefully", async () => {
      const mockPrice = { id: "price_123" };
      const mockSession = {
        id: "cs_123",
        url: "https://checkout.stripe.com/pay/cs_123",
      };

      (stripe.prices.create as jest.Mock).mockResolvedValue(mockPrice);
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);
      (prisma.donation.create as jest.Mock).mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database error");
    });

    it("should use correct IP from x-forwarded-for header", async () => {
      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        headers: {
          "x-forwarded-for": "203.0.113.1, 198.51.100.1",
        },
        body: JSON.stringify(validPayload),
      });

      (stripe.prices.create as jest.Mock).mockResolvedValue({
        id: "price_123",
      });
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        id: "cs_123",
        url: "https://checkout.stripe.com",
      });
      (prisma.donation.create as jest.Mock).mockResolvedValue({
        id: "donation-123",
      });

      await POST(request);

      expect(checkRateLimit).toHaveBeenCalledWith("203.0.113.1", "donation-checkout");
    });

    it("should handle missing x-forwarded-for header", async () => {
      const request = new NextRequest("http://localhost:3000/api/donations/checkout", {
        method: "POST",
        headers: {
          "x-real-ip": "198.51.100.1",
        },
        body: JSON.stringify(validPayload),
      });

      (stripe.prices.create as jest.Mock).mockResolvedValue({
        id: "price_123",
      });
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        id: "cs_123",
        url: "https://checkout.stripe.com",
      });
      (prisma.donation.create as jest.Mock).mockResolvedValue({
        id: "donation-123",
      });

      await POST(request);

      expect(checkRateLimit).toHaveBeenCalledWith("198.51.100.1", "donation-checkout");
    });
  });
});
