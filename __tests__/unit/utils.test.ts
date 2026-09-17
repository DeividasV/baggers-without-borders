import {
  cn,
  formatFileSize,
  formatNumber,
  formatDateYMD,
  formatDateYM,
  formatDateTime,
  formatDateTimeYMD,
  formatTimeAgo,
  getBadgeVariant,
  getOptionColor,
  getOptionLabel,
  truncateText,
  isValidFileType,
  isValidFileSize,
  getFileExtension,
  isImageFile,
  getInitials,
  isAdmin,
  generateId,
  debounce,
  sleep,
  formatMinutesToHoursMinutes,
  parseHoursMinutesToMinutes,
  formatTimeInput,
} from "@/src/lib/utils";

describe("Utility Functions", () => {
  describe("cn (classNames)", () => {
    it("should merge class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });
  });

  describe("formatFileSize", () => {
    it("should format 0 bytes", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
    });

    it("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500 Bytes");
    });

    it("should format KB", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
    });

    it("should format MB", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1 MB");
    });

    it("should format GB", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("should format with decimals", () => {
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });
  });

  describe("formatNumber", () => {
    it("should format null as 0", () => {
      expect(formatNumber(null)).toBe("0");
    });

    it("should format undefined as 0", () => {
      expect(formatNumber(undefined)).toBe("0");
    });

    it("should format small numbers without separators", () => {
      expect(formatNumber(123)).toBe("123");
    });

    it("should format large numbers with non-breaking spaces", () => {
      expect(formatNumber(1234)).toBe("1\u00A0234");
    });

    it("should format very large numbers", () => {
      expect(formatNumber(1234567)).toBe("1\u00A0234\u00A0567");
    });

    it("should preserve decimals", () => {
      expect(formatNumber(1234.56)).toBe("1\u00A0234.56");
    });
  });

  describe("Date Formatting Functions", () => {
    const testDate = new Date("2024-03-15T14:30:45");

    describe("formatDateYMD", () => {
      it("should format date as YYYY-MM-DD", () => {
        expect(formatDateYMD(testDate)).toBe("2024-03-15");
      });

      it("should accept string dates", () => {
        expect(formatDateYMD("2024-03-15")).toBe("2024-03-15");
      });
    });

    describe("formatDateYM", () => {
      it("should format date as YYYY-MM", () => {
        expect(formatDateYM(testDate)).toBe("2024-03");
      });
    });

    describe("formatDateTime", () => {
      it("should format date as YYYY-MM-DD HH:mm", () => {
        expect(formatDateTime(testDate)).toBe("2024-03-15 14:30");
      });
    });

    describe("formatDateTimeYMD", () => {
      it("should format date as YYYY-MM-DD HH:mm:ss", () => {
        expect(formatDateTimeYMD(testDate)).toBe("2024-03-15 14:30:45");
      });
    });

    describe("formatTimeAgo", () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2024-03-15T14:30:00"));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should return "Just now" for very recent dates', () => {
        const date = new Date("2024-03-15T14:29:50");
        expect(formatTimeAgo(date)).toBe("Just now");
      });

      it("should format minutes ago", () => {
        const date = new Date("2024-03-15T14:25:00");
        expect(formatTimeAgo(date)).toBe("5 minutes ago");
      });

      it("should format hours ago", () => {
        const date = new Date("2024-03-15T12:30:00");
        expect(formatTimeAgo(date)).toBe("2 hours ago");
      });

      it("should format days ago", () => {
        const date = new Date("2024-03-13T14:30:00");
        expect(formatTimeAgo(date)).toBe("2 days ago");
      });

      it("should format months ago", () => {
        const date = new Date("2024-01-15T14:30:00");
        expect(formatTimeAgo(date)).toBe("2 months ago");
      });

      it("should format years ago", () => {
        const date = new Date("2022-03-15T14:30:00");
        expect(formatTimeAgo(date)).toBe("2 years ago");
      });
    });
  });

  describe("getBadgeVariant", () => {
    it("should return correct variant for type", () => {
      expect(getBadgeVariant("FEATURE", "type")).toBe("feature");
      expect(getBadgeVariant("BUG", "type")).toBe("bug");
      expect(getBadgeVariant("ENHANCEMENT", "type")).toBe("enhancement");
      expect(getBadgeVariant("DOCUMENTATION", "type")).toBe("info");
      expect(getBadgeVariant("OTHER", "type")).toBe("default");
    });

    it("should return correct variant for priority", () => {
      expect(getBadgeVariant("LOW", "priority")).toBe("success");
      expect(getBadgeVariant("MEDIUM", "priority")).toBe("warning");
      expect(getBadgeVariant("HIGH", "priority")).toBe("danger");
      expect(getBadgeVariant("CRITICAL", "priority")).toBe("danger");
    });

    it("should return correct variant for status", () => {
      expect(getBadgeVariant("PENDING", "status")).toBe("default");
      expect(getBadgeVariant("APPROVED", "status")).toBe("success");
      expect(getBadgeVariant("REJECTED", "status")).toBe("danger");
      expect(getBadgeVariant("IN_PROGRESS", "status")).toBe("info");
      expect(getBadgeVariant("COMPLETED", "status")).toBe("primary");
    });

    it("should return default for unknown values", () => {
      expect(getBadgeVariant("UNKNOWN", "type")).toBe("default");
      expect(getBadgeVariant("UNKNOWN", "priority")).toBe("default");
      expect(getBadgeVariant("UNKNOWN", "status")).toBe("default");
    });

    it("should return default for invalid type parameter", () => {
      // @ts-expect-error Testing invalid type
      expect(getBadgeVariant("FEATURE", "invalid")).toBe("default");
    });
  });

  describe("getOptionColor", () => {
    const options = [
      { value: "LOW", label: "Low", color: "text-green-600" },
      { value: "HIGH", label: "High", color: "text-red-600" },
    ];

    it("should return color for matching value", () => {
      expect(getOptionColor("LOW", options)).toBe("text-green-600");
    });

    it("should return default color for non-matching value", () => {
      expect(getOptionColor("MEDIUM", options)).toBe("text-gray-600");
    });
  });

  describe("getOptionLabel", () => {
    const options = [
      { value: "LOW", label: "Low Priority" },
      { value: "HIGH", label: "High Priority" },
    ];

    it("should return label for matching value", () => {
      expect(getOptionLabel("LOW", options)).toBe("Low Priority");
    });

    it("should return value if no match found", () => {
      expect(getOptionLabel("MEDIUM", options)).toBe("MEDIUM");
    });
  });

  describe("truncateText", () => {
    it("should not truncate short text", () => {
      expect(truncateText("Hello", 10)).toBe("Hello");
    });

    it("should truncate long text", () => {
      expect(truncateText("Hello World", 5)).toBe("Hello...");
    });

    it("should handle exact length", () => {
      expect(truncateText("Hello", 5)).toBe("Hello");
    });
  });

  describe("File Validation Functions", () => {
    describe("isValidFileType", () => {
      it("should validate allowed file types", () => {
        expect(isValidFileType("image/jpeg", ["image/jpeg", "image/png"])).toBe(
          true,
        );
      });

      it("should reject disallowed file types", () => {
        expect(isValidFileType("video/mp4", ["image/jpeg", "image/png"])).toBe(
          false,
        );
      });
    });

    describe("isValidFileSize", () => {
      it("should validate file size below max", () => {
        expect(isValidFileSize(1000, 2000)).toBe(true);
      });

      it("should validate file size at max", () => {
        expect(isValidFileSize(2000, 2000)).toBe(true);
      });

      it("should reject file size above max", () => {
        expect(isValidFileSize(3000, 2000)).toBe(false);
      });
    });

    describe("getFileExtension", () => {
      it("should extract file extension", () => {
        expect(getFileExtension("document.pdf")).toBe("pdf");
      });

      it("should handle multiple dots", () => {
        expect(getFileExtension("archive.tar.gz")).toBe("gz");
      });

      it("should handle no extension", () => {
        expect(getFileExtension("README")).toBe("");
      });
    });

    describe("isImageFile", () => {
      it("should identify image files", () => {
        expect(isImageFile("image/jpeg")).toBe(true);
        expect(isImageFile("image/png")).toBe(true);
      });

      it("should reject non-image files", () => {
        expect(isImageFile("application/pdf")).toBe(false);
      });
    });
  });

  describe("getInitials", () => {
    it("should generate initials from given and family name", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });

    it("should handle single name", () => {
      expect(getInitials("John")).toBe("J");
    });

    it("should handle three names", () => {
      expect(getInitials("John Michael Doe")).toBe("JM");
    });

    it("should convert to uppercase", () => {
      expect(getInitials("john doe")).toBe("JD");
    });
  });

  describe("isAdmin", () => {
    it("should return true for ADMIN role", () => {
      expect(isAdmin("ADMIN")).toBe(true);
    });

    it("should return false for USER role", () => {
      expect(isAdmin("USER")).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe("generateId", () => {
    it("should generate a string", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
    });

    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("should generate IDs of expected length", () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should delay function execution", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn("test");
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledWith("test");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should cancel previous call when called again", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn("first");
      jest.advanceTimersByTime(100);
      debouncedFn("second");
      jest.advanceTimersByTime(100);
      debouncedFn("third");
      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith("third");
    });

    it("should handle multiple parameters", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn("arg1", "arg2", 123);
      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", 123);
    });

    it("should work with no parameters", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn();
      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("sleep", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should resolve after specified time", async () => {
      const promise = sleep(1000);
      let resolved = false;

      promise.then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      jest.advanceTimersByTime(1000);
      await promise;

      expect(resolved).toBe(true);
    });

    it("should work with different delays", async () => {
      const promise500 = sleep(500);
      const promise1000 = sleep(1000);

      let resolved500 = false;
      let resolved1000 = false;

      promise500.then(() => {
        resolved500 = true;
      });
      promise1000.then(() => {
        resolved1000 = true;
      });

      jest.advanceTimersByTime(500);
      await promise500;
      expect(resolved500).toBe(true);
      expect(resolved1000).toBe(false);

      jest.advanceTimersByTime(500);
      await promise1000;
      expect(resolved1000).toBe(true);
    });
  });

  describe("Time Format Functions", () => {
    describe("formatMinutesToHoursMinutes", () => {
      it("should format 0 minutes", () => {
        expect(formatMinutesToHoursMinutes(0)).toBe("0h00");
      });

      it("should format minutes only", () => {
        expect(formatMinutesToHoursMinutes(45)).toBe("0h45");
      });

      it("should format hours only", () => {
        expect(formatMinutesToHoursMinutes(120)).toBe("2h00");
      });

      it("should format hours and minutes", () => {
        expect(formatMinutesToHoursMinutes(150)).toBe("2h30");
      });

      it("should handle null", () => {
        expect(formatMinutesToHoursMinutes(null)).toBe("");
      });

      it("should handle undefined", () => {
        expect(formatMinutesToHoursMinutes(undefined)).toBe("");
      });
    });

    describe("parseHoursMinutesToMinutes", () => {
      it("should parse hours and minutes", () => {
        expect(parseHoursMinutesToMinutes("2h30")).toBe(150);
      });

      it("should parse hours only", () => {
        expect(parseHoursMinutesToMinutes("2h")).toBe(120);
      });

      it("should parse minutes only", () => {
        expect(parseHoursMinutesToMinutes("h30")).toBe(30);
      });

      it("should parse plain number as minutes", () => {
        expect(parseHoursMinutesToMinutes("90")).toBe(90);
      });

      it("should handle empty string", () => {
        expect(parseHoursMinutesToMinutes("")).toBe(null);
      });

      it("should handle spaces", () => {
        expect(parseHoursMinutesToMinutes("2 h 30")).toBe(150);
      });
    });

    describe("formatTimeInput", () => {
      it("should format small numbers as minutes", () => {
        expect(formatTimeInput("30")).toBe("0h30");
      });

      it("should format larger numbers as hours and minutes", () => {
        expect(formatTimeInput("150")).toBe("2h30");
      });

      it("should handle empty input", () => {
        expect(formatTimeInput("")).toBe("");
      });

      it("should remove non-digits", () => {
        expect(formatTimeInput("2h30")).toBe("3h50");
      });
    });
  });
});
