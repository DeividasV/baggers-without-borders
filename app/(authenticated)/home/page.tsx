"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Globe,
  Percent,
  Award,
  TrendingUp,
  Mountain,
  RefreshCw,
  Calendar,
  Target,
  Star,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Circle,
} from "lucide-react";
import Card from "@/ui/Card";
import Button from "@/ui/Button";
import StatsCard from "@/ui/StatsCard";
import LoadingSpinner from "@/ui/LoadingSpinner";
import EmptyState from "@/ui/EmptyState";
import { formatNumber } from "@/src/lib/utils";
import {
  getTierBgColor,
  getTierTextColor,
  getTierBorderColor,
  getMemberTier,
  sortAndRankHofMembers,
  type AwardTier,
} from "@/src/lib/hofTierUtils";

type Year = {
  id: string;
  code: string;
  title: string;
  displayOrder: number;
  value: number;
};

type HallOfFame = {
  id: string;
  code: string;
  title: string;
  displayOrder: number;
  minProminence: number;
  progressRegisterExcludeRetired?: boolean;
  progressRegisterExcludeDeceased?: boolean;
  progressRegisterExcludeInactive?: boolean;
  progressRegisterInactivityYears?: number;
};

type MemberStats = {
  member: {
    id: string;
    username: string;
    displayName: string;
    status: string;
    birthYear: number | null;
  };
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  fpr: number;
  isNewEntrant: boolean;
  isFirstTimeAward: boolean;
  awardTierName: string | null;
  dataNotProvided: boolean;
  hasLce: boolean;
  memberAge: number | null;
};

type ProgressMemberStats = {
  member: {
    id: string;
    username: string;
    displayName: string;
    status: string;
    birthYear: number | null;
  };
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  fpr: number;
  dataNotProvided: boolean;
  isNewEntrant: boolean;
  hasLce: boolean;
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
  lceEnabled?: boolean;
  lceMinFpr?: number;
  lceMinPeaks?: number | null;
  lceMinForeignPeaks?: number | null;
};

type HofEntry = {
  id: string;
  hofId: string;
  yearId: string;
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  foreignPeaksInYear: number;
  hof: {
    id: string;
    code: string;
    title: string;
    displayOrder: number;
  };
  year: {
    id: string;
    code: string;
    title: string;
    displayOrder: number;
  };
};

