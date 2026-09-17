"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Button from "@/app/components/ui/Button";
import HofStatsCards from "./HofStatsCards";
import HofTableFilters from "./HofTableFilters";
import HofMembersTable from "./HofMembersTable";
import HofInfoPanels from "./HofInfoPanels";
import ProgressRegister from "./ProgressRegister";
import MeisterReport from "./MeisterReport";
import type { AwardTier } from "@/src/lib/hofTierUtils";
import { sortAndRankHofMembers } from "@/src/lib/hofTierUtils";

type Year = {
  id: string;
  code: string;
  title: string;
  displayOrder: number;
};

type HallOfFame = {
  id: string;
  code: string;
  title: string;
  displayOrder: number;
  progressRegisterExcludeRetired?: boolean;
  progressRegisterExcludeDeceased?: boolean;
  progressRegisterExcludeInactive?: boolean;
  progressRegisterInactivityYears?: number;
};

type MemberStats = {
  entryId?: string | null;
  member: {
    id: string;
    username: string;
    displayName: string;
    status: string;
    retiredYear?: number | null;
    deceasedYear?: number | null;
    birthYear?: number | null;
    familyName?: string | null;
  };
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  foreignPeaksInYear: number;
  fpr: number;
  isNewEntrant: boolean;
  isFirstTimeAward: boolean;
  awardTierName: string | null;
  firstQualificationYear: string | null;
  dataNotProvided: boolean;
  hasLce: boolean;
  lceCountryId: string | null;
  originalRank?: number;
};

type ProgressMemberStats = {
  member: {
    id: string;
    username: string;
    displayName: string;
    status: string;
    birthYear: number | null;
    retiredYear: number | null;
    deceasedYear: number | null;
  };
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  fpr: number;
  dataNotProvided: boolean;
  isNewEntrant: boolean;
  hasLce: boolean;
  lceCountryId: string | null;
  isFromLceCountry?: boolean;
  failedMinimumAge: boolean;
  failedMinimumPeaks: boolean;
  failedMinimumForeignPeaks: boolean;
  failedMinimumFpr: boolean;
  memberAge: number | null;
};

type HofYearConfig = {
  minPeaks: number;
  minPeaksEnabled?: boolean;
  minForeignPeaks: number;
  minForeignPeaksEnabled?: boolean;
  minFpr: number;
  minFprEnabled?: boolean;
  minimumAge: number;
  minimumAgeEnabled?: boolean;
  meisterReportContent?: string | null;
  meisterReportImage?: string | null;
  meisterReportImageTitle?: string | null;
  meisterReportImageAttribution?: string | null;
  lceEnabled?: boolean;
  lceMinFpr?: number;
  lceMinPeaks?: number | null;
  lceMinForeignPeaks?: number | null;
  hofmeister?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  lceCountries?: Array<{
    countryId: string;
    hasLce: boolean;
  }>;
};

type Country = {
  id: string;
  name: string;
  code: string;
};

interface HofTablesViewProps {
  basePath?: string;
}

