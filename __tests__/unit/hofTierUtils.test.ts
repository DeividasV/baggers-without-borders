import {
  getTierBorderColor,
  getTierGradient,
  getTierHoverBg,
  getTierHoverBorder,
  getTierBottomBorder,
  getTierTextColor,
  getTierBgColor,
  getMemberTier,
  compareHofMembers,
  sortHofMembers,
  AwardTier,
  HofMember,
} from "@/src/lib/hofTierUtils";

describe("HOF Tier Utilities", () => {
  const mockTiers: AwardTier[] = [
    {
      id: "1",
      name: "Bronze",
      minPeaks: 1,
      maxPeaks: 100,
      displayOrder: 1,
    },
    {
      id: "2",
      name: "Silver",
      minPeaks: 101,
      maxPeaks: 200,
      displayOrder: 2,
    },
    {
      id: "3",
      name: "Gold",
      minPeaks: 201,
      maxPeaks: 300,
      displayOrder: 3,
    },
    {
      id: "4",
      name: "Emerald",
      minPeaks: 301,
      maxPeaks: 400,
      displayOrder: 4,
    },
    {
      id: "5",
      name: "Sapphire",
      minPeaks: 401,
      maxPeaks: 500,
      displayOrder: 5,
    },
    {
      id: "6",
      name: "Diamond",
      minPeaks: 501,
      maxPeaks: null,
      displayOrder: 6,
    },
  ];

  describe("getTierBorderColor", () => {
    it("should return correct border color for Bronze", () => {
      expect(getTierBorderColor("Bronze")).toBe("border-l-amber-700");
    });

    it("should return correct border color for Silver", () => {
      expect(getTierBorderColor("Silver")).toBe("border-l-slate-300");
    });

    it("should return correct border color for Gold", () => {
      expect(getTierBorderColor("Gold")).toBe("border-l-yellow-400");
    });

    it("should return empty string for unknown tier", () => {
      expect(getTierBorderColor("Unknown")).toBe("");
    });
  });

  describe("getTierGradient", () => {
    it("should return gradient for Bronze", () => {
      expect(getTierGradient("Bronze")).toContain("bg-gradient-to-r");
      expect(getTierGradient("Bronze")).toContain("amber");
    });

    it("should return gradient for Diamond", () => {
      expect(getTierGradient("Diamond")).toContain("bg-gradient-to-r");
      expect(getTierGradient("Diamond")).toContain("purple");
    });

    it("should return empty string for unknown tier", () => {
      expect(getTierGradient("Unknown")).toBe("");
    });
  });

  describe("getTierHoverBg", () => {
    it("should return hover background for each tier", () => {
      expect(getTierHoverBg("Bronze")).toBe("hover:bg-amber-900/30");
      expect(getTierHoverBg("Silver")).toBe("hover:bg-slate-700/30");
      expect(getTierHoverBg("Gold")).toBe("hover:bg-yellow-800/30");
    });

    it("should return default for unknown tier", () => {
      expect(getTierHoverBg("Unknown")).toBe("hover:bg-primary-900/20");
    });
  });

  describe("getTierHoverBorder", () => {
    it("should return hover border for each tier", () => {
      expect(getTierHoverBorder("Bronze")).toBe("hover:border-amber-600/70");
      expect(getTierHoverBorder("Silver")).toBe("hover:border-slate-300/70");
    });

    it("should return default for unknown tier", () => {
      expect(getTierHoverBorder("Unknown")).toBe("hover:border-primary-600/50");
    });
  });

  describe("getTierBottomBorder", () => {
    it("should return bottom border for each tier", () => {
      expect(getTierBottomBorder("Bronze")).toBe("border-b-amber-600/60");
      expect(getTierBottomBorder("Diamond")).toBe("border-b-purple-400/60");
    });

    it("should return empty string for unknown tier", () => {
      expect(getTierBottomBorder("Unknown")).toBe("");
    });
  });

  describe("getTierTextColor", () => {
    it("should return text color for each tier", () => {
      expect(getTierTextColor("Bronze")).toBe("text-amber-400");
      expect(getTierTextColor("Silver")).toBe("text-slate-300");
      expect(getTierTextColor("Gold")).toBe("text-yellow-400");
    });

    it("should return default for unknown tier", () => {
      expect(getTierTextColor("Unknown")).toBe("text-primary-300");
    });
  });

  describe("getTierBgColor", () => {
    it("should return background color for each tier", () => {
      expect(getTierBgColor("Bronze")).toBe(
        "bg-amber-900/20 border-amber-600/30",
      );
      expect(getTierBgColor("Silver")).toBe(
        "bg-slate-700/20 border-slate-400/30",
      );
    });

    it("should return default for unknown tier", () => {
      expect(getTierBgColor("Unknown")).toBe("bg-dark-800/50 border-dark-600");
    });
  });

  describe("getMemberTier", () => {
    it("should return Bronze tier for 50 peaks", () => {
      const tier = getMemberTier(50, mockTiers);
      expect(tier).not.toBeNull();
      expect(tier?.name).toBe("Bronze");
    });

    it("should return Silver tier for 150 peaks", () => {
      const tier = getMemberTier(150, mockTiers);
      expect(tier).not.toBeNull();
      expect(tier?.name).toBe("Silver");
    });

    it("should return Gold tier for 250 peaks", () => {
      const tier = getMemberTier(250, mockTiers);
      expect(tier).not.toBeNull();
      expect(tier?.name).toBe("Gold");
    });

    it("should return Emerald tier for 350 peaks", () => {
      const tier = getMemberTier(350, mockTiers);
      expect(tier).not.toBeNull();
      expect(tier?.name).toBe("Emerald");
    });

    it("should return Sapphire tier for 450 peaks", () => {
      const tier = getMemberTier(450, mockTiers);
      expect(tier).not.toBeNull();
      expect(tier?.name).toBe("Sapphire");
    });

    it("should return Diamond tier for 600 peaks", () => {
      const tier = getMemberTier(600, mockTiers);
      expect(tier).not.toBeNull();
      expect(tier?.name).toBe("Diamond");
    });

    it("should return null for 0 peaks", () => {
      const tier = getMemberTier(0, mockTiers);
      expect(tier).toBeNull();
    });

    it("should return correct tier at boundary (100 peaks)", () => {
      const tier = getMemberTier(100, mockTiers);
      expect(tier).not.toBeNull();
      expect(tier?.name).toBe("Bronze");
    });

    it("should return correct tier at boundary (101 peaks)", () => {
      const tier = getMemberTier(101, mockTiers);
      expect(tier).not.toBeNull();
      expect(tier?.name).toBe("Silver");
    });

    it("should handle empty tiers array", () => {
      const tier = getMemberTier(100, []);
      expect(tier).toBeNull();
    });

    it("should handle Diamond tier with no max (null)", () => {
      const tier = getMemberTier(10000, mockTiers);
      expect(tier).not.toBeNull();
      expect(tier?.name).toBe("Diamond");
    });
  });

  describe("compareHofMembers", () => {
    // Helper function to create test members
    const createMember = (
      totalPeaks: number,
      fpr: number,
      peaksInYear: number,
      firstQualificationYear: string | null,
      displayName: string | null,
    ): HofMember => ({
      totalPeaks,
      fpr,
      peaksInYear,
      firstQualificationYear,
      member: { displayName },
    });

    describe("Rule 1: Total peaks (primary sort)", () => {
      it("should sort by totalPeaks descending (higher first)", () => {
        const member1 = createMember(100, 0.5, 10, "2020", "Alice");
        const member2 = createMember(200, 0.5, 10, "2020", "Alice");

        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
        expect(compareHofMembers(member2, member1)).toBeLessThan(0);
      });

      it("should return 0 when totalPeaks are equal and all other fields match", () => {
        const member1 = createMember(100, 0.5, 10, "2020", "Alice");
        const member2 = createMember(100, 0.5, 10, "2020", "Alice");

        expect(compareHofMembers(member1, member2)).toBe(0);
      });
    });

    describe("Rule 2: FPR (Foreign Peak Ratio)", () => {
      it("should sort by FPR descending when totalPeaks match", () => {
        const member1 = createMember(100, 0.3, 10, "2020", "Alice");
        const member2 = createMember(100, 0.7, 10, "2020", "Alice");

        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
        expect(compareHofMembers(member2, member1)).toBeLessThan(0);
      });

      it("should use FPR only when totalPeaks are equal", () => {
        const member1 = createMember(100, 0.8, 10, "2020", "Alice");
        const member2 = createMember(200, 0.1, 10, "2020", "Alice");

        // member2 wins because of higher totalPeaks, despite lower FPR
        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
      });
    });

    describe("Rule 3: Peaks in year", () => {
      it("should sort by peaksInYear descending when totalPeaks and FPR match", () => {
        const member1 = createMember(100, 0.5, 5, "2020", "Alice");
        const member2 = createMember(100, 0.5, 15, "2020", "Alice");

        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
        expect(compareHofMembers(member2, member1)).toBeLessThan(0);
      });

      it("should handle zero peaks in year", () => {
        const member1 = createMember(100, 0.5, 0, "2020", "Alice");
        const member2 = createMember(100, 0.5, 5, "2020", "Alice");

        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
      });
    });

    describe("Rule 4: First qualification year", () => {
      it("should sort by firstQualificationYear ascending (earlier first)", () => {
        const member1 = createMember(100, 0.5, 10, "2020", "Alice");
        const member2 = createMember(100, 0.5, 10, "2015", "Alice");

        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
        expect(compareHofMembers(member2, member1)).toBeLessThan(0);
      });

      it("should handle null firstQualificationYear (nulls sort last)", () => {
        const member1 = createMember(100, 0.5, 10, null, "Alice");
        const member2 = createMember(100, 0.5, 10, "2020", "Alice");

        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
        expect(compareHofMembers(member2, member1)).toBeLessThan(0);
      });

      it("should handle both members with null firstQualificationYear", () => {
        const member1 = createMember(100, 0.5, 10, null, "Bob");
        const member2 = createMember(100, 0.5, 10, null, "Alice");

        // Should proceed to displayName comparison
        expect(compareHofMembers(member1, member2)).toBeLessThan(0);
      });
    });

    describe("Rule 5: Display name (reverse alphabetical)", () => {
      it("should sort by displayName in reverse alphabetical order (Z→A)", () => {
        const member1 = createMember(100, 0.5, 10, "2020", "Alice");
        const member2 = createMember(100, 0.5, 10, "2020", "Bob");

        // Bob should rank higher than Alice (reverse alphabetical)
        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
        expect(compareHofMembers(member2, member1)).toBeLessThan(0);
      });

      it("should sort Zelda higher than Alice", () => {
        const member1 = createMember(100, 0.5, 10, "2020", "Alice");
        const member2 = createMember(100, 0.5, 10, "2020", "Zelda");

        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
        expect(compareHofMembers(member2, member1)).toBeLessThan(0);
      });

      it("should handle diacritics correctly (locale-aware)", () => {
        const member1 = createMember(100, 0.5, 10, "2020", "Anderson");
        const member2 = createMember(100, 0.5, 10, "2020", "Żelazny");

        // Żelazny should rank higher than Anderson (reverse alphabetical with locale)
        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
        expect(compareHofMembers(member2, member1)).toBeLessThan(0);
      });

      it("should handle names with accents (é, ñ, ü)", () => {
        const member1 = createMember(100, 0.5, 10, "2020", "Alvarez");
        const member2 = createMember(100, 0.5, 10, "2020", "Álvarez");

        // localeCompare should handle these correctly
        const result = compareHofMembers(member1, member2);
        expect(result).not.toBe(0); // Should differentiate
      });

      it("should handle null displayName (nulls sort last)", () => {
        const member1 = createMember(100, 0.5, 10, "2020", null);
        const member2 = createMember(100, 0.5, 10, "2020", "Alice");

        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
        expect(compareHofMembers(member2, member1)).toBeLessThan(0);
      });

      it("should handle both members with null displayName", () => {
        const member1 = createMember(100, 0.5, 10, "2020", null);
        const member2 = createMember(100, 0.5, 10, "2020", null);

        expect(compareHofMembers(member1, member2)).toBe(0);
      });

      it("should handle empty string displayName", () => {
        const member1 = createMember(100, 0.5, 10, "2020", "");
        const member2 = createMember(100, 0.5, 10, "2020", "Alice");

        // Empty string should sort last (treated as falsy)
        expect(compareHofMembers(member1, member2)).toBeGreaterThan(0);
      });
    });

    describe("Complex tie-breaking scenarios", () => {
      it("should apply rules in correct sequence", () => {
        const member1 = createMember(100, 0.5, 10, "2020", "Zelda");
        const member2 = createMember(100, 0.5, 10, "2020", "Alice");
        const member3 = createMember(100, 0.5, 10, "2019", "Zelda");
        const member4 = createMember(100, 0.5, 15, "2020", "Alice");
        const member5 = createMember(100, 0.7, 10, "2020", "Alice");

        // member5 should rank highest (higher FPR)
        expect(compareHofMembers(member1, member5)).toBeGreaterThan(0);

        // member4 should beat member2 (more peaks in year)
        expect(compareHofMembers(member2, member4)).toBeGreaterThan(0);

        // member3 should beat member1 (earlier qualification year)
        expect(compareHofMembers(member1, member3)).toBeGreaterThan(0);

        // member1 should beat member2 (Zelda > Alice in reverse alpha)
        expect(compareHofMembers(member2, member1)).toBeGreaterThan(0);
      });
    });
  });

  describe("sortHofMembers", () => {
    it("should sort members by totalPeaks descending", () => {
      const members: HofMember[] = [
        {
          totalPeaks: 100,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Alice" },
        },
        {
          totalPeaks: 300,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Bob" },
        },
        {
          totalPeaks: 200,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Charlie" },
        },
      ];

      const sorted = sortHofMembers(members);

      expect(sorted[0].totalPeaks).toBe(300);
      expect(sorted[1].totalPeaks).toBe(200);
      expect(sorted[2].totalPeaks).toBe(100);
    });

    it("should apply tie-breaking rules when totalPeaks match", () => {
      const members: HofMember[] = [
        {
          totalPeaks: 100,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Alice" },
        },
        {
          totalPeaks: 100,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Zelda" },
        },
        {
          totalPeaks: 100,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Bob" },
        },
      ];

      const sorted = sortHofMembers(members);

      // Should be sorted by displayName reverse alphabetical: Zelda, Bob, Alice
      expect(sorted[0].member.displayName).toBe("Zelda");
      expect(sorted[1].member.displayName).toBe("Bob");
      expect(sorted[2].member.displayName).toBe("Alice");
    });

    it("should not mutate the original array", () => {
      const members: HofMember[] = [
        {
          totalPeaks: 100,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Alice" },
        },
        {
          totalPeaks: 200,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Bob" },
        },
      ];

      const originalOrder = [...members];
      sortHofMembers(members);

      expect(members).toEqual(originalOrder);
    });

    it("should handle empty array", () => {
      const sorted = sortHofMembers([]);
      expect(sorted).toEqual([]);
    });

    it("should handle single member", () => {
      const members: HofMember[] = [
        {
          totalPeaks: 100,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Alice" },
        },
      ];

      const sorted = sortHofMembers(members);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].member.displayName).toBe("Alice");
    });

    it("should handle complex sorting with all tie-breaking rules", () => {
      const members: HofMember[] = [
        {
          totalPeaks: 100,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Alice" },
        },
        {
          totalPeaks: 100,
          fpr: 0.7,
          peaksInYear: 10,
          firstQualificationYear: "2020",
          member: { displayName: "Bob" },
        },
        {
          totalPeaks: 100,
          fpr: 0.5,
          peaksInYear: 15,
          firstQualificationYear: "2020",
          member: { displayName: "Charlie" },
        },
        {
          totalPeaks: 100,
          fpr: 0.5,
          peaksInYear: 10,
          firstQualificationYear: "2015",
          member: { displayName: "David" },
        },
        {
          totalPeaks: 200,
          fpr: 0.3,
          peaksInYear: 5,
          firstQualificationYear: "2021",
          member: { displayName: "Eve" },
        },
      ];

      const sorted = sortHofMembers(members);

      // Eve should be first (highest totalPeaks)
      expect(sorted[0].member.displayName).toBe("Eve");

      // Among the 100-peak members:
      // Bob should be second (highest FPR)
      expect(sorted[1].member.displayName).toBe("Bob");

      // Charlie should be third (most peaks in year)
      expect(sorted[2].member.displayName).toBe("Charlie");

      // David should be fourth (earliest qualification year)
      expect(sorted[3].member.displayName).toBe("David");

      // Alice should be last
      expect(sorted[4].member.displayName).toBe("Alice");
    });
  });
});
