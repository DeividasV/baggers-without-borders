/**
 * Unit tests for application constants
 *
 * Tests all exported constants to ensure they maintain expected values.
 */

import { SITE_NAME } from "@/src/config/site";
import {
  APP_NAME,
  APP_PORT,
  APP_VERSION,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  CHANGE_REQUEST_TYPES,
  PRIORITY_OPTIONS,
  IMPACT_OPTIONS,
  STATUS_OPTIONS,
  USER_ROLES,
  API_ENDPOINTS,
  NAV_TABS,
  UPLOAD_PATHS,
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from "@/src/lib/constants";

describe("Application Constants", () => {
  describe("Application Info", () => {
    it("should have correct app name", () => {
      expect(APP_NAME).toBe(SITE_NAME);
    });

    it("should have correct port (Ben Nevis height)", () => {
      expect(APP_PORT).toBe(1345);
    });

    it("should have version number", () => {
      expect(APP_VERSION).toBe("1.0.0");
    });
  });

  describe("File Upload Constants", () => {
    it("should have max file size of 10MB", () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
      expect(MAX_FILE_SIZE).toBe(10485760);
    });

    it("should allow common file types", () => {
      expect(ALLOWED_FILE_TYPES).toContain("image/jpeg");
      expect(ALLOWED_FILE_TYPES).toContain("image/png");
      expect(ALLOWED_FILE_TYPES).toContain("image/gif");
      expect(ALLOWED_FILE_TYPES).toContain("image/webp");
      expect(ALLOWED_FILE_TYPES).toContain("application/pdf");
      expect(ALLOWED_FILE_TYPES).toContain("text/plain");
    });

    it("should allow Microsoft Word documents", () => {
      expect(ALLOWED_FILE_TYPES).toContain("application/msword");
      expect(ALLOWED_FILE_TYPES).toContain(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    });
  });

  describe("Change Request Types", () => {
    it("should have all request types", () => {
      expect(CHANGE_REQUEST_TYPES).toHaveLength(5);
      expect(CHANGE_REQUEST_TYPES).toEqual([
        { value: "FEATURE", label: "Feature Request" },
        { value: "BUG", label: "Bug Report" },
        { value: "ENHANCEMENT", label: "Enhancement" },
        { value: "DOCUMENTATION", label: "Documentation" },
        { value: "OTHER", label: "Other" },
      ]);
    });
  });

  describe("Priority Options", () => {
    it("should have all priority levels with colors", () => {
      expect(PRIORITY_OPTIONS).toHaveLength(4);
      expect(PRIORITY_OPTIONS[0]).toEqual({
        value: "LOW",
        label: "Low",
        color: "text-green-600",
      });
      expect(PRIORITY_OPTIONS[3]).toEqual({
        value: "CRITICAL",
        label: "Critical",
        color: "text-red-600",
      });
    });
  });

  describe("Impact Options", () => {
    it("should have all impact levels with colors", () => {
      expect(IMPACT_OPTIONS).toHaveLength(3);
      expect(IMPACT_OPTIONS[0]).toEqual({
        value: "LOW",
        label: "Low",
        color: "text-green-600",
      });
      expect(IMPACT_OPTIONS[2]).toEqual({
        value: "HIGH",
        label: "High",
        color: "text-red-600",
      });
    });
  });

  describe("Status Options", () => {
    it("should have all status types with colors", () => {
      expect(STATUS_OPTIONS).toHaveLength(5);
      expect(STATUS_OPTIONS).toContainEqual({
        value: "PENDING",
        label: "Pending",
        color: "text-gray-600",
      });
      expect(STATUS_OPTIONS).toContainEqual({
        value: "COMPLETED",
        label: "Completed",
        color: "text-purple-600",
      });
    });
  });

  describe("User Roles", () => {
    it("should have admin and user roles", () => {
      expect(USER_ROLES.ADMIN).toBe("ADMIN");
      expect(USER_ROLES.USER).toBe("USER");
      // USER_ROLES is a const object, TypeScript enforces immutability
    });
  });

  describe("Demo credentials", () => {
    it("should not hardcode credentials in shipped constants", () => {
      // Regression guard: a DEMO_USERS list with real usernames and a shared
      // password used to live in src/lib/constants.ts and was published.
      // Demo accounts are seeded by scripts/seed/seed-demo-users.js instead.
      const constants = require("@/src/lib/constants");
      expect(constants.DEMO_USERS).toBeUndefined();
    });
  });

  describe("API Endpoints", () => {
    it("should have all main endpoints", () => {
      expect(API_ENDPOINTS.AUTH).toBe("/api/auth");
      expect(API_ENDPOINTS.USERS).toBe("/api/users");
      expect(API_ENDPOINTS.CHANGE_REQUESTS).toBe("/api/change-requests");
      expect(API_ENDPOINTS.ATTACHMENTS).toBe("/attachments");
    });
  });

  describe("Navigation Tabs", () => {
    it("should have all tab identifiers", () => {
      expect(NAV_TABS.DASHBOARD).toBe("dashboard");
      expect(NAV_TABS.USERS).toBe("users");
      expect(NAV_TABS.CHANGE_REQUESTS).toBe("change-requests");
    });
  });

  describe("Upload Paths", () => {
    it("should have change request upload path", () => {
      expect(UPLOAD_PATHS.CHANGE_REQUESTS).toBe("/uploads/change-requests/");
    });
  });

  describe("Validation Messages", () => {
    it("should have all validation messages", () => {
      expect(VALIDATION_MESSAGES.REQUIRED_FIELD).toBe("This field is required.");
      expect(VALIDATION_MESSAGES.INVALID_EMAIL).toBe("Please enter a valid email address.");
      expect(VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH).toBe(
        "Password must be at least 8 characters."
      );
      expect(VALIDATION_MESSAGES.FILE_TOO_LARGE).toBe("File size must be less than 10MB.");
      expect(VALIDATION_MESSAGES.INVALID_FILE_TYPE).toBe("File type not supported.");
    });
  });

  describe("Success Messages", () => {
    it("should have user operation messages", () => {
      expect(SUCCESS_MESSAGES.USER_CREATED).toBe("User created.");
      expect(SUCCESS_MESSAGES.USER_UPDATED).toBe("User updated.");
      expect(SUCCESS_MESSAGES.USER_DELETED).toBe("User deleted.");
    });

    it("should have change request messages", () => {
      expect(SUCCESS_MESSAGES.CHANGE_REQUEST_CREATED).toBe("Change request created.");
      expect(SUCCESS_MESSAGES.CHANGE_REQUEST_UPDATED).toBe("Change request updated.");
      expect(SUCCESS_MESSAGES.CHANGE_REQUEST_DELETED).toBe("Change request deleted.");
    });

    it("should have file operation messages", () => {
      expect(SUCCESS_MESSAGES.FILE_UPLOADED).toBe("File uploaded.");
      expect(SUCCESS_MESSAGES.FILE_DELETED).toBe("File deleted.");
    });
  });

  describe("Error Messages", () => {
    it("should have all error messages", () => {
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBe("You don't have permission to access this feature.");
      expect(ERROR_MESSAGES.USER_NOT_FOUND).toBe("User not found.");
      expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toBe(
        "Incorrect email/username or password. Check your credentials and try again."
      );
      expect(ERROR_MESSAGES.CHANGE_REQUEST_NOT_FOUND).toBe("Change request not found.");
      expect(ERROR_MESSAGES.FILE_UPLOAD_FAILED).toBe(
        "Couldn't upload file. Check the file size (max 10MB) and format, then try again."
      );
      expect(ERROR_MESSAGES.GENERIC_ERROR).toBe(
        "Something went wrong. Please try again or contact support if the problem continues."
      );
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBe(
        "Unable to connect. Check your connection and try again."
      );
    });
  });
});