type HofData = {
  members: MemberStats[];
  progressRegisterMembers: ProgressMemberStats[];
  yearValue: number;
  years: Year[];
  hofs: HallOfFame[];
  selectedYearId: string;
  selectedHofId: string;
  config: HofYearConfig;
  awardTiers: AwardTier[];
  totalActiveMembers: number;
};

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hofDataMap, setHofDataMap] = useState<Map<string, HofData>>(new Map());
  const [myBagsData, setMyBagsData] = useState<{ entries: HofEntry[] } | null>(
    null,
  );
  const [years, setYears] = useState<Year[]>([]);
  const [hofs, setHofs] = useState<HallOfFame[]>([]);

  useEffect(() => {
    fetchData();
  }, [selectedYearId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch my-bags data first to get user's entries
      const myBagsResponse = await fetch("/api/my-bags");
      if (!myBagsResponse.ok) throw new Error("Failed to fetch user data");
      const myBags = await myBagsResponse.json();
      setMyBagsData(myBags);

      // Fetch initial HOF data to get years and HOFs list
      const initialResponse = await fetch("/api/hof-tables");
      if (!initialResponse.ok) throw new Error("Failed to fetch HOF data");
      const initialData = await initialResponse.json();

      setYears(initialData.years || []);
      setHofs(initialData.hofs || []);

      // Set selected year to default if not set
      if (!selectedYearId && initialData.selectedYearId) {
        setSelectedYearId(initialData.selectedYearId);
      }

      const yearId = selectedYearId || initialData.selectedYearId;

      // Fetch data for all HOFs in parallel
      const hofPromises = (initialData.hofs || []).map((hof: HallOfFame) =>
        fetch(`/api/hof-tables?yearId=${yearId}&hofId=${hof.id}`).then((res) =>
          res.ok ? res.json() : null,
        ),
      );

      const hofResults = await Promise.all(hofPromises);

      // Build map of HOF data
      const dataMap = new Map<string, HofData>();
      hofResults.forEach((data, index) => {
        if (data) {
          const hof = initialData.hofs[index];
          // Sort members using tie-breaking rules and assign ranks
          const sortedMembers = sortAndRankHofMembers(data.members || []);
          dataMap.set(hof.id, {
            ...data,
            members: sortedMembers,
          });
        }
      });

      setHofDataMap(dataMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYearId(e.target.value);
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-100">
          <LoadingSpinner size="lg" text="Loading your statistics..." />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card>
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  if (!myBagsData || myBagsData.entries.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <EmptyState
          icon={Mountain}
          title="Start Your Hall of Fame Journey"
          description="Begin tracking your climbing achievements and qualify for Hall of Fame recognition across multiple prominence categories."
          action={
            <div className="max-w-2xl mx-auto">
              <Card>
                <h3 className="text-lg font-semibold text-primary-400 mb-4">
                  P100 Hall of Fame Requirements
                </h3>
                <div className="space-y-3">
                  <RequirementItem
                    label="Minimum Age"
                    value="18 years old"
                    met={false}
                  />
                  <RequirementItem
                    label="Total Peaks (P100+)"
                    value="1,200 peaks minimum"
                    met={false}
                  />
                  <RequirementItem
                    label="Foreign Peaks"
                    value="20 peaks minimum"
                    met={false}
                  />
                  <RequirementItem
                    label="Foreign Peak Ratio (FPR)"
                    value="10% minimum"
                    met={false}
                  />
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() => router.push("/my-bags")}
                    className="w-full"
                  >
                    Track Your Ascents
                  </Button>
                </div>
              </Card>
            </div>
          }
        />
      </main>
    );
  }

  // Calculate aggregate statistics
  const currentYearData = Array.from(hofDataMap.values())[0];
  const userEntries = myBagsData.entries.filter(
    (e) => e.yearId === selectedYearId,
  );

  const stats = calculateAggregateStats(
    userEntries,
    hofDataMap,
    session?.user?.id || "",
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-400">
              My Hall of Fame Statistics
            </h1>
            <p className="text-gray-400 mt-1">
              Track your climbing achievements and progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedYearId || ""}
              onChange={handleYearChange}
              className="bg-dark-800 border border-dark-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.title}
                </option>
              ))}
            </select>
            <Button onClick={handleRefresh} variant="secondary">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="card bg-dark-800 border border-dark-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={Trophy}
              value={formatNumber(stats.totalPeaks)}
              label="Total Peaks"
            />
            <StatsCard
              icon={Globe}
              value={formatNumber(stats.foreignPeaks)}
              label="Foreign Peaks"
            />
            <StatsCard
              icon={Percent}
              value={`${stats.overallFpr.toFixed(1)}%`}
              label="Overall FPR"
            />
            <StatsCard
              icon={Award}
              value={`${stats.qualifiedHofs} of ${hofs.length}`}
              label="Qualified HOFs"
            />
          </div>
        </div>

        {/* Per-HOF Performance */}
        <PerHofSection
          hofs={hofs}
          hofDataMap={hofDataMap}
          userEntries={userEntries}
          userId={session?.user?.id || ""}
          myBagsData={myBagsData}
          years={years}
        />

        {/* Historical Progress */}
        <HistoricalSection myBagsData={myBagsData} years={years} />
      </div>
    </main>
  );
}

// Helper Components
function RequirementItem({
  label,
  value,
  met,
}: {
  label: string;
  value: string;
  met: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {met ? (
          <CheckCircle2 className="h-5 w-5 text-green-400" />
        ) : (
          <Circle className="h-5 w-5 text-gray-600" />
        )}
        <span className="text-gray-300">{label}</span>
      </div>
      <span className={met ? "text-green-400" : "text-gray-400"}>{value}</span>
    </div>
  );
}

