"use client";

import { useState, Fragment } from "react";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { formatNumber } from "@/src/lib/utils";
import { sortAndRankHofMembers } from "@/src/lib/hofTierUtils";
import ProgressRegisterExpandedDetails from "./ProgressRegisterExpandedDetails";

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
    familyName?: string | null;
  };
  totalPeaks: number;
  peaksInYear: number;
  foreignPeaks: number;
  foreignPeaksInYear: number;
  fpr: number;
  firstQualificationYear: string | null;
  dataNotProvided: boolean;
  isNewEntrant: boolean;
  hasLce: boolean;
  lceCountryId: string | null;
  isFromLceCountry?: boolean; // True if member resides in LCE country (regardless of benefit)
  // Non-qualification reasons
  failedMinimumAge: boolean;
  failedMinimumPeaks: boolean;
  failedMinimumForeignPeaks: boolean;
  failedMinimumFpr: boolean;
  memberAge: number | null;
  originalRank?: number;
};

type ProgressRegisterProps = {
  members: ProgressMemberStats[];
  yearLabel: string;
  yearValue: number; // numeric year value e.g., 2025
  hofLabel: string;
  hofId?: string;
  yearId?: string;
  isAdmin?: boolean;
  currentUserId?: string;
  minimumAge: number;
  config: {
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
  selectedBadges: Set<string>;
  onBadgeToggle: (badgeType: string) => void;
  expandedMemberId?: string | null;
  onRefresh?: (memberIdToRestore?: string) => Promise<void>;
};

export default function ProgressRegister({
  members,
  yearLabel,
  yearValue,
  hofLabel,
  hofId,
  yearId,
  isAdmin = false,
  currentUserId,
  minimumAge,
  config,
  selectedBadges,
  onBadgeToggle,
  expandedMemberId,
  onRefresh,
}: ProgressRegisterProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(
    expandedMemberId || null,
  );
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle save for inline editing
  const handleSave = async (
    entryId: string,
    data: { peaksInYear: number; foreignPeaksInYear: number },
  ) => {
    setIsSaving(true);
    try {
      const member = members.find((m) => m.entryId === entryId);
      if (!member) throw new Error("Member not found");

      const requestBody = {
        ...data,
        memberId: member.member.id,
        hofId,
        yearId,
        totalPeaks: member.totalPeaks,
      };

      const response = await fetch(`/api/hof-entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save changes");
      }

      setShowSuccess(true);
      setEditingEntryId(null);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setShowSuccess(false);

      if (onRefresh) {
        await onRefresh(member.member.id);
      }
    } catch (error) {
      console.error("Error saving year stats:", error);
      alert(
        `Failed to save changes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      setIsSaving(false);
      throw error;
    }
  };

  const handleEditStart = (entryId: string) => {
    setEditingEntryId(entryId);
  };

  const handleCancel = () => {
    setEditingEntryId(null);
  };

  const isAgeRuleEnabled = !!config.minimumAgeEnabled && minimumAge > 0;

  const toggleRow = (memberId: string) => {
    setExpandedRowId(expandedRowId === memberId ? null : memberId);
  };

  // Sort members using tie-breaking rules and assign ranks
  const sortedMembers = sortAndRankHofMembers(members);

  if (sortedMembers.length === 0) {
    return null; // Don't show anything if no members in progress
  }

  return (
    <div>
      {/* Section Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-200 mb-2">
          Progress Register
        </h2>
        <p className="text-sm text-gray-400">
          Members who participated but did not meet all qualification
          requirements for {hofLabel} in {yearLabel}
        </p>
      </div>

      {sortedMembers.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            No members match the selected filters
          </h3>
          <p className="text-gray-500">
            Try adjusting your badge filters to see more results
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-16"></th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">
                    Member
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-32">
                    Total peaks
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-32">
                    Peaks in {yearLabel}
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-32">
                    FPR
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-24"></th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((memberData, index) => {
                  const isCurrentUser = currentUserId === memberData.member.id;
                  const isRetired = !!memberData.member.retiredYear;
                  const isDeceased = !!memberData.member.deceasedYear;
                  const noData = memberData.dataNotProvided;

                  // Determine if member is Junior (below minimum age)
                  const isJunior =
                    isAgeRuleEnabled &&
                    memberData.failedMinimumAge &&
                    memberData.memberAge !== null &&
                    memberData.memberAge < minimumAge;

                  // Determine if age data is missing (no birth year provided)
                  const isMissingAgeData =
                    isAgeRuleEnabled && memberData.memberAge === null;

                  // Determine if member is "National" - has sufficient minimum peaks
                  const isNational = !memberData.failedMinimumPeaks;

                  const isExpanded = expandedRowId === memberData.member.id;

                  return (
                    <Fragment key={memberData.member.id}>
                      <tr
                        onClick={() => toggleRow(memberData.member.id)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        aria-label={`${
                          memberData.member.displayName
                        } - ${formatNumber(
                          memberData.totalPeaks,
                        )} total peaks. Click to ${
                          isExpanded ? "collapse" : "expand"
                        } progress details`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleRow(memberData.member.id);
                          }
                        }}
                        className={`border-b ${
                          isExpanded ? "border-b-0" : ""
                        } hover:bg-primary-900/20 hover:border-primary-600/50 transition-all duration-150 cursor-pointer ${
                          isCurrentUser
                            ? "ring-2 ring-primary-600/30 bg-dark-800/30 border-dark-600"
                            : index % 2 === 0
                              ? "bg-dark-800/30 border-dark-600"
                              : "bg-dark-900/30 border-dark-600"
                        }`}
                      >
                        {/* Rank - Empty */}
                        <td className="py-3 px-4 text-center">
                          <span className="text-gray-600">-</span>
                        </td>

                        {/* Member Name with Badges */}
                        <td className="py-3 px-4">
                          <span
                            className={`font-medium ${
                              isCurrentUser ? "text-primary-200" : "text-white"
                            }`}
                          >
                            {memberData.member.displayName}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50">
                                You
                              </span>
                            )}
                            {memberData.isNewEntrant && (
                              <span className="ml-1.5 text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-600/50">
                                New Entrant
                              </span>
                            )}
                            {isRetired && (
                              <span className="ml-1.5 text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-600/50">
                                Retired
                                {memberData.member.retiredYear
                                  ? ` in ${memberData.member.retiredYear}`
                                  : ""}
                              </span>
                            )}
                            {isDeceased && (
                              <span className="ml-1.5 text-xs bg-gray-600/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-600/50">
                                Deceased
                                {memberData.member.deceasedYear
                                  ? ` in ${memberData.member.deceasedYear}`
                                  : ""}
                              </span>
                            )}
                            {memberData.isFromLceCountry && (
                              <span className="ml-1.5 text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50">
                                LCE
                              </span>
                            )}
                            {isJunior && (
                              <span className="ml-1.5 text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-600/50">
                                Junior
                              </span>
                            )}
                            {isNational && (
                              <span className="ml-1.5 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-600/50">
                                National
                              </span>
                            )}
                            {noData && (
                              <span className="ml-1.5 text-xs bg-gray-600/20 text-gray-500 px-2 py-0.5 rounded-full border border-gray-600/30">
                                No Data in {yearLabel}
                              </span>
                            )}
                            {isMissingAgeData && (
                              <span className="ml-1.5 text-xs bg-gray-600/20 text-gray-500 px-2 py-0.5 rounded-full border border-gray-600/30">
                                Missing Data
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Total Peaks */}
                        <td
                          className={`py-3 px-4 text-center font-medium ${
                            isCurrentUser ? "text-primary-200" : "text-white"
                          }`}
                        >
                          {formatNumber(memberData.totalPeaks)}
                        </td>

                        {/* Peaks in Year */}
                        <td
                          className={`py-3 px-4 text-center font-medium ${
                            isCurrentUser ? "text-primary-200" : "text-white"
                          }`}
                        >
                          {memberData.peaksInYear
                            ? formatNumber(memberData.peaksInYear)
                            : "-"}
                        </td>

                        {/* FPR */}
                        <td
                          className={`py-3 px-4 text-center font-medium ${
                            isCurrentUser ? "text-primary-200" : "text-white"
                          }`}
                        >
                          {memberData.totalPeaks > 0
                            ? `${memberData.fpr.toFixed(1)}%`
                            : "-"}
                        </td>

                        {/* Qualified - Empty */}
                        <td className="py-3 px-4 text-center">
                          <span className="text-gray-600">-</span>
                        </td>

                        {/* Expand/Collapse button */}
                        <td className="py-3 px-4 text-center">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400 inline-block" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 inline-block" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${memberData.member.id}-expanded`}>
                          <td colSpan={7} className="p-0 border-dark-600">
                            <ProgressRegisterExpandedDetails
                              memberData={memberData}
                              config={config}
                              yearLabel={yearLabel}
                              hofLabel={hofLabel}
                              hofId={hofId}
                              yearId={yearId}
                              isAdmin={isAdmin}
                              currentUserId={currentUserId}
                              isEditing={editingEntryId === memberData.entryId}
                              isSaving={isSaving}
                              showSuccess={showSuccess}
                              onEditStart={
                                memberData.entryId
                                  ? () => handleEditStart(memberData.entryId!)
                                  : undefined
                              }
                              onSave={handleSave}
                              onCancel={handleCancel}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {sortedMembers.map((memberData) => {
              const isCurrentUser = currentUserId === memberData.member.id;
              const isRetired = !!memberData.member.retiredYear;
              const isDeceased = !!memberData.member.deceasedYear;
              const noData = memberData.dataNotProvided;

              const isJunior =
                memberData.failedMinimumAge &&
                minimumAge > 0 &&
                memberData.memberAge !== null &&
                memberData.memberAge < minimumAge;

              const isMissingAgeData =
                minimumAge > 0 && memberData.memberAge === null;

              const isNational = !memberData.failedMinimumPeaks;

              return (
                <div
                  key={memberData.member.id}
                  className={`card bg-dark-800/50 border border-dark-600 p-4 ${
                    isCurrentUser ? "ring-2 ring-primary-600/50" : ""
                  }`}
                >
                  {/* Member Name and Badges */}
                  <div className="mb-3">
                    <h3
                      className={`text-base font-semibold mb-2 ${
                        isCurrentUser ? "text-primary-200" : "text-white"
                      }`}
                    >
                      {memberData.member.displayName}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {isCurrentUser && (
                        <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50">
                          You
                        </span>
                      )}
                      {memberData.isNewEntrant && (
                        <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-600/50">
                          New Entrant
                        </span>
                      )}
                      {isRetired && (
                        <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-600/50">
                          Retired
                          {memberData.member.retiredYear
                            ? ` in ${memberData.member.retiredYear}`
                            : ""}
                        </span>
                      )}
                      {isDeceased && (
                        <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-600/50">
                          Deceased
                          {memberData.member.deceasedYear
                            ? ` in ${memberData.member.deceasedYear}`
                            : ""}
                        </span>
                      )}
                      {memberData.isFromLceCountry && (
                        <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50">
                          LCE
                        </span>
                      )}
                      {isJunior && (
                        <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-600/50">
                          Junior
                        </span>
                      )}
                      {isNational && (
                        <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-600/50">
                          National
                        </span>
                      )}
                      {noData && (
                        <span className="text-xs bg-gray-600/20 text-gray-500 px-2 py-0.5 rounded-full border border-gray-600/30">
                          No Data in {yearLabel}
                        </span>
                      )}
                      {isMissingAgeData && (
                        <span className="text-xs bg-gray-600/20 text-gray-500 px-2 py-0.5 rounded-full border border-gray-600/30">
                          Missing Data
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Peaks</p>
                      <p
                        className={`text-base font-bold ${
                          isCurrentUser ? "text-primary-200" : "text-white"
                        }`}
                      >
                        {formatNumber(memberData.totalPeaks)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Peaks in {yearLabel}
                      </p>
                      <p
                        className={`text-base font-bold ${
                          isCurrentUser ? "text-primary-200" : "text-white"
                        }`}
                      >
                        {memberData.peaksInYear
                          ? formatNumber(memberData.peaksInYear)
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">FPR</p>
                      <p
                        className={`text-base font-bold ${
                          isCurrentUser ? "text-primary-200" : "text-white"
                        }`}
                      >
                        {memberData.totalPeaks > 0
                          ? `${memberData.fpr.toFixed(1)}%`
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
