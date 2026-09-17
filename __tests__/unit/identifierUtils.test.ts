/**
 * Unit tests for identifierUtils
 *
 * Tests email/username detection and Prisma where clause generation
 */

import {
  parseIdentifier,
  buildIdentifierWhereClause,
} from "@/src/lib/identifierUtils";

describe("identifierUtils", () => {
  describe("parseIdentifier", () => {
    it("should detect email addresses", () => {
      const result = parseIdentifier("user@example.com");
      expect(result).toEqual({
        identifier: "user@example.com",
        type: "email",
        normalized: "user@example.com",
      });
    });

    it("should detect email with uppercase", () => {
      const result = parseIdentifier("User@Example.COM");
      expect(result).toEqual({
        identifier: "User@Example.COM",
        type: "email",
        normalized: "user@example.com",
      });
    });

    it("should detect usernames without @", () => {
      const result = parseIdentifier("johndoe");
      expect(result).toEqual({
        identifier: "johndoe",
        type: "username",
        normalized: "johndoe",
      });
    });

    it("should detect usernames with uppercase", () => {
      const result = parseIdentifier("JohnDoe");
      expect(result).toEqual({
        identifier: "JohnDoe",
        type: "username",
        normalized: "johndoe",
      });
    });

    it("should handle usernames with hyphens", () => {
      const result = parseIdentifier("john-doe");
      expect(result).toEqual({
        identifier: "john-doe",
        type: "username",
        normalized: "john-doe",
      });
    });

    it("should handle usernames with underscores", () => {
      const result = parseIdentifier("john_doe");
      expect(result).toEqual({
        identifier: "john_doe",
        type: "username",
        normalized: "john_doe",
      });
    });

    it("should trim whitespace", () => {
      const result = parseIdentifier("  user@example.com  ");
      expect(result).toEqual({
        identifier: "  user@example.com  ",
        type: "email",
        normalized: "user@example.com",
      });
    });

    it("should handle empty string as username", () => {
      const result = parseIdentifier("");
      expect(result).toEqual({
        identifier: "",
        type: "username",
        normalized: "",
      });
    });
  });

  describe("buildIdentifierWhereClause", () => {
    it("should build email where clause for email addresses", () => {
      const result = buildIdentifierWhereClause("user@example.com");
      expect(result).toEqual({
        email: "user@example.com",
      });
    });

    it("should build email where clause with normalized email", () => {
      const result = buildIdentifierWhereClause("User@Example.COM");
      expect(result).toEqual({
        email: "user@example.com",
      });
    });

    it("should build username where clause for usernames", () => {
      const result = buildIdentifierWhereClause("johndoe");
      expect(result).toEqual({
        username: "johndoe",
      });
    });

    it("should build username where clause with normalized username", () => {
      const result = buildIdentifierWhereClause("JohnDoe");
      expect(result).toEqual({
        username: "johndoe",
      });
    });

    it("should trim whitespace in where clause", () => {
      const result = buildIdentifierWhereClause("  user@example.com  ");
      expect(result).toEqual({
        email: "user@example.com",
      });
    });

    it("should handle mixed case usernames", () => {
      const result = buildIdentifierWhereClause("John_Doe-123");
      expect(result).toEqual({
        username: "john_doe-123",
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle login with email", () => {
      const input = "Test.User@Example.COM";
      const parsed = parseIdentifier(input);
      const whereClause = buildIdentifierWhereClause(input);

      expect(parsed.type).toBe("email");
      expect(whereClause).toEqual({ email: "test.user@example.com" });
    });

    it("should handle login with username", () => {
      const input = "TestUser123";
      const parsed = parseIdentifier(input);
      const whereClause = buildIdentifierWhereClause(input);

      expect(parsed.type).toBe("username");
      expect(whereClause).toEqual({ username: "testuser123" });
    });

    it("should handle password reset with various formats", () => {
      const testCases = [
        { input: "admin@site.com", expected: { email: "admin@site.com" } },
        { input: "Admin@Site.COM", expected: { email: "admin@site.com" } },
        { input: "admin_user", expected: { username: "admin_user" } },
        { input: "Admin_User", expected: { username: "admin_user" } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = buildIdentifierWhereClause(input);
        expect(result).toEqual(expected);
      });
    });
  });
});
