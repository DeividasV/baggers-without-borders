"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatNumber } from "@/src/lib/utils";
import { type AwardTier, getTierTextColor, getTierBgColor } from "@/src/lib/hofTierUtils";
import { User, Settings, Edit3, Pencil, Check } from "lucide-react";
import { Button } from "@/app/components/ui";

type MemberStats = {
  entryId?: string | null;
  member: {
    id: string;
    username: string;
    displayName: string;
    status: string;
    retiredYear?: number | null;
    deceasedYear?: number | null;
  };
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  foreignPeaksInYear: number;
  fpr: number;
  isNewEntrant: boolean;
  isFirstTimeAward: boolean;
  awardTierName: string | null;
  hasLce: boolean;
  lceCountryId: string | null;
  firstQualificationYear: string | null;
  dataNotProvided?: boolean;
};

type HofMemberExpandedDetailsProps = {
  memberData: MemberStats;
  rank: number;
  totalMembers: number;
  totalActiveMembers: number;
  currentTier: AwardTier | null;
  nextTier: AwardTier | null;
  yearLabel: string;
  hofLabel: string;
  isAdmin?: boolean;
  hofId?: string;
  yearId?: string;
  config?: {
    minPeaks: number;
    minPeaksEnabled?: boolean;
    minForeignPeaks: number;
    minForeignPeaksEnabled?: boolean;
    minFpr: number;
    minFprEnabled?: boolean;
    lceEnabled?: boolean;
    lceMinPeaks?: number | null;
    lceMinForeignPeaks?: number | null;
    lceMinFpr?: number | null;
    hofmeister?: {
      id: string;
      displayName: string;
      username: string;
    } | null;
  } | null;
  isEditing?: boolean;
  isSaving?: boolean;
  showSuccess?: boolean;
  onEditStart?: () => void;
  onSave?: (
    entryId: string,
    data: { peaksInYear: number; foreignPeaksInYear: number }
  ) => Promise<void>;
  onCancel?: () => void;
};

