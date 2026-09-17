/**
 * Unit tests for support request validation utility
 */

import {
  validateSupportRequest,
  type SupportRequestData,
} from "@/src/utils/supportRequestValidation";

describe("validateSupportRequest", () => {
  const validData: SupportRequestData = {
    name: "John Doe",
    email: "john@example.com",
    subject: "Test Subject",
    message: "Test message content",
    category: "GENERAL",
  };

  describe("name validation", () => {
    it("rejects empty name", () => {
      const result = validateSupportRequest({ ...validData, name: "" });
      expect(result).toEqual({
        valid: false,
        error: "Please provide your name",
      });
    });

    it("rejects whitespace-only name", () => {
      const result = validateSupportRequest({ ...validData, name: "   " });
      expect(result).toEqual({
        valid: false,
        error: "Please provide your name",
      });
    });

    it("accepts valid name", () => {
      const result = validateSupportRequest({ ...validData, name: "John Doe" });
      expect(result.valid).toBe(true);
    });
  });

  describe("email validation", () => {
    it("rejects empty email", () => {
      const result = validateSupportRequest({ ...validData, email: "" });
      expect(result).toEqual({
        valid: false,
        error: "Please provide your email address",
      });
    });

    it("rejects whitespace-only email", () => {
      const result = validateSupportRequest({ ...validData, email: "   " });
      expect(result).toEqual({
        valid: false,
        error: "Please provide your email address",
      });
    });

    it("rejects invalid email format - no @", () => {
      const result = validateSupportRequest({
        ...validData,
        email: "invalidemail",
      });
      expect(result).toEqual({
        valid: false,
        error: "Please provide a valid email address",
      });
    });

    it("rejects invalid email format - no domain", () => {
      const result = validateSupportRequest({
        ...validData,
        email: "test@",
      });
      expect(result).toEqual({
        valid: false,
        error: "Please provide a valid email address",
      });
    });

    it("rejects invalid email format - no TLD", () => {
      const result = validateSupportRequest({
        ...validData,
        email: "test@domain",
      });
      expect(result).toEqual({
        valid: false,
        error: "Please provide a valid email address",
      });
    });

    it("accepts valid email", () => {
      const result = validateSupportRequest({
        ...validData,
        email: "john@example.com",
      });
      expect(result.valid).toBe(true);
    });

    it("accepts valid email with subdomain", () => {
      const result = validateSupportRequest({
        ...validData,
        email: "john@mail.example.com",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("subject validation", () => {
    it("rejects empty subject", () => {
      const result = validateSupportRequest({ ...validData, subject: "" });
      expect(result).toEqual({
        valid: false,
        error: "Please provide a subject",
      });
    });

    it("rejects whitespace-only subject", () => {
      const result = validateSupportRequest({ ...validData, subject: "   " });
      expect(result).toEqual({
        valid: false,
        error: "Please provide a subject",
      });
    });

    it("accepts valid subject", () => {
      const result = validateSupportRequest({
        ...validData,
        subject: "Test Subject",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("message validation", () => {
    it("rejects empty message", () => {
      const result = validateSupportRequest({ ...validData, message: "" });
      expect(result).toEqual({
        valid: false,
        error: "Please provide a message",
      });
    });

    it("rejects whitespace-only message", () => {
      const result = validateSupportRequest({ ...validData, message: "   " });
      expect(result).toEqual({
        valid: false,
        error: "Please provide a message",
      });
    });

    it("accepts valid message", () => {
      const result = validateSupportRequest({
        ...validData,
        message: "This is a test message",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("HOF_DATA category validation", () => {
    it("requires hofId when category is HOF_DATA", () => {
      const result = validateSupportRequest({
        ...validData,
        category: "HOF_DATA",
        hofId: "",
      });
      expect(result).toEqual({
        valid: false,
        error: "Please select a Hall of Fame table",
      });
    });

    it("accepts HOF_DATA category with valid hofId", () => {
      const result = validateSupportRequest({
        ...validData,
        category: "HOF_DATA",
        hofId: "hof-123",
      });
      expect(result.valid).toBe(true);
    });

    it("does not require hofId for GENERAL category", () => {
      const result = validateSupportRequest({
        ...validData,
        category: "GENERAL",
        hofId: "",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("complete validation", () => {
    it("validates all fields correctly for valid data", () => {
      const result = validateSupportRequest(validData);
      expect(result).toEqual({ valid: true });
    });

    it("stops at first validation error", () => {
      const result = validateSupportRequest({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "GENERAL",
      });
      // Should return the first error (name)
      expect(result).toEqual({
        valid: false,
        error: "Please provide your name",
      });
    });

    it("validates multiline messages", () => {
      const result = validateSupportRequest({
        ...validData,
        message: "Line 1\nLine 2\nLine 3",
      });
      expect(result.valid).toBe(true);
    });

    it("validates messages with special characters", () => {
      const result = validateSupportRequest({
        ...validData,
        message: "Test with special chars: @#$%^&*()",
      });
      expect(result.valid).toBe(true);
    });
  });
});
