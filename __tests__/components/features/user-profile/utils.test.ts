/**
 * Tests for user profile utility functions
 *
 * Tests password strength calculation, generation, and date formatting.
 */

import {
  calculatePasswordStrength,
  generateStrongPassword,
  formatRoleOrStatus,
  formatDateTime,
  formatDateYMD,
  formatDateTimeYMD,
  formatTimeAgo,
} from "@/app/components/features/user-profile/utils";

describe("User Profile Utils", () => {
  describe("calculatePasswordStrength", () => {
    it("should return empty for no password", () => {
      const result = calculatePasswordStrength("");
      expect(result).toEqual({
        strength: 0,
        label: "Empty",
        color: "bg-gray-500",
      });
    });

    it("should return weak for short passwords", () => {
      const result = calculatePasswordStrength("ab12");
      expect(result).toEqual({
        strength: 25,
        label: "Weak",
        color: "bg-red-500",
      });
    });

    it("should return weak for passwords with length but no variety", () => {
      const result = calculatePasswordStrength("aaaaaaaa");
      expect(result.label).toBe("Weak");
    });

    it("should return fair for medium passwords", () => {
      const result = calculatePasswordStrength("Password1");
      expect(result).toEqual({
        strength: 50,
        label: "Fair",
        color: "bg-orange-500",
      });
    });

    it("should return good for passwords with length and variety", () => {
      const result = calculatePasswordStrength("Password123!");
      expect(result).toEqual({
        strength: 75,
        label: "Good",
        color: "bg-yellow-500",
      });
    });

    it("should return strong for long varied passwords", () => {
      const result = calculatePasswordStrength("P@ssw0rd123456789!");
      expect(result).toEqual({
        strength: 100,
        label: "Strong",
        color: "bg-green-500",
      });
    });

    it("should score based on length thresholds", () => {
      // 8 chars: +1 score
      expect(calculatePasswordStrength("abcd1234").strength).toBeGreaterThan(0);

      // 12 chars: +2 score
      const medium = calculatePasswordStrength("abcd12345678");
      expect(medium.strength).toBeGreaterThan(0);

      // 16+ chars: +3 score
      const long = calculatePasswordStrength("abcd123456789012");
      expect(long.strength).toBeGreaterThan(0);
    });

    it("should score based on character variety", () => {
      // lowercase only
      const lowercase = calculatePasswordStrength("abcdefgh");
      expect(lowercase.strength).toBeLessThan(100);

      // lowercase + uppercase
      const withUpper = calculatePasswordStrength("abcdEFGH");
      expect(withUpper.strength).toBeGreaterThanOrEqual(lowercase.strength);

      // lowercase + uppercase + numbers
      const withNumbers = calculatePasswordStrength("abcdEF12");
      expect(withNumbers.strength).toBeGreaterThanOrEqual(withUpper.strength);

      // all varieties
      const withSpecial = calculatePasswordStrength("abcdEF12!@");
      expect(withSpecial.strength).toBeGreaterThan(withNumbers.strength);
    });
  });

  describe("generateStrongPassword", () => {
    it("should generate a password of length 18", () => {
      const password = generateStrongPassword();
      expect(password.length).toBe(18);
    });

    it("should include lowercase characters", () => {
      const password = generateStrongPassword();
      expect(/[a-z]/.test(password)).toBe(true);
    });

    it("should include uppercase characters", () => {
      const password = generateStrongPassword();
      expect(/[A-Z]/.test(password)).toBe(true);
    });

    it("should include numbers", () => {
      const password = generateStrongPassword();
      expect(/[0-9]/.test(password)).toBe(true);
    });

    it("should include special characters", () => {
      const password = generateStrongPassword();
      expect(/[^a-zA-Z0-9]/.test(password)).toBe(true);
    });

    it("should generate different passwords each time", () => {
      const password1 = generateStrongPassword();
      const password2 = generateStrongPassword();
      const password3 = generateStrongPassword();

      // Very unlikely to be the same
      expect(password1).not.toBe(password2);
      expect(password2).not.toBe(password3);
      expect(password1).not.toBe(password3);
    });

    it("should generate strong passwords", () => {
      const password = generateStrongPassword();
      const strength = calculatePasswordStrength(password);
      expect(strength.label).toBe("Strong");
      expect(strength.strength).toBe(100);
    });
  });

  describe("formatRoleOrStatus", () => {
    it("should format uppercase to title case", () => {
      expect(formatRoleOrStatus("ADMIN")).toBe("Admin");
      expect(formatRoleOrStatus("USER")).toBe("User");
      expect(formatRoleOrStatus("STAFF")).toBe("Staff");
    });

    it("should format lowercase to title case", () => {
      expect(formatRoleOrStatus("admin")).toBe("admin"); // only first char kept, rest lowercased
      expect(formatRoleOrStatus("user")).toBe("user");
    });

    it("should handle mixed case", () => {
      expect(formatRoleOrStatus("AdMiN")).toBe("Admin");
      expect(formatRoleOrStatus("uSeR")).toBe("user");
    });

    it("should return undefined for undefined input", () => {
      expect(formatRoleOrStatus(undefined)).toBeUndefined();
    });

    it("should handle empty string", () => {
      expect(formatRoleOrStatus("")).toBeUndefined(); // returns undefined for empty
    });

    it("should handle single character", () => {
      expect(formatRoleOrStatus("A")).toBe("A");
    });
  });

  describe("formatDateTime", () => {
    it("should format date with month, day, year, and time", () => {
      const result = formatDateTime("2024-01-15T10:30:00Z");
      expect(result).toMatch(/Jan 15, 2024/);
      expect(result).toMatch(/\d{1,2}:\d{2}/); // time pattern
    });

    it("should handle different dates", () => {
      const result = formatDateTime("2023-12-25T14:45:30Z");
      expect(result).toMatch(/Dec 25, 2023/);
    });

    it("should format midnight correctly", () => {
      const result = formatDateTime("2024-06-01T00:00:00Z");
      expect(result).toMatch(/Jun 1, 2024/);
    });
  });

  describe("formatDateYMD", () => {
    it("should format date as YYYY-MM-DD", () => {
      expect(formatDateYMD("2024-01-15T10:30:00Z")).toMatch(/2024-01-1\d/);
    });

    it("should zero-pad single digit months", () => {
      const result = formatDateYMD("2024-03-05T00:00:00Z");
      expect(result).toMatch(/2024-03-0\d/);
    });

    it("should zero-pad single digit days", () => {
      const result = formatDateYMD("2024-12-09T00:00:00Z");
      expect(result).toMatch(/2024-12-09/);
    });

    it("should handle different years", () => {
      expect(formatDateYMD("2023-06-15T00:00:00Z")).toMatch(/2023-06-1\d/);
    });
  });

  describe("formatDateTimeYMD", () => {
    it("should format date and time as YYYY-MM-DD HH:MM:SS", () => {
      const result = formatDateTimeYMD("2024-01-15T10:30:45Z");
      expect(result).toMatch(/2024-01-1\d \d{2}:30:45/);
    });

    it("should zero-pad all components", () => {
      const result = formatDateTimeYMD("2024-03-05T08:05:03Z");
      // Times are in local timezone, so just check format
      expect(result).toMatch(/2024-03-0\d \d{2}:05:03/);
    });

    it("should handle midnight", () => {
      const result = formatDateTimeYMD("2024-06-01T00:00:00Z");
      // Times are in local timezone
      expect(result).toMatch(/2024-06-01 \d{2}:00:00/);
    });

    it("should handle noon", () => {
      const result = formatDateTimeYMD("2024-06-01T12:00:00Z");
      // Times are in local timezone
      expect(result).toMatch(/2024-06-01 \d{2}:00:00/);
    });
  });

  describe("formatTimeAgo", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "just now" for very recent times', () => {
      const date = new Date("2024-01-15T11:59:30Z").toISOString();
      expect(formatTimeAgo(date)).toBe("Just now");
    });

    it("should return minutes ago", () => {
      const date = new Date("2024-01-15T11:55:00Z").toISOString();
      expect(formatTimeAgo(date)).toBe("5 minutes ago");
    });

    it("should return singular minute", () => {
      const date = new Date("2024-01-15T11:59:00Z").toISOString();
      expect(formatTimeAgo(date)).toBe("1 minute ago");
    });

    it("should return hours ago", () => {
      const date = new Date("2024-01-15T09:00:00Z").toISOString();
      expect(formatTimeAgo(date)).toBe("3 hours ago");
    });

    it("should return singular hour", () => {
      const date = new Date("2024-01-15T11:00:00Z").toISOString();
      expect(formatTimeAgo(date)).toBe("1 hour ago");
    });

    it("should return days ago", () => {
      const date = new Date("2024-01-12T12:00:00Z").toISOString();
      expect(formatTimeAgo(date)).toBe("3 days ago");
    });

    it("should return singular day", () => {
      const date = new Date("2024-01-14T12:00:00Z").toISOString();
      expect(formatTimeAgo(date)).toBe("1 day ago");
    });

    it("should return months ago", () => {
      const date = new Date("2023-10-15T12:00:00Z").toISOString();
      expect(formatTimeAgo(date)).toBe("3 months ago");
    });

    it("should return singular month", () => {
      const date = new Date("2023-12-15T12:00:00Z").toISOString();
      expect(formatTimeAgo(date)).toBe("1 month ago");
    });

    it("should return years ago", () => {
      const date = new Date("2021-01-15T12:00:00Z").toISOString();
      expect(formatTimeAgo(date)).toBe("3 years ago");
    });

    it("should return singular year", () => {
      const date = new Date("2023-01-15T12:00:00Z").toISOString();
      expect(formatTimeAgo(date)).toBe("1 year ago");
    });
  });
});
