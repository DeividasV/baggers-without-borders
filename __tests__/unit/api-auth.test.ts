import { getServerSession } from "next-auth";

// Mock next-auth before any imports
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Now import the actual module
import {
  getSession,
  getCurrentUserId,
  isAdmin,
  getOptionalSession,
} from "@/src/lib/api-auth";

const mockSession = {
  user: { id: "1", email: "test@example.com", role: "ADMIN" },
};

describe("API Auth Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSession", () => {
    it("should return session if it exists", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await getSession();

      expect(result).toEqual(mockSession);
      expect(getServerSession).toHaveBeenCalled();
    });

    it("should throw error if session does not exist", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      await expect(getSession()).rejects.toThrow(
        "Session not found - middleware may not be configured correctly"
      );
    });

    it("should throw error if session user id is missing", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: {} });

      await expect(getSession()).rejects.toThrow(
        "Session not found - middleware may not be configured correctly"
      );
    });
  });

  describe("getCurrentUserId", () => {
    it("should return current user id", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await getCurrentUserId();

      expect(result).toBe("1");
    });

    it("should throw error if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      await expect(getCurrentUserId()).rejects.toThrow();
    });
  });

  describe("isAdmin", () => {
    it("should return true for admin user", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await isAdmin();

      expect(result).toBe(true);
    });

    it("should return false for non-admin user", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "1", email: "test@example.com", role: "USER" },
      });

      const result = await isAdmin();

      expect(result).toBe(false);
    });

    it("should throw error if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      await expect(isAdmin()).rejects.toThrow();
    });
  });

  describe("getOptionalSession", () => {
    it("should return session if it exists", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await getOptionalSession();

      expect(result).toEqual(mockSession);
    });

    it("should return null if session does not exist", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const result = await getOptionalSession();

      expect(result).toBeNull();
    });

    it("should return null if session user id is missing", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: {} });

      const result = await getOptionalSession();

      expect(result).toBeNull();
    });
  });
});