export default function HofMemberExpandedDetails({
  memberData,
  rank,
  totalMembers,
  totalActiveMembers,
  currentTier,
  nextTier,
  yearLabel,
  hofLabel,
  isAdmin = false,
  hofId,
  yearId,
  config,
  isEditing = false,
  isSaving = false,
  showSuccess = false,
  onEditStart,
  onSave,
  onCancel,
}: HofMemberExpandedDetailsProps) {
  // Local state for inline editing
  const [peaksInYear, setPeaksInYear] = useState(memberData.peaksInYear);
  const [foreignPeaksInYear, setForeignPeaksInYear] = useState(memberData.foreignPeaksInYear);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset local state when memberData changes or editing stops
  useEffect(() => {
    if (!isEditing) {
      setPeaksInYear(memberData.peaksInYear);
      setForeignPeaksInYear(memberData.foreignPeaksInYear);
      setErrors({});
    }
  }, [isEditing, memberData.peaksInYear, memberData.foreignPeaksInYear]);

  // Calculate real-time values
  const updatedTotalPeaks = memberData.totalPeaks - memberData.peaksInYear + peaksInYear;
  const updatedForeignPeaks =
    memberData.foreignPeaks - memberData.foreignPeaksInYear + foreignPeaksInYear;
  const calculatedFpr = updatedTotalPeaks > 0 ? (updatedForeignPeaks / updatedTotalPeaks) * 100 : 0;

  // Validation
  useEffect(() => {
    if (!isEditing) return;

    const newErrors: Record<string, string> = {};
    if (peaksInYear < 0) newErrors.peaksInYear = "Must be 0 or greater";
    if (foreignPeaksInYear < 0) newErrors.foreignPeaksInYear = "Must be 0 or greater";
    if (foreignPeaksInYear > peaksInYear)
      newErrors.foreignPeaksInYear = `Cannot exceed total peaks (max: ${peaksInYear})`;
    setErrors(newErrors);
  }, [peaksInYear, foreignPeaksInYear, isEditing]);

  const handleSave = async () => {
    if (Object.keys(errors).length > 0 || !memberData.entryId || !onSave) return;
    await onSave(memberData.entryId, { peaksInYear, foreignPeaksInYear });
  };

  const peaksToNextTier = nextTier ? nextTier.minPeaks - memberData.totalPeaks : 0;

  // Percentile among members in this filtered HOF table
  const tablePercentile = (rank / totalMembers) * 100;

  // Estimate overall percentile among all active members
  // Formula: Members who qualified (totalMembers) represent a subset of all active members
  // If someone is rank X in the qualified list, their overall rank is approximately:
  // X + (totalActiveMembers - totalMembers) = X adjusted for non-qualified members
  // Then convert to percentile
  const estimatedOverallRank = rank; // In qualified set
  const estimatedOverallPercentile = (estimatedOverallRank / totalActiveMembers) * 100;

  const tierColor = currentTier ? getTierTextColor(currentTier.name) : "";
  const tierBgColor = currentTier ? getTierBgColor(currentTier.name) : "";

  return (
    <div className="bg-dark-900/50 border-t border-dark-600 p-6 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ranking Info */}
        <div className="space-y-3">
          <h4 className="font-semibold text-primary-400 mb-3">Ranking Position</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Rank:</span>
              <span className="font-medium text-white">
                #{rank} of {totalMembers}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Among qualified:</span>
              <span className="font-medium text-white">Top {tablePercentile.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Among all active:</span>
              <span className="font-medium text-primary-300">
                ~Top {Math.max(1, estimatedOverallPercentile).toFixed(1)}%
              </span>
            </div>
            {currentTier && (
              <div className="flex justify-between">
                <span className="text-gray-400">Current Award:</span>
                <span className={`font-medium ${tierColor}`}>{currentTier.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-3">
          <h4 className="font-semibold text-primary-400 mb-3">Climbing Statistics</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Peaks ({hofLabel}):</span>
              <span className={`font-medium ${isEditing ? "text-primary-300" : "text-white"}`}>
                {formatNumber(isEditing ? updatedTotalPeaks : memberData.totalPeaks)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Foreign Peaks:</span>
              <span className={`font-medium ${isEditing ? "text-primary-300" : "text-white"}`}>
                {formatNumber(isEditing ? updatedForeignPeaks : memberData.foreignPeaks)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Foreign Peak Ratio:</span>
              <span className={`font-medium ${isEditing ? "text-primary-300" : "text-white"}`}>
                {isEditing ? calculatedFpr.toFixed(1) : memberData.fpr.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Peaks in {yearLabel}:</span>
              <span className={`font-medium ${isEditing ? "text-primary-300" : "text-white"}`}>
                {formatNumber(isEditing ? peaksInYear : memberData.peaksInYear)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Foreign Peaks in {yearLabel}:</span>
              <span className={`font-medium ${isEditing ? "text-primary-300" : "text-white"}`}>
                {formatNumber(isEditing ? foreignPeaksInYear : memberData.foreignPeaksInYear)}
              </span>
            </div>

            {memberData.firstQualificationYear && (
              <div className="flex justify-between pt-2 mt-2 border-t border-dark-700">
                <span className="text-gray-400">First Qualified:</span>
                <span className="font-medium text-primary-300">
                  {memberData.firstQualificationYear}
                </span>
              </div>
            )}
            {(() => {
              // Smart LCE badge logic: only show if member benefited from LCE
              // Show badge if: hasLce AND (fails any standard threshold BUT passes with LCE)
              if (!memberData.hasLce || !config || !config.lceEnabled) {
                return null;
              }

              // Check if member fails any standard threshold
              const failsStandardFpr =
                config.minFprEnabled !== false &&
                config.minFpr > 0 &&
                memberData.fpr < config.minFpr;

              const failsStandardPeaks =
                config.minPeaksEnabled !== false &&
                config.minPeaks > 0 &&
                memberData.totalPeaks < config.minPeaks;

              const failsStandardForeignPeaks =
                config.minForeignPeaksEnabled !== false &&
                config.minForeignPeaks > 0 &&
                memberData.foreignPeaks < config.minForeignPeaks;

              // Check if LCE thresholds are actually different (not null = same as standard)
              const hasLceFprBenefit = config.lceMinFpr !== null && config.lceMinFpr !== undefined;
              const hasLcePeaksBenefit =
                config.lceMinPeaks !== null && config.lceMinPeaks !== undefined;
              const hasLceForeignPeaksBenefit =
                config.lceMinForeignPeaks !== null && config.lceMinForeignPeaks !== undefined;

              // Show badge if member fails any standard threshold AND has LCE benefit for it
              const shouldShowBadge =
                (failsStandardFpr && hasLceFprBenefit) ||
                (failsStandardPeaks && hasLcePeaksBenefit) ||
                (failsStandardForeignPeaks && hasLceForeignPeaksBenefit);

              if (!shouldShowBadge) {
                return null;
              }

              return (
                <div className="pt-2 mt-2 border-t border-dark-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Large Country Exception:</span>
                    <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-1 rounded-full border border-primary-600/50">
                      Applied
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Lower FPR threshold applied for this member
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Award Progress */}
        <div className="space-y-3">
          <h4 className="font-semibold text-primary-400 mb-3">Award Progress</h4>
          {currentTier && (
            <div className="space-y-4 text-sm">
              {/* Current tier info */}
              <div className={`rounded-lg p-4 border ${tierBgColor} backdrop-blur-sm`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Current Tier</div>
                    <div className={`text-2xl font-bold ${tierColor} tracking-tight`}>
                      {currentTier.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatNumber(currentTier.minPeaks)} -{" "}
                      {currentTier.maxPeaks ? formatNumber(currentTier.maxPeaks) : "∞"} peaks
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 mb-1">Your Total</div>
                    <div className={`text-2xl font-bold ${tierColor}`}>
                      {formatNumber(memberData.totalPeaks)}
                    </div>
                  </div>
                </div>

                {/* Next tier message */}
                {nextTier && (
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>Need</span>
                      <span className="font-medium text-gray-400">
                        {formatNumber(peaksToNextTier)} more
                      </span>
                      <span>peaks to reach</span>
                      <span className="text-gray-400 font-medium">{nextTier.name}</span>
                    </div>
                  </div>
                )}

                {!nextTier && (
                  <div className="mt-4 pt-4 border-t border-dark-700">
                    <div className="text-center">
                      <span className="text-2xl">🏆</span>
                      <div className={`text-sm font-semibold ${tierColor} mt-2`}>
                        Highest Tier Achieved!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!currentTier && (
            <div className="text-sm text-gray-400 p-4 bg-dark-800/50 rounded-lg border border-dark-600">
              No award tier yet. Keep climbing!
            </div>
          )}
        </div>
      </div>

      {/* Additional Info */}
      {memberData.isNewEntrant && (
        <div className="mt-4 pt-4 border-t border-dark-600">
          <div className="text-green-400 bg-green-900/20 rounded-lg p-3 border border-green-600/30">
            <p className="font-medium text-sm">New Entrant</p>
            <p className="text-xs text-gray-400 mt-1">
              This is the first year {memberData.member.displayName} has met the minimum
              requirements for the {hofLabel} Hall of Fame. Welcome to the club!
            </p>
          </div>
        </div>
      )}

      {/* First Time Award Badge */}
      {memberData.isFirstTimeAward && memberData.awardTierName && (
        <div className={memberData.isNewEntrant ? "mt-3" : "mt-4 pt-4 border-t border-dark-600"}>
          <div className="text-yellow-400 bg-yellow-900/20 rounded-lg p-3 border border-yellow-600/30">
            <p className="font-medium text-sm">New {memberData.awardTierName} Award</p>
            <p className="text-xs text-gray-400 mt-1">
              First time achieving {memberData.awardTierName} tier in {yearLabel} {hofLabel}.
              Congratulations!
            </p>
          </div>
        </div>
      )}

      {/* Retired Badge */}
      {memberData.member.retiredYear && (
        <div
          className={
            memberData.isNewEntrant || memberData.isFirstTimeAward
              ? "mt-3"
              : "mt-4 pt-4 border-t border-dark-600"
          }
        >
          <div className="text-blue-300 bg-blue-900/20 rounded-lg p-3 border border-blue-600/30">
            <p className="font-medium text-sm">Retired in {memberData.member.retiredYear}</p>
            <p className="text-xs text-gray-400 mt-1">
              {memberData.member.displayName} has retired from active peak-bagging activities.
            </p>
          </div>
        </div>
      )}

      {/* Deceased Badge */}
      {memberData.member.deceasedYear && (
        <div
          className={
            memberData.isNewEntrant || memberData.isFirstTimeAward || memberData.member.retiredYear
              ? "mt-3"
              : "mt-4 pt-4 border-t border-dark-600"
          }
        >
          <div className="text-gray-400 bg-gray-900/20 rounded-lg p-3 border border-gray-600/30">
            <p className="font-medium text-sm">
              Deceased
              {memberData.member.deceasedYear && ` in ${memberData.member.deceasedYear}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              In memory of {memberData.member.displayName} and their contributions to the climbing
              community.
            </p>
          </div>
        </div>
      )}

      {/* No Data Badge */}
      {memberData.dataNotProvided && (
        <div
          className={
            memberData.isNewEntrant ||
            memberData.isFirstTimeAward ||
            memberData.member.retiredYear ||
            memberData.member.deceasedYear
              ? "mt-3"
              : "mt-4 pt-4 border-t border-dark-600"
          }
        >
          <div className="text-gray-300 bg-gray-800/20 rounded-lg p-3 border border-gray-500/30">
            <p className="font-medium text-sm">No Data in {yearLabel}</p>
            <p className="text-xs text-gray-400 mt-1">
              {memberData.member.displayName} did not provide climbing data for the {yearLabel}{" "}
              year.
            </p>
          </div>
        </div>
      )}

      {/* Admin Quick Navigation */}
      {isAdmin && hofId && yearId && (
        <div
          className={
            memberData.isNewEntrant ||
            memberData.isFirstTimeAward ||
            memberData.member.retiredYear ||
            memberData.member.deceasedYear ||
            memberData.dataNotProvided
              ? "mt-3"
              : "mt-4 pt-4 border-t border-dark-600"
          }
        >
          <div className="bg-dark-800/30 rounded-lg p-4 border border-dark-600">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Admin Quick Actions</h4>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/members/${memberData.member.id}?returnTo=${encodeURIComponent(
                  `/hof-tables?year=${yearId}&hof=${hofId}`
                )}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-600/50 hover:border-primary-500 text-primary-300 hover:text-primary-200 rounded-lg text-sm font-medium transition-colors"
              >
                <User className="h-4 w-4" />
                Member Profile
              </Link>
              <Link
                href={`/admin/data-entry?member=${memberData.member.id}&hof=${hofId}&year=${yearId}&sortBy=member.displayName&sortOrder=asc`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-600/50 hover:border-primary-500 text-primary-300 hover:text-primary-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                Data Entry
              </Link>
              {/* Inline Edit Button or Inputs */}
              {memberData.entryId && onEditStart && (
                <>
                  {!isEditing ? (
                    <button
                      onClick={onEditStart}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-600/50 hover:border-primary-500 text-primary-300 hover:text-primary-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Data
                    </button>
                  ) : (
                    <div className="w-full flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap gap-2">
                      <div className="w-full md:flex-1">
                        <label
                          htmlFor="inline-peaks-in-year"
                          className="text-xs text-gray-400 mb-1 block"
                        >
                          Peaks in {yearLabel}
                        </label>
                        <input
                          id="inline-peaks-in-year"
                          type="number"
                          value={peaksInYear}
                          onChange={(e) => setPeaksInYear(parseInt(e.target.value) || 0)}
                          min={0}
                          disabled={isSaving}
                          className={`w-full px-3 py-2 bg-dark-800 border rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 ${
                            errors.peaksInYear
                              ? "border-red-500 focus:ring-red-500"
                              : "border-primary-600/50 focus:ring-primary-500"
                          }`}
                        />
                        {errors.peaksInYear && (
                          <p className="text-xs text-red-400 mt-1">{errors.peaksInYear}</p>
                        )}
                      </div>
                      <div className="w-full md:flex-1">
                        <label
                          htmlFor="inline-foreign-peaks-in-year"
                          className="text-xs text-gray-400 mb-1 block"
                        >
                          Foreign Peaks in {yearLabel}
                        </label>
                        <input
                          id="inline-foreign-peaks-in-year"
                          type="number"
                          value={foreignPeaksInYear}
                          onChange={(e) => setForeignPeaksInYear(parseInt(e.target.value) || 0)}
                          min={0}
                          disabled={isSaving}
                          className={`w-full px-3 py-2 bg-dark-800 border rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 ${
                            errors.foreignPeaksInYear
                              ? "border-red-500 focus:ring-red-500"
                              : "border-primary-600/50 focus:ring-primary-500"
                          }`}
                        />
                        {errors.foreignPeaksInYear && (
                          <p className="text-xs text-red-400 mt-1">{errors.foreignPeaksInYear}</p>
                        )}
                      </div>
                      <div className="w-full md:w-auto flex flex-col md:flex-row gap-2 md:items-end lg:self-end lg:pb-0.5">
                        <Button
                          onClick={handleSave}
                          disabled={Object.keys(errors).length > 0 || isSaving}
                          className="w-full md:w-auto text-sm py-2 px-4 whitespace-nowrap"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          onClick={onCancel}
                          variant="secondary"
                          disabled={isSaving}
                          className="w-full md:w-auto text-sm py-2 px-4 whitespace-nowrap"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isSaving && (
        <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
            <p className="text-sm text-primary-300 font-medium">Saving changes...</p>
          </div>
        </div>
      )}

      {/* Success Checkmark */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none">
          <div className="animate-[fadeIn_0.3s_ease-in,fadeOut_0.5s_ease-out_1.5s] bg-dark-800/95 backdrop-blur-sm rounded-full p-4 border-2 border-primary-500/50">
            <Check className="h-12 w-12 text-primary-400" strokeWidth={2.5} />
          </div>
        </div>
      )}
    </div>
  );
}
