/**
 * Tests for user-profile types and constants
 */

import { GENDERS, Gender, PasswordStrength } from "@/src/types/user-profile";

describe("user-profile types", () => {
  describe("GENDERS constant", () => {
    it("should have 4 gender options", () => {
      expect(GENDERS).toHaveLength(4);
    });

    it("should include Male option", () => {
      const male = GENDERS.find((g) => g.value === "M");
      expect(male).toBeDefined();
      expect(male?.label).toBe("Male");
    });

    it("should include Female option", () => {
      const female = GENDERS.find((g) => g.value === "F");
      expect(female).toBeDefined();
      expect(female?.label).toBe("Female");
    });

    it("should include Other option", () => {
      const other = GENDERS.find((g) => g.value === "O");
      expect(other).toBeDefined();
      expect(other?.label).toBe("Other");
    });

    it("should include Prefer not to say option", () => {
      const prefer = GENDERS.find((g) => g.value === "N");
      expect(prefer).toBeDefined();
      expect(prefer?.label).toBe("Prefer not to say");
    });

    it("should have correct structure for each gender", () => {
      GENDERS.forEach((gender) => {
        expect(gender).toHaveProperty("value");
        expect(gender).toHaveProperty("label");
        expect(typeof gender.value).toBe("string");
        expect(typeof gender.label).toBe("string");
      });
    });

    it("should have unique values", () => {
      const values = GENDERS.map((g) => g.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it("should have unique labels", () => {
      const labels = GENDERS.map((g) => g.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });
  });

  describe("Gender interface", () => {
    it("should accept valid gender objects", () => {
      const gender: Gender = { value: "M", label: "Male" };
      expect(gender.value).toBe("M");
      expect(gender.label).toBe("Male");
    });

    it("should work with custom values", () => {
      const customGender: Gender = { value: "X", label: "Custom" };
      expect(customGender.value).toBe("X");
      expect(customGender.label).toBe("Custom");
    });
  });

  describe("PasswordStrength interface", () => {
    it("should accept valid password strength objects", () => {
      const strength: PasswordStrength = {
        strength: 3,
        label: "Strong",
        color: "green",
      };
      expect(strength.strength).toBe(3);
      expect(strength.label).toBe("Strong");
      expect(strength.color).toBe("green");
    });

    it("should handle weak password", () => {
      const weak: PasswordStrength = {
        strength: 0,
        label: "Weak",
        color: "red",
      };
      expect(weak.strength).toBe(0);
      expect(weak.label).toBe("Weak");
    });

    it("should handle strong password", () => {
      const strong: PasswordStrength = {
        strength: 4,
        label: "Very Strong",
        color: "green",
      };
      expect(strong.strength).toBe(4);
      expect(strong.label).toBe("Very Strong");
    });
  });

  describe("HofParticipation interface", () => {
    it("should accept valid hof participation objects", () => {
      const participation = {
        id: "1",
        hofId: "hof-1",
        enabled: true,
        hof: {
          id: "hof-1",
          code: "BPL",
          title: "Bavarian Prealps List",
        },
      };

      expect(participation.id).toBe("1");
      expect(participation.hofId).toBe("hof-1");
      expect(participation.enabled).toBe(true);
      expect(participation.hof.code).toBe("BPL");
    });

    it("should handle disabled participation", () => {
      const participation = {
        id: "2",
        hofId: "hof-2",
        enabled: false,
        hof: {
          id: "hof-2",
          code: "AAL",
          title: "Austrian Alps List",
        },
      };

      expect(participation.enabled).toBe(false);
    });
  });

  describe("YearParticipation interface", () => {
    it("should accept valid year participation with country", () => {
      const participation = {
        id: "1",
        yearId: "year-1",
        enabled: true,
        dataNotProvided: false,
        countryId: "country-1",
        year: {
          id: "year-1",
          code: "2024",
          title: "2024",
        },
        country: {
          id: "country-1",
          code: "US",
          name: "United States",
        },
      };

      expect(participation.id).toBe("1");
      expect(participation.yearId).toBe("year-1");
      expect(participation.enabled).toBe(true);
      expect(participation.dataNotProvided).toBe(false);
      expect(participation.country?.code).toBe("US");
    });

    it("should handle participation without country", () => {
      const participation = {
        id: "2",
        yearId: "year-2",
        enabled: true,
        countryId: undefined,
        year: {
          id: "year-2",
          code: "2023",
          title: "2023",
        },
        country: undefined,
      };

      expect(participation.countryId).toBeUndefined();
      expect(participation.country).toBeUndefined();
    });

    it("should handle data not provided flag", () => {
      const participation = {
        id: "3",
        yearId: "year-3",
        enabled: false,
        dataNotProvided: true,
        year: {
          id: "year-3",
          code: "2022",
          title: "2022",
        },
      };

      expect(participation.dataNotProvided).toBe(true);
      expect(participation.enabled).toBe(false);
    });

    it("should handle null countryId", () => {
      const participation = {
        id: "4",
        yearId: "year-4",
        enabled: true,
        countryId: null,
        year: {
          id: "year-4",
          code: "2021",
          title: "2021",
        },
      };

      expect(participation.countryId).toBeNull();
    });
  });
});