function PerHofSection({
  hofs,
  hofDataMap,
  userEntries,
  userId,
  myBagsData,
  years,
}: {
  hofs: HallOfFame[];
  hofDataMap: Map<string, HofData>;
  userEntries: HofEntry[];
  userId: string;
  myBagsData: { entries: HofEntry[] };
  years: Year[];
}) {
  // Get current year from first entry
  const currentYearId = userEntries[0]?.yearId;
  const currentYear = years.find((y) => y.id === currentYearId);

  // Find previous year
  const previousYear = currentYear
    ? years.find((y) => y.value === currentYear.value - 1)
    : null;

  // Get previous year entries
  const previousYearEntries = previousYear
    ? myBagsData.entries.filter((e) => e.yearId === previousYear.id)
    : [];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">
        Hall of Fame Performance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hofs.map((hof) => {
          const hofData = hofDataMap.get(hof.id);
          if (!hofData) return null;

          const userEntry = userEntries.find((e) => e.hofId === hof.id);
          if (!userEntry) return null;

          const userMember = hofData.members.find(
            (m) => m.member.id === userId,
          );
          const userProgress = hofData.progressRegisterMembers.find(
            (m) => m.member.id === userId,
          );

          const isQualified = !!userMember;

          // Get previous year entry for this HOF
          const previousYearEntry = previousYearEntries.find(
            (e) => e.hofId === hof.id,
          );

          return (
            <HofCard
              key={hof.id}
              hof={hof}
              hofData={hofData}
              userEntry={userEntry}
              userMember={userMember}
              userProgress={userProgress}
              isQualified={isQualified}
              previousYearEntry={previousYearEntry}
              selectedYearId={currentYearId}
            />
          );
        })}
      </div>
    </div>
  );
}

