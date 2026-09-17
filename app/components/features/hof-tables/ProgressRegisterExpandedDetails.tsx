"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatNumber } from "@/src/lib/utils";
import { User, Edit3, Pencil, Check } from "lucide-react";
import { Button } from "@/app/components/ui";

type ProgressMemberStats = {
  entryId?: string | null;
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
  foreignPeaksInYear: number;
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
  lceMinFpr?: number;
  lceMinPeaks?: number | null;
  lceMinForeignPeaks?: number | null;
};

type ProgressRegisterExpandedDetailsProps = {
  memberData: ProgressMemberStats;
  config: HofYearConfig;
  yearLabel: string;
  hofLabel: string;
  hofId?: string;
  yearId?: string;
  isAdmin?: boolean;
  currentUserId?: string;
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

export default function ProgressRegisterExpandedDetails({
  memberData,
  config,
  yearLabel,
  hofLabel,
  hofId,
  yearId,
  isAdmin = false,
  currentUserId,
  isEditing = false,
  isSaving = false,
  showSuccess = false,
  onEditStart,
  onSave,
  onCancel,
}: ProgressRegisterExpandedDetailsProps) {
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

  // Check if viewing own data for age privacy
  const isViewingOwnData = currentUserId === memberData.member.id;

  const isAgeRuleEnabled = !!config.minimumAgeEnabled && config.minimumAge > 0;
  const failedMinimumAge = isAgeRuleEnabled ? memberData.failedMinimumAge : false;

  // Determine effective requirements (LCE or standard)
  const effectivePeaksRequirement =
    memberData.isFromLceCountry && config.lceMinPeaks !== undefined && config.lceMinPeaks !== null
      ? config.lceMinPeaks
      : config.minPeaks;
  const effectiveForeignPeaksRequirement =
    memberData.isFromLceCountry &&
    config.lceMinForeignPeaks !== undefined &&
    config.lceMinForeignPeaks !== null
      ? config.lceMinForeignPeaks
      : config.minForeignPeaks;
  const effectiveFprRequirement =
    memberData.isFromLceCountry && config.lceMinFpr !== undefined && config.lceMinFpr !== null
      ? config.lceMinFpr
      : config.minFpr;

  // Calculate what's missing for qualification
  const peaksShortfall = Math.max(0, effectivePeaksRequirement - memberData.totalPeaks);
  const foreignPeaksShortfall = Math.max(
    0,
    effectiveForeignPeaksRequirement - memberData.foreignPeaks
  );
  const fprShortfall = Math.max(0, effectiveFprRequirement - memberData.fpr);

  const failedMinimumPeaks = peaksShortfall > 0;
  const failedMinimumForeignPeaks = foreignPeaksShortfall > 0;
  const failedMinimumFpr = fprShortfall > 0;

  const ageShortfall =
    isAgeRuleEnabled && memberData.memberAge !== null
      ? Math.max(0, config.minimumAge - memberData.memberAge)
      : 0;

  // Calculate progress percentages
  const peaksProgress =
    effectivePeaksRequirement > 0
      ? Math.min(100, (memberData.totalPeaks / effectivePeaksRequirement) * 100)
      : 100;
  const foreignPeaksProgress =
    effectiveForeignPeaksRequirement > 0
      ? Math.min(100, (memberData.foreignPeaks / effectiveForeignPeaksRequirement) * 100)
      : 100;
  const fprProgress =
    effectiveFprRequirement > 0
      ? Math.min(100, (memberData.fpr / effectiveFprRequirement) * 100)
      : 100;
  const ageProgress =
    isAgeRuleEnabled && memberData.memberAge !== null
      ? Math.min(100, (memberData.memberAge / config.minimumAge) * 100)
      : 100;

  return (
    <div className="bg-dark-900/50 border-t border-dark-600 p-6">
      <div className="mb-4">
        <h4 className="font-semibold text-primary-400 text-lg">Progress Toward Qualification</h4>
        <p className="text-sm text-gray-400 mt-1">
          Track requirements needed to qualify for Hall of Fame {hofLabel} {yearLabel}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Peaks Requirement */}
        {config.minPeaksEnabled !== false && config.minPeaks > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-300">Total Peaks</h5>
              <span
                className={`text-sm font-medium ${
                  failedMinimumPeaks ? "text-red-400" : "text-green-400"
                }`}
              >
                {failedMinimumPeaks ? "Not Met" : "Met ✓"}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Required:</span>
                <span className="font-medium text-white">
                  {memberData.isFromLceCountry &&
                  config.lceMinPeaks !== undefined &&
                  config.lceMinPeaks !== null &&
                  config.lceMinPeaks !== config.minPeaks ? (
                    <>
                      <span className="text-gray-500 line-through">
                        {formatNumber(config.minPeaks)}
                      </span>
                      <span className="text-green-400 ml-2">
                        {formatNumber(effectivePeaksRequirement)} (LCE)
                      </span>
                    </>
                  ) : (
                    formatNumber(effectivePeaksRequirement)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current:</span>
                <span className="font-medium text-white">
                  {formatNumber(memberData.totalPeaks)}
                </span>
              </div>
              {peaksShortfall > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Still Needed:</span>
                  <span className="font-medium text-red-400">
                    {formatNumber(peaksShortfall)} more
                  </span>
                </div>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-2">
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    failedMinimumPeaks ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{ width: `${peaksProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{peaksProgress.toFixed(1)}% complete</p>
            </div>
          </div>
        )}

        {/* Foreign Peaks Requirement */}
        {config.minForeignPeaksEnabled !== false && config.minForeignPeaks > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-300">Foreign Peaks</h5>
              <span
                className={`text-sm font-medium ${
                  failedMinimumForeignPeaks ? "text-red-400" : "text-green-400"
                }`}
              >
                {failedMinimumForeignPeaks ? "Not Met" : "Met ✓"}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Required:</span>
                <span className="font-medium text-white">
                  {memberData.isFromLceCountry &&
                  config.lceMinForeignPeaks !== undefined &&
                  config.lceMinForeignPeaks !== null &&
                  config.lceMinForeignPeaks !== config.minForeignPeaks ? (
                    <>
                      <span className="text-gray-500 line-through">
                        {formatNumber(config.minForeignPeaks)}
                      </span>
                      <span className="text-green-400 ml-2">
                        {formatNumber(effectiveForeignPeaksRequirement)} (LCE)
                      </span>
                    </>
                  ) : (
                    formatNumber(effectiveForeignPeaksRequirement)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current:</span>
                <span className="font-medium text-white">
                  {formatNumber(memberData.foreignPeaks)}
                </span>
              </div>
              {foreignPeaksShortfall > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Still Needed:</span>
                  <span className="font-medium text-red-400">
                    {formatNumber(foreignPeaksShortfall)} more
                  </span>
                </div>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-2">
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    failedMinimumForeignPeaks ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{ width: `${foreignPeaksProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {foreignPeaksProgress.toFixed(1)}% complete
              </p>
            </div>
          </div>
        )}

        {/* FPR Requirement */}
        {config.minFprEnabled !== false && config.minFpr > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-300">Foreign Peaks Ratio (FPR)</h5>
              <span
                className={`text-sm font-medium ${
                  failedMinimumFpr ? "text-red-400" : "text-green-400"
                }`}
              >
                {failedMinimumFpr ? "Not Met" : "Met ✓"}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Required:</span>
                <span className="font-medium text-white">
                  {memberData.isFromLceCountry &&
                  config.lceMinFpr !== undefined &&
                  config.lceMinFpr !== null &&
                  config.lceMinFpr !== config.minFpr ? (
                    <>
                      <span className="text-gray-500 line-through">
                        {config.minFpr.toFixed(1)}%
                      </span>
                      <span className="text-green-400 ml-2">
                        {effectiveFprRequirement.toFixed(1)}% (LCE)
                      </span>
                    </>
                  ) : (
                    <>{effectiveFprRequirement.toFixed(1)}%</>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current:</span>
                <span className="font-medium text-white">{memberData.fpr.toFixed(1)}%</span>
              </div>
              {fprShortfall > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Still Needed:</span>
                  <span className="font-medium text-red-400">+{fprShortfall.toFixed(1)}%</span>
                </div>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-2">
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    failedMinimumFpr ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{ width: `${fprProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{fprProgress.toFixed(1)}% complete</p>
            </div>
          </div>
        )}

        {/* Age Requirement - only show if enabled */}
        {isAgeRuleEnabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-300">Minimum Age</h5>
              <span
                className={`text-sm font-medium ${
                  failedMinimumAge ? "text-red-400" : "text-green-400"
                }`}
              >
                {failedMinimumAge ? "Not Met" : "Met"}
              </span>
            </div>
            {isViewingOwnData && (
              <>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Required:</span>
                    <span className="font-medium text-white">{config.minimumAge} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Age:</span>
                    <span className="font-medium text-white">
                      {memberData.memberAge !== null
                        ? `${memberData.memberAge} years`
                        : "Not provided"}
                    </span>
                  </div>
                  {ageShortfall > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Years Until Eligible:</span>
                      <span className="font-medium text-red-400">{ageShortfall} more</span>
                    </div>
                  )}
                </div>
                {/* Progress bar */}
                {memberData.memberAge !== null && (
                  <div className="mt-2">
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          failedMinimumAge ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{ width: `${ageProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{ageProgress.toFixed(1)}% complete</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-dark-600">
        <div className="bg-dark-800/50 border border-dark-600 rounded-lg p-4">
          <h5 className="font-medium text-gray-300 mb-2">Summary</h5>
          <p className="text-sm text-gray-400">
            {failedMinimumAge && failedMinimumPeaks && failedMinimumFpr && failedMinimumForeignPeaks
              ? "Currently not meeting any qualification requirements. Keep climbing to reach your goals!"
              : isViewingOwnData && failedMinimumAge
                ? `You're making great progress! Age requirement will be automatically met in ${ageShortfall} year${
                    ageShortfall !== 1 ? "s" : ""
                  }.`
                : failedMinimumPeaks
                  ? `Keep climbing! You need ${formatNumber(
                      peaksShortfall
                    )} more peaks to meet the minimum requirement.`
                  : failedMinimumForeignPeaks
                    ? `Focus on international peaks! You need ${formatNumber(
                        foreignPeaksShortfall
                      )} more foreign peaks.`
                    : failedMinimumFpr
                      ? `Increase your international climbing! You need to raise your FPR by ${fprShortfall.toFixed(
                          1
                        )}% by climbing more foreign peaks.`
                      : "Great work! You're meeting the requirements but haven't qualified yet. Keep up the momentum!"}
          </p>
        </div>
      </div>

      {/* Current Statistics with Real-time Updates */}
      <div className="mt-6 pt-4 border-t border-dark-600">
        <h5 className="font-medium text-gray-300 mb-3">Current Statistics</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400 block mb-1">Total Peaks:</span>
            <span className={`font-medium ${isEditing ? "text-primary-300" : "text-white"}`}>
              {formatNumber(isEditing ? updatedTotalPeaks : memberData.totalPeaks)}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-1">Total Foreign:</span>
            <span className={`font-medium ${isEditing ? "text-primary-300" : "text-white"}`}>
              {formatNumber(isEditing ? updatedForeignPeaks : memberData.foreignPeaks)}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-1">FPR:</span>
            <span className={`font-medium ${isEditing ? "text-primary-300" : "text-white"}`}>
              {isEditing ? calculatedFpr.toFixed(1) : memberData.fpr.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-1">Peaks in {yearLabel}:</span>
            <span className={`font-medium ${isEditing ? "text-primary-300" : "text-white"}`}>
              {formatNumber(isEditing ? peaksInYear : memberData.peaksInYear)}
              <span className="text-gray-500 text-xs ml-1">
                ({formatNumber(isEditing ? foreignPeaksInYear : memberData.foreignPeaksInYear)}{" "}
                foreign)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      {isAdmin && (
        <div className="mt-6 pt-4 border-t border-dark-600">
          <div className="bg-dark-800/30 rounded-lg p-4 border border-dark-600 relative">
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
                          htmlFor="progress-peaks-in-year"
                          className="text-xs text-gray-400 mb-1 block"
                        >
                          Peaks in {yearLabel}
                        </label>
                        <input
                          id="progress-peaks-in-year"
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
                          htmlFor="progress-foreign-peaks-in-year"
                          className="text-xs text-gray-400 mb-1 block"
                        >
                          Foreign Peaks in {yearLabel}
                        </label>
                        <input
                          id="progress-foreign-peaks-in-year"
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
        </div>
      )}
    </div>
  );
}