export default function HofTablesView({ basePath = "/hof-tables" }: HofTablesViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [progressMembers, setProgressMembers] = useState<ProgressMemberStats[]>([]);
  const [yearValue, setYearValue] = useState<number>(new Date().getFullYear());
  const [years, setYears] = useState<Year[]>([]);
  const [hofs, setHofs] = useState<HallOfFame[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedHofId, setSelectedHofId] = useState<string | null>(null);
  const [config, setConfig] = useState<HofYearConfig | null>(null);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);
  const [totalActiveMembers, setTotalActiveMembers] = useState<number>(0);
  const [exclusionStats, setExclusionStats] = useState<{
    retiredCount: number;
    deceasedCount: number;
    inactiveCount: number;
    totalExcluded: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);
  const [selectedBadges, setSelectedBadges] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState<string>("");
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"qualified" | "progress">("qualified");

  /**
   * Initial data load - runs once on component mount
   * Reads HOF and year from URL params if available
   */
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const hofParam = searchParams.get("hof");
    const yearParam = searchParams.get("year");
    fetchData(yearParam, hofParam);
  }, []);

  /**
   * Fetch HOF tables data from API
   * Includes members, years, HOFs, configuration, and award tiers
   * @param yearId - Optional year ID to fetch data for
   * @param hofId - Optional HOF ID to fetch data for
   * @param memberIdToRestore - Optional member ID to keep expanded after refresh
   */
  const fetchData = async (
    yearId?: string | null,
    hofId?: string | null,
    memberIdToRestore?: string
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (yearId) params.append("yearId", yearId);
      if (hofId) params.append("hofId", hofId);

      const url = `/api/hof-tables${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();

        // Sort members using tie-breaking rules and assign ranks
        const sortedMembers = sortAndRankHofMembers(data.members || []) as MemberStats[];
        setMembers(sortedMembers);

        // Set progress register members
        setProgressMembers(data.progressRegisterMembers || []);

        // If we need to restore a member's expanded state, find them in the new data
        if (memberIdToRestore) {
          const memberInQualified = sortedMembers.find((m) => m.member.id === memberIdToRestore);
          const memberInProgress = (data.progressRegisterMembers || []).find(
            (m: any) => m.member.id === memberIdToRestore
          );

          if (memberInQualified) {
            // Member is in qualified list
            setExpandedMemberId(memberIdToRestore);
            setActiveTab("qualified");
          } else if (memberInProgress) {
            // Member moved to progress register
            setExpandedMemberId(memberIdToRestore);
            setActiveTab("progress");
          } else {
            // Member disappeared (filtered out completely)
            console.warn(`Member ${memberIdToRestore} not found after refresh`);
            setExpandedMemberId(null);
          }
        }

        // Set year value
        setYearValue(data.yearValue || new Date().getFullYear());

        setYears(data.years || []);
        setHofs(data.hofs || []);
        setSelectedYearId(data.selectedYearId);
        setSelectedHofId(data.selectedHofId);
        setConfig(data.config || null);
        setAwardTiers(data.awardTiers || []);
        setTotalActiveMembers(data.totalActiveMembers || 0);
        setExclusionStats(data.progressRegisterExclusionStats || null);

        // Fetch countries if LCE is enabled
        if (data.config?.lceEnabled) {
          const countriesResponse = await fetch("/api/countries");
          if (countriesResponse.ok) {
            const countriesData = await countriesResponse.json();
            setCountries(countriesData.countries || []);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching HOF tables data:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle data refresh after inline editing
   * Preserves the expanded member's state across refresh
   */
  const handleRefresh = async (memberIdToRestore?: string) => {
    await fetchData(selectedYearId, selectedHofId, memberIdToRestore);
  };

  /**
   * Handle year filter change
   * Updates state, fetches new data, and updates URL
   */
  const handleYearChange = (yearId: string) => {
    setSelectedYearId(yearId);
    fetchData(yearId, selectedHofId);

    // Update URL with new filters
    const params = new URLSearchParams();
    params.set("year", yearId);
    if (selectedHofId) params.set("hof", selectedHofId);
    router.replace(`${basePath}?${params.toString()}`, { scroll: false });
  };

  /**
   * Handle HOF filter change
   * Updates state, fetches new data, and updates URL
   */
  const handleHofChange = (hofId: string) => {
    setSelectedHofId(hofId);
    fetchData(selectedYearId, hofId);

    // Update URL with new filters
    const params = new URLSearchParams();
    if (selectedYearId) params.set("year", selectedYearId);
    params.set("hof", hofId);
    router.replace(`${basePath}?${params.toString()}`, { scroll: false });
  };

  // Handle badge filter toggle
  const handleBadgeToggle = (badgeType: string) => {
    setSelectedBadges((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(badgeType)) {
        newSet.delete(badgeType);
      } else {
        newSet.add(badgeType);
      }
      return newSet;
    });
  };

  // Handle search text change
  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const selectedBadgesArray = useMemo(() => Array.from(selectedBadges), [selectedBadges]);

  // Add original rank to members before filtering
  const membersWithRank = useMemo(
    () =>
      members.map((member, index) => ({
        ...member,
        originalRank: index + 1,
      })),
    [members]
  );

  // Client-side filtering of members based on selected badges and search text
  const filteredMembers = useMemo(() => {
    const searchLower = searchText.toLowerCase();

    return membersWithRank.filter((member) => {
      // Apply badge filter
      if (selectedBadgesArray.length > 0) {
        let hasBadge = false;
        for (const badge of selectedBadgesArray) {
          if (badge === "me" && member.member.id === session?.user?.id) {
            hasBadge = true;
            break;
          }
          if (badge === "newEntrant" && member.isNewEntrant) {
            hasBadge = true;
            break;
          }
          if (badge === "newAward" && member.isFirstTimeAward) {
            hasBadge = true;
            break;
          }
          if (badge === "lce" && member.hasLce) {
            hasBadge = true;
            break;
          }
          if (badge === "noData" && member.dataNotProvided) {
            hasBadge = true;
            break;
          }
          if (badge === "missingData" && member.dataNotProvided) {
            hasBadge = true;
            break;
          }
          if (badge === "retired" && member.member.retiredYear) {
            hasBadge = true;
            break;
          }
          if (badge === "deceased" && member.member.deceasedYear) {
            hasBadge = true;
            break;
          }
        }
        if (!hasBadge) return false;
      }

      // Apply text search filter
      if (searchLower) {
        const displayName = member.member.displayName.toLowerCase();
        const username = member.member.username.toLowerCase();
        return displayName.includes(searchLower) || username.includes(searchLower);
      }

      return true;
    });
  }, [membersWithRank, selectedBadgesArray, searchText, session?.user?.id]);

  // Client-side filtering of progress register members based on selected badges and search text
  const filteredProgressMembers = useMemo(() => {
    const searchLower = searchText.toLowerCase();

    return progressMembers.filter((member) => {
      // Apply badge filter
      if (selectedBadgesArray.length > 0) {
        let hasBadge = false;
        for (const badge of selectedBadgesArray) {
          if (badge === "me" && member.member.id === session?.user?.id) {
            hasBadge = true;
            break;
          }
          if (badge === "newEntrant" && member.isNewEntrant) {
            hasBadge = true;
            break;
          }
          if (badge === "lce" && member.hasLce) {
            hasBadge = true;
            break;
          }
          if (badge === "noData" && member.dataNotProvided) {
            hasBadge = true;
            break;
          }
          if (
            badge === "missingData" &&
            (member.dataNotProvided ||
              (config?.minimumAge && config.minimumAge > 0 && member.memberAge === null))
          ) {
            hasBadge = true;
            break;
          }
          if (badge === "retired" && member.member.retiredYear) {
            hasBadge = true;
            break;
          }
          if (badge === "deceased" && member.member.deceasedYear) {
            hasBadge = true;
            break;
          }
          // Progress Register specific badges
          if (badge === "junior" && member.failedMinimumAge) {
            hasBadge = true;
            break;
          }
          if (badge === "national" && !member.failedMinimumPeaks) {
            hasBadge = true;
            break;
          }
        }
        if (!hasBadge) return false;
      }

      // Apply text search filter
      if (searchLower) {
        const displayName = member.member.displayName.toLowerCase();
        const username = member.member.username.toLowerCase();
        return displayName.includes(searchLower) || username.includes(searchLower);
      }

      return true;
    });
  }, [progressMembers, selectedBadgesArray, searchText, session?.user?.id, config?.minimumAge]);

  // Calculate aggregate statistics for all displayed members
  const totalStats = useMemo(
    () =>
      filteredMembers.reduce(
        (acc, member) => ({
          totalPeaks: acc.totalPeaks + member.totalPeaks,
          peaksInYear: acc.peaksInYear + member.peaksInYear,
          foreignPeaks: acc.foreignPeaks + member.foreignPeaks,
        }),
        { totalPeaks: 0, peaksInYear: 0, foreignPeaks: 0 }
      ),
    [filteredMembers]
  );

  // Calculate overall Foreign Peak Ratio percentage
  const overallFpr =
    totalStats.totalPeaks > 0 ? (totalStats.foreignPeaks / totalStats.totalPeaks) * 100 : 0;

  // Get display labels from selected year and HOF
  const selectedYear = years.find((y) => y.id === selectedYearId);
  const yearLabel = selectedYear ? selectedYear.code : "year";

  const selectedHof = hofs.find((h) => h.id === selectedHofId);
  const hofLabel = selectedHof ? selectedHof.code : "HOF";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-primary-400">Loading HOF Tables...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-400">Hall of Fame Tables</h1>
          <p className="text-gray-400 mt-1">Hall of Fame statistics for all active members</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/support${
              selectedHofId && selectedYearId
                ? `?hofId=${selectedHofId}&yearId=${selectedYearId}`
                : ""
            }`}
          >
            <Button variant="secondary" size="sm" type="button">
              Report Data Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <HofStatsCards
        memberCount={filteredMembers.length}
        totalPeaks={totalStats.totalPeaks}
        totalForeignPeaks={totalStats.foreignPeaks}
        overallFpr={overallFpr}
        hofLabel={hofLabel}
        yearLabel={yearLabel}
      />

      {/* Filters */}
      <div className="card">
        <HofTableFilters
          years={years}
          hofs={hofs}
          selectedYearId={selectedYearId}
          selectedHofId={selectedHofId}
          config={config}
          hofLabel={hofLabel}
          yearLabel={yearLabel}
          isAdmin={session?.user?.role === "ADMIN"}
          onYearChange={handleYearChange}
          onHofChange={handleHofChange}
          selectedBadges={selectedBadges}
          onBadgeToggle={handleBadgeToggle}
          searchText={searchText}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* HoF Meister Report */}
      <MeisterReport config={config} hofLabel={hofLabel} yearLabel={yearLabel} />

      {/* Hall of Fame Table */}
      <div className="card">
        <HofMembersTable
          members={filteredMembers}
          awardTiers={awardTiers}
          yearLabel={yearLabel}
          hofLabel={hofLabel}
          config={config}
          totalActiveMembers={totalActiveMembers}
          totalQualifiedMembers={members.length}
          currentUserId={session?.user?.id}
          currentUserRole={session?.user?.role}
          hofId={selectedHofId || undefined}
          yearId={selectedYearId || undefined}
          expandedRowId={activeTab === "qualified" ? expandedMemberId : null}
          onExpandRow={setExpandedMemberId}
          onRefresh={handleRefresh}
          isAuthenticated={!!session}
        />
      </div>

      {/* Progress Register - Members who didn't qualify */}
      {progressMembers.length > 0 && config && (
        <div className="card">
          <ProgressRegister
            members={filteredProgressMembers as any}
            yearLabel={yearLabel}
            yearValue={yearValue}
            hofLabel={hofLabel}
            hofId={selectedHofId || undefined}
            yearId={selectedYearId || undefined}
            isAdmin={session?.user?.role === "ADMIN"}
            currentUserId={session?.user?.id}
            minimumAge={config.minimumAge || 0}
            config={{
              minPeaks: config.minPeaks,
              minPeaksEnabled: config.minPeaksEnabled,
              minForeignPeaks: config.minForeignPeaks,
              minForeignPeaksEnabled: config.minForeignPeaksEnabled,
              minFpr: config.minFpr,
              minFprEnabled: config.minFprEnabled,
              minimumAge: config.minimumAge,
              minimumAgeEnabled: config.minimumAgeEnabled,
              lceMinFpr: config.lceMinFpr,
              lceMinPeaks: config.lceMinPeaks,
              lceMinForeignPeaks: config.lceMinForeignPeaks,
            }}
            selectedBadges={selectedBadges}
            onBadgeToggle={handleBadgeToggle}
            expandedMemberId={expandedMemberId}
            onRefresh={handleRefresh}
          />
        </div>
      )}

      {/* Info Sections */}
      <HofInfoPanels
        config={config}
        awardTiers={awardTiers}
        hofLabel={hofLabel}
        yearLabel={yearLabel}
        isAdmin={session?.user?.role === "ADMIN"}
        countries={countries}
        hof={hofs.find((h) => h.id === selectedHofId)}
        exclusionStats={exclusionStats}
      />
    </div>
  );
}