function HofCard({
  hof,
  hofData,
  userEntry,
  userMember,
  userProgress,
  isQualified,
  previousYearEntry,
  selectedYearId,
}: {
  hof: HallOfFame;
  hofData: HofData;
  userEntry: HofEntry;
  userMember?: MemberStats;
  userProgress?: ProgressMemberStats;
  isQualified: boolean;
  previousYearEntry?: HofEntry;
  selectedYearId?: string;
}) {
  const currentTier =
    hofData.awardTiers && Array.isArray(hofData.awardTiers)
      ? getMemberTier(userEntry.totalPeaks, hofData.awardTiers)
      : null;

  const nextTier =
    currentTier && hofData.awardTiers
      ? hofData.awardTiers.find(
          (t) => t.displayOrder === currentTier.displayOrder + 1,
        )
      : null;

  const peaksToNext = nextTier ? nextTier.minPeaks - userEntry.totalPeaks : 0;

  const progressPercent =
    nextTier && currentTier
      ? ((userEntry.totalPeaks - currentTier.minPeaks) /
          (nextTier.minPeaks - currentTier.minPeaks)) *
        100
      : 100;

  const borderColor = currentTier
    ? getTierBorderColor(currentTier.name)
    : "border-dark-600";

  // Calculate trends
  const totalPeaksTrend = previousYearEntry
    ? userEntry.totalPeaks - previousYearEntry.totalPeaks
    : 0;
  const foreignPeaksTrend = previousYearEntry
    ? userEntry.foreignPeaks - previousYearEntry.foreignPeaks
    : 0;

  // Build HoF tables link
  const hofTablesLink = selectedYearId
    ? `/hof-tables?year=${selectedYearId}&hof=${hof.id}`
    : `/hof-tables?hof=${hof.id}`;

  if (isQualified && userMember) {
    const rank =
      hofData.members.findIndex((m) => m.member.id === userMember.member.id) +
      1;
    const totalMembers = hofData.members.length;
    const percentile = (rank / totalMembers) * 100;

    const fprMet = userMember.fpr >= hofData.config.minFpr;

    return (
      <Link
        href={hofTablesLink}
        className="block transition-transform hover:scale-[1.02]"
      >
        <Card className={`border-l-4 ${borderColor} cursor-pointer h-full`}>
          <div className="space-y-4">
            {/* Header with Title, Ranking and Tier Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">{hof.title}</h3>
                {currentTier && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getTierBgColor(
                      currentTier.name,
                    )} ${getTierTextColor(currentTier.name)}`}
                  >
                    {currentTier.name}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-base">
                    #{rank}
                  </span>
                  <span className="text-white text-base">
                    of {totalMembers}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30">
                    Top {percentile.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2">
              <div>
                <div className="text-xs text-gray-400 mb-1.5 font-medium">
                  Total Peaks
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-100 font-bold text-base">
                    {formatNumber(userEntry.totalPeaks)}
                  </span>
                  {totalPeaksTrend > 0 && (
                    <ArrowUp className="h-4 w-4 text-green-400" />
                  )}
                  {totalPeaksTrend < 0 && (
                    <ArrowDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1.5 font-medium">
                  Foreign Peaks / FPR
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-100 font-bold text-base">
                    {formatNumber(userEntry.foreignPeaks)} /{" "}
                    {userMember.fpr.toFixed(1)}%
                  </span>
                  {foreignPeaksTrend > 0 && (
                    <ArrowUp className="h-4 w-4 text-green-400" />
                  )}
                  {foreignPeaksTrend < 0 && (
                    <ArrowDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Progress to Next Tier */}
            {nextTier && (
              <div className="pt-3 border-t border-dark-700/50">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-500">
                    Progress to {nextTier.name}
                  </span>
                  <span className="text-gray-500">
                    {formatNumber(peaksToNext)} more peaks
                  </span>
                </div>
                <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-600 transition-all"
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Badges */}
            {(userMember.isNewEntrant ||
              userMember.isFirstTimeAward ||
              userMember.hasLce) && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-dark-700/50">
                {userMember.isNewEntrant && (
                  <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-600/50">
                    New Entrant
                  </span>
                )}
                {userMember.isFirstTimeAward && (
                  <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-600/50">
                    New {currentTier?.name} Award
                  </span>
                )}
                {userMember.hasLce && (
                  <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-600/50">
                    LCE
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
      </Link>
    );
  }

  // Progress Register
  if (userProgress) {
    return (
      <Link
        href={hofTablesLink}
        className="block transition-transform hover:scale-[1.02]"
      >
        <Card className="border-l-4 border-yellow-600/50 cursor-pointer h-full">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{hof.title}</h3>
                <p className="text-xs text-yellow-400 mt-1">
                  Working Toward Qualification
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            {(() => {
              const effectivePeaksRequirement =
                userProgress.hasLce &&
                hofData.config.lceMinPeaks !== null &&
                hofData.config.lceMinPeaks !== undefined
                  ? hofData.config.lceMinPeaks
                  : hofData.config.minPeaks;
              const effectiveForeignPeaksRequirement =
                userProgress.hasLce &&
                hofData.config.lceMinForeignPeaks !== null &&
                hofData.config.lceMinForeignPeaks !== undefined
                  ? hofData.config.lceMinForeignPeaks
                  : hofData.config.minForeignPeaks;
              const effectiveFprRequirement =
                userProgress.hasLce &&
                hofData.config.lceMinFpr !== null &&
                hofData.config.lceMinFpr !== undefined
                  ? hofData.config.lceMinFpr
                  : hofData.config.minFpr;

              const failedMinimumPeaks =
                hofData.config.minPeaksEnabled !== false &&
                effectivePeaksRequirement > 0 &&
                userProgress.totalPeaks < effectivePeaksRequirement;
              const failedMinimumForeignPeaks =
                hofData.config.minForeignPeaksEnabled !== false &&
                effectiveForeignPeaksRequirement > 0 &&
                userProgress.foreignPeaks < effectiveForeignPeaksRequirement;
              const failedMinimumFpr =
                hofData.config.minFprEnabled !== false &&
                effectiveFprRequirement > 0 &&
                userProgress.fpr < effectiveFprRequirement;

              return (
                <div className="grid grid-cols-2 gap-4">
                  {hofData.config.minPeaksEnabled !== false &&
                    hofData.config.minPeaks > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-400 font-medium">
                            Total Peaks
                          </span>
                          {failedMinimumPeaks ? (
                            <span className="text-xs text-red-400">
                              Not Met
                            </span>
                          ) : (
                            <span className="text-xs text-green-400">
                              Met ✓
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-100 font-bold text-base">
                            {formatNumber(userProgress.totalPeaks)}
                          </span>
                        </div>
                        {failedMinimumPeaks && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-400 mb-1">
                              Required:{" "}
                              {formatNumber(effectivePeaksRequirement)}
                              {userProgress.hasLce &&
                                hofData.config.lceMinPeaks !== null &&
                                " (LCE)"}
                            </div>
                            <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500 transition-all"
                                style={{
                                  width: `${Math.min(
                                    (userProgress.totalPeaks /
                                      effectivePeaksRequirement) *
                                      100,
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {((hofData.config.minForeignPeaksEnabled !== false &&
                    hofData.config.minForeignPeaks > 0) ||
                    (hofData.config.minFprEnabled !== false &&
                      hofData.config.minFpr > 0)) && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-400 font-medium">
                          Foreign Peaks / FPR
                        </span>
                        <div className="flex items-center gap-2">
                          {hofData.config.minForeignPeaksEnabled !== false &&
                          failedMinimumForeignPeaks ? (
                            <span className="text-xs text-red-400">
                              Not Met
                            </span>
                          ) : hofData.config.minForeignPeaksEnabled !==
                            false ? (
                            <span className="text-xs text-green-400">
                              Met ✓
                            </span>
                          ) : null}
                          {hofData.config.minFprEnabled !== false &&
                          failedMinimumFpr ? (
                            <span className="text-xs text-red-400">
                              Not Met
                            </span>
                          ) : hofData.config.minFprEnabled !== false ? (
                            <span className="text-xs text-green-400">
                              Met ✓
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-100 font-bold text-base">
                          {formatNumber(userProgress.foreignPeaks)} /{" "}
                          {userProgress.fpr.toFixed(1)}%
                        </span>
                      </div>
                      {((hofData.config.minForeignPeaksEnabled !== false &&
                        failedMinimumForeignPeaks) ||
                        (hofData.config.minFprEnabled !== false &&
                          failedMinimumFpr)) && (
                        <div className="mt-2 space-y-1">
                          {hofData.config.minForeignPeaksEnabled !== false &&
                            failedMinimumForeignPeaks && (
                              <div className="text-xs text-gray-400">
                                FP Required:{" "}
                                {formatNumber(effectiveForeignPeaksRequirement)}
                                {userProgress.hasLce &&
                                  hofData.config.lceMinForeignPeaks !== null &&
                                  " (LCE)"}
                              </div>
                            )}
                          {hofData.config.minFprEnabled !== false &&
                            failedMinimumFpr && (
                              <div className="text-xs text-gray-400">
                                FPR Required:{" "}
                                {effectiveFprRequirement.toFixed(1)}%
                                {userProgress.hasLce && " (LCE)"}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Badges */}
            {(userProgress.isNewEntrant || userProgress.hasLce) && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-dark-700/50">
                {userProgress.isNewEntrant && (
                  <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-600/50">
                    New Entrant
                  </span>
                )}
                {userProgress.hasLce && (
                  <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-600/50">
                    LCE
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
      </Link>
    );
  }

  return null;
}

function ProgressBar({
  label,
  current,
  required,
  failed,
  isPercent = false,
}: {
  label: string;
  current: number;
  required: number;
  failed: boolean;
  isPercent?: boolean;
}) {
  const progress = Math.min((current / required) * 100, 100);
  const stillNeeded = Math.max(required - current, 0);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-white">
            {isPercent ? current.toFixed(1) : formatNumber(current)}
            {isPercent ? "%" : ""}
          </span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">
            {isPercent ? required.toFixed(1) : formatNumber(required)}
            {isPercent ? "%" : ""}
          </span>
        </div>
      </div>
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            failed ? "bg-red-500" : "bg-green-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {stillNeeded > 0 && (
        <p className="text-xs text-red-400">
          {isPercent ? `${stillNeeded.toFixed(1)}%` : formatNumber(stillNeeded)}{" "}
          more needed
        </p>
      )}
    </div>
  );
}

function HistoricalSection({
  myBagsData,
  years,
}: {
  myBagsData: { entries: HofEntry[] };
  years: Year[];
}) {
  // Group entries by year
  const yearGroups = new Map<string, HofEntry[]>();
  myBagsData.entries.forEach((entry) => {
    const existing = yearGroups.get(entry.yearId) || [];
    existing.push(entry);
    yearGroups.set(entry.yearId, existing);
  });

  const yearStats = Array.from(yearGroups.entries())
    .map(([yearId, entries]) => {
      const year = years.find((y) => y.id === yearId);
      const totalPeaks = Math.max(...entries.map((e) => e.totalPeaks));
      const peaksThisYear = Math.max(...entries.map((e) => e.peaksInYear));
      const foreignPeaks = Math.max(...entries.map((e) => e.foreignPeaks));
      const fpr = totalPeaks > 0 ? (foreignPeaks / totalPeaks) * 100 : 0;

      return {
        yearId,
        yearTitle: year?.title || yearId,
        yearValue: year?.value || 0,
        totalPeaks,
        peaksThisYear,
        foreignPeaks,
        fpr,
        entries,
      };
    })
    .sort((a, b) => b.yearValue - a.yearValue);

  const mostProductiveYear = yearStats
    .filter((y) => y.yearTitle !== "< 2019")
    .reduce(
      (max, curr) => (curr.peaksThisYear > max.peaksThisYear ? curr : max),
      yearStats.filter((y) => y.yearTitle !== "< 2019")[0],
    );

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Historical Progress</h2>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">
                    Year
                  </th>
                  <th className="text-right py-3 px-4 pr-8 text-gray-400 text-sm font-medium">
                    Peaks Added
                  </th>
                  <th className="text-right py-3 px-4 pr-8 text-gray-400 text-sm font-medium">
                    Total Peaks
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 text-sm font-medium">
                    Foreign Peaks Total
                  </th>
                  <th className="text-right py-3 px-4 pr-8 text-gray-400 text-sm font-medium">
                    FPR
                  </th>
                </tr>
              </thead>
              <tbody>
                {yearStats.map((stat, index) => {
                  const prevStat = yearStats[index + 1];
                  const peaksAddedTrend = prevStat
                    ? stat.peaksThisYear - prevStat.peaksThisYear
                    : 0;
                  const totalTrend = prevStat
                    ? stat.totalPeaks - prevStat.totalPeaks
                    : 0;
                  const fprTrend = prevStat ? stat.fpr - prevStat.fpr : 0;
                  const isMostProductive =
                    stat.yearId === mostProductiveYear?.yearId;

                  return (
                    <tr
                      key={stat.yearId}
                      className={`border-b border-dark-700 ${
                        isMostProductive
                          ? "bg-yellow-900/10 border-yellow-500/50"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {stat.yearTitle}
                          </span>
                          {isMostProductive && (
                            <span className="text-xs text-yellow-400">
                              ⭐ Most Productive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-2 min-w-20">
                          <span className="text-white">
                            {formatNumber(stat.peaksThisYear)}
                          </span>
                          {peaksAddedTrend > 0 && (
                            <ArrowUp className="h-4 w-4 text-green-400" />
                          )}
                          {peaksAddedTrend < 0 && (
                            <ArrowDown className="h-4 w-4 text-red-400" />
                          )}
                          {peaksAddedTrend === 0 && <div className="h-4 w-4" />}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-2 min-w-20">
                          <span className="text-white">
                            {formatNumber(stat.totalPeaks)}
                          </span>
                          {totalTrend > 0 && (
                            <ArrowUp className="h-4 w-4 text-green-400" />
                          )}
                          {totalTrend < 0 && (
                            <ArrowDown className="h-4 w-4 text-red-400" />
                          )}
                          {totalTrend === 0 && <div className="h-4 w-4" />}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-white">
                        {formatNumber(stat.foreignPeaks)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-2 min-w-20">
                          <span className="text-white">
                            {stat.fpr.toFixed(1)}%
                          </span>
                          {fprTrend > 0 && (
                            <ArrowUp className="h-4 w-4 text-green-400" />
                          )}
                          {fprTrend < 0 && (
                            <ArrowDown className="h-4 w-4 text-red-400" />
                          )}
                          {fprTrend === 0 && <div className="h-4 w-4" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {yearStats.map((stat, index) => {
          const prevStat = yearStats[index + 1];
          const fprTrend = prevStat ? stat.fpr - prevStat.fpr : 0;
          const isMostProductive = stat.yearId === mostProductiveYear?.yearId;

          return (
            <Card
              key={stat.yearId}
              className={
                isMostProductive ? "border-yellow-500/50 bg-yellow-900/10" : ""
              }
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    {stat.yearTitle}
                  </h3>
                  {isMostProductive && (
                    <span className="text-xs text-yellow-400">
                      ⭐ Most Productive
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Peaks Added</p>
                    <p className="text-white font-medium">
                      {formatNumber(stat.peaksThisYear)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Peaks</p>
                    <p className="text-white font-medium">
                      {formatNumber(stat.totalPeaks)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Foreign Peaks</p>
                    <p className="text-white font-medium">
                      {formatNumber(stat.foreignPeaks)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">FPR</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">
                        {stat.fpr.toFixed(1)}%
                      </p>
                      {fprTrend > 0 && (
                        <ArrowUp className="h-4 w-4 text-green-400" />
                      )}
                      {fprTrend < 0 && (
                        <ArrowDown className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AchievementsSection({
  stats,
  myBagsData,
  hofDataMap,
  userId,
}: {
  stats: any;
  myBagsData: { entries: HofEntry[] };
  hofDataMap: Map<string, HofData>;
  userId: string;
}) {
  // Find next milestones
  const milestones: Array<{
    hof: string;
    tier: string;
    peaksNeeded: number;
  }> = [];

  hofDataMap.forEach((hofData, hofId) => {
    const userEntry = myBagsData.entries.find((e) => e.hofId === hofId);
    if (!userEntry || !hofData.awardTiers || !Array.isArray(hofData.awardTiers))
      return;

    const currentTier = getMemberTier(userEntry.totalPeaks, hofData.awardTiers);
    const nextTier = currentTier
      ? hofData.awardTiers.find(
          (t) => t.displayOrder === currentTier.displayOrder + 1,
        )
      : hofData.awardTiers[0];

    if (nextTier) {
      const peaksNeeded = nextTier.minPeaks - userEntry.totalPeaks;
      if (peaksNeeded > 0) {
        milestones.push({
          hof: userEntry.hof.title,
          tier: nextTier.name,
          peaksNeeded,
        });
      }
    }
  });

  const sortedMilestones = milestones
    .sort((a, b) => a.peaksNeeded - b.peaksNeeded)
    .slice(0, 5);

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">
        Highlights & Milestones
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.highestTier && (
          <Card>
            <div className="text-center space-y-2">
              <div className="text-4xl">🏆</div>
              <h3 className="text-sm text-gray-400">Top Achievement</h3>
              <p
                className={`text-2xl font-bold ${getTierTextColor(
                  stats.highestTier,
                )}`}
              >
                {stats.highestTier}
              </p>
            </div>
          </Card>
        )}

        <Card>
          <div className="text-center space-y-2">
            <div className="text-4xl">📊</div>
            <h3 className="text-sm text-gray-400">Best FPR</h3>
            <p className="text-2xl font-bold text-white">
              {stats.overallFpr.toFixed(1)}%
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center space-y-2">
            <div className="text-4xl">📅</div>
            <h3 className="text-sm text-gray-400">Active Years</h3>
            <p className="text-2xl font-bold text-white">{stats.yearsActive}</p>
          </div>
        </Card>

        {sortedMilestones.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary-400" />
                <h3 className="text-lg font-semibold text-white">
                  Next Milestones
                </h3>
              </div>
              <div className="space-y-3">
                {sortedMilestones.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">
                          {milestone.hof} → {milestone.tier}
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatNumber(milestone.peaksNeeded)} more
                        </span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getTierTextColor(
                            milestone.tier,
                          )} bg-current transition-all`}
                          style={{ width: "20%" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper function to calculate aggregate stats
function calculateAggregateStats(
  userEntries: HofEntry[],
  hofDataMap: Map<string, HofData>,
  userId: string,
) {
  let totalPeaks = 0;
  let foreignPeaks = 0;
  let qualifiedHofs = 0;
  let progressRegisterCount = 0;
  let highestTier: string | null = null;
  let highestTierOrder = -1;

  const uniqueYears = new Set<string>();

  hofDataMap.forEach((hofData, hofId) => {
    const entry = userEntries.find((e) => e.hofId === hofId);
    if (!entry) return;

    uniqueYears.add(entry.yearId);

    if (entry.totalPeaks > totalPeaks) {
      totalPeaks = entry.totalPeaks;
    }
    if (entry.foreignPeaks > foreignPeaks) {
      foreignPeaks = entry.foreignPeaks;
    }

    const isQualified = hofData.members.some((m) => m.member.id === userId);
    const isProgress = hofData.progressRegisterMembers.some(
      (m) => m.member.id === userId,
    );

    if (isQualified) {
      qualifiedHofs++;
      const member = hofData.members.find((m) => m.member.id === userId);
      if (
        member?.awardTierName &&
        hofData.awardTiers &&
        Array.isArray(hofData.awardTiers)
      ) {
        const tier = getMemberTier(entry.totalPeaks, hofData.awardTiers);
        if (tier && tier.displayOrder > highestTierOrder) {
          highestTier = tier.name;
          highestTierOrder = tier.displayOrder;
        }
      }
    } else if (isProgress) {
      progressRegisterCount++;
    }
  });

  const overallFpr = totalPeaks > 0 ? (foreignPeaks / totalPeaks) * 100 : 0;
  const yearsActive = uniqueYears.size;

  return {
    totalPeaks,
    foreignPeaks,
    overallFpr,
    qualifiedHofs,
    progressRegisterCount,
    highestTier,
    yearsActive,
  };
}
