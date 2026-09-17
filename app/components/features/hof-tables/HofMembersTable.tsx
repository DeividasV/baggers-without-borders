"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { formatNumber } from "@/src/lib/utils";
import {
  type AwardTier,
  getMemberTier,
  getTierBorderColor,
  getTierGradient,
  getTierHoverBg,
  getTierHoverBorder,
  getTierBottomBorder,
} from "@/src/lib/hofTierUtils";
import HofMemberExpandedDetails from "./HofMemberExpandedDetails";

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
  firstQualificationYear: string | null;
  dataNotProvided: boolean;
  hasLce: boolean;
  lceCountryId: string | null;
  originalRank?: number;
};

type HofMembersTableProps = {
  members: MemberStats[];
  awardTiers: AwardTier[];
  yearLabel: string;
  hofLabel: string;
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
  totalActiveMembers: number;
  totalQualifiedMembers: number;
  currentUserId?: string;
  currentUserRole?: string;
  hofId?: string;
  yearId?: string;
  expandedRowId?: string | null;
  onExpandRow?: (memberId: string | null) => void;
  onRefresh?: (memberIdToRestore?: string) => Promise<void>;
  isAuthenticated?: boolean;
};

export default function HofMembersTable({
  members,
  awardTiers,
  yearLabel,
  hofLabel,
  config,
  totalActiveMembers,
  totalQualifiedMembers,
  currentUserId,
  currentUserRole,
  hofId,
  yearId,
  expandedRowId: controlledExpandedRowId,
  onExpandRow,
  onRefresh,
  isAuthenticated = false,
}: HofMembersTableProps) {
  const [localExpandedRowId, setLocalExpandedRowId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showScrollShadow, setShowScrollShadow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use controlled or local state
  const expandedRowId =
    controlledExpandedRowId !== undefined ? controlledExpandedRowId : localExpandedRowId;
  const setExpandedRowId = onExpandRow || setLocalExpandedRowId;

  // Check if table needs horizontal scrolling
  useEffect(() => {
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (container) {
        const needsScroll = container.scrollWidth > container.clientWidth;
        setShowScrollShadow(needsScroll);
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [members]);

  const toggleRow = (memberId: string) => {
    setExpandedRowId(expandedRowId === memberId ? null : memberId);
  };

  // Handle save for inline editing
  const handleSave = async (
    entryId: string,
    data: { peaksInYear: number; foreignPeaksInYear: number }
  ) => {
    setIsSaving(true);
    try {
      // Find the member to get memberId and totalPeaks
      const member = members.find((m) => m.entryId === entryId);
      if (!member) {
        throw new Error("Member not found");
      }

      // Include required fields for API
      const requestBody = {
        ...data,
        memberId: member.member.id,
        hofId,
        yearId,
        totalPeaks: member.totalPeaks,
      };

      const response = await fetch(`/api/hof-entries/${entryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save changes");
      }

      // Show success animation
      setShowSuccess(true);
      setEditingEntryId(null);

      // Wait for animations: 1.5s solid + 0.5s fadeout = 2s
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setShowSuccess(false);

      // Trigger refresh if callback provided
      if (onRefresh) {
        await onRefresh(member.member.id);
      }
    } catch (error) {
      console.error("Error saving year stats:", error);
      alert(`Failed to save changes: ${error instanceof Error ? error.message : "Unknown error"}`);
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

  return (
    <>
      {/* Section Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-200 mb-2">Hall of Fame</h2>
        <p className="text-sm text-gray-400">
          Members who meet all qualification requirements for {hofLabel} in {yearLabel}
        </p>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            No members match the selected filters
          </h3>
          <p className="text-gray-500">Try adjusting your badge filters to see more results</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block relative">
            {/* Scroll shadow indicator - only visible when scrolling is needed */}
            {showScrollShadow && (
              <div className="absolute top-0 right-0 bottom-0 w-12 bg-linear-to-l from-dark-900 via-dark-900/80 to-transparent pointer-events-none z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.6)]" />
            )}

            <div
              ref={scrollContainerRef}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800"
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-16">
                      Rank
                    </th>
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
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-24">
                      Qualified
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((memberData, index) => {
                    const isCurrentUser = currentUserId === memberData.member.id;
                    const memberTier = getMemberTier(memberData.totalPeaks, awardTiers);
                    const tierBorderColor = memberTier ? getTierBorderColor(memberTier.name) : "";
                    const tierGradient = memberTier ? getTierGradient(memberTier.name) : "";
                    const tierHoverBg = memberTier
                      ? getTierHoverBg(memberTier.name)
                      : "hover:bg-primary-900/20";
                    const tierHoverBorder = memberTier
                      ? getTierHoverBorder(memberTier.name)
                      : "hover:border-primary-600/50";

                    // Check if this is the last member in this tier section
                    const nextMemberTier =
                      index < members.length - 1
                        ? getMemberTier(members[index + 1].totalPeaks, awardTiers)
                        : null;
                    const isLastInTier =
                      memberTier && (!nextMemberTier || nextMemberTier.name !== memberTier.name);
                    const tierBottomBorder =
                      isLastInTier && memberTier ? getTierBottomBorder(memberTier.name) : "";

                    const isExpanded = expandedRowId === memberData.member.id;

                    // Find next tier for progress
                    const sortedTiers = [...awardTiers].sort((a, b) => a.minPeaks - b.minPeaks);
                    const nextTier = memberTier
                      ? sortedTiers.find((t) => t.minPeaks > memberData.totalPeaks)
                      : sortedTiers[0];

                    return (
                      <Fragment key={memberData.member.id}>
                        <tr
                          onClick={() => toggleRow(memberData.member.id)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          aria-label={`${
                            memberData.member.displayName
                          } - Rank ${index + 1}, ${formatNumber(
                            memberData.totalPeaks
                          )} total peaks. Click to ${isExpanded ? "collapse" : "expand"} details`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleRow(memberData.member.id);
                            }
                          }}
                          className={`border-b ${isExpanded ? "border-b-0" : ""} ${
                            tierBottomBorder && !isExpanded ? `${tierBottomBorder} border-b-2` : ""
                          } ${tierHoverBg} ${tierHoverBorder} transition-all duration-150 cursor-pointer border-l-4 ${
                            isCurrentUser
                              ? `ring-2 ring-primary-600/30 ${
                                  tierBorderColor || "border-l-primary-500"
                                } ${
                                  index % 2 === 0 ? "bg-dark-800/30" : "bg-dark-900/30"
                                } border-dark-600`
                              : tierBorderColor
                                ? `${tierBorderColor} ${
                                    index % 2 === 0 ? "bg-dark-800/30" : "bg-dark-900/30"
                                  } border-dark-600`
                                : index % 2 === 0
                                  ? "bg-dark-800/30 border-dark-600 border-l-dark-600"
                                  : "bg-dark-900/30 border-dark-600 border-l-dark-600"
                          }`}
                        >
                          <td className="py-3 px-4 text-center relative overflow-hidden">
                            {tierGradient && (
                              <div className={`absolute inset-0 ${tierGradient}`}></div>
                            )}
                            <div className="flex items-center justify-center relative z-10">
                              <span
                                className={`font-bold text-lg ${
                                  isCurrentUser ? "text-primary-300" : "text-primary-400"
                                }`}
                              >
                                {memberData.originalRank || index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-medium ${
                                isCurrentUser ? "text-primary-200" : "text-white"
                              }`}
                            >
                              {memberData.member.displayName}
                              {isAuthenticated && isCurrentUser && (
                                <span className="ml-1.5 text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50">
                                  You
                                </span>
                              )}
                              {memberData.isNewEntrant && (
                                <span className="ml-1.5 text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-600/50">
                                  New Entrant
                                </span>
                              )}
                              {memberData.isFirstTimeAward && memberData.awardTierName && (
                                <span className="ml-1.5 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-600/50">
                                  New {memberData.awardTierName} Award
                                </span>
                              )}
                              {memberData.member.retiredYear && (
                                <span className="ml-1.5 text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-600/50">
                                  Retired in {memberData.member.retiredYear}
                                </span>
                              )}
                              {memberData.member.deceasedYear && (
                                <span className="ml-1.5 text-xs bg-gray-600/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-600/50">
                                  Deceased
                                  {memberData.member.deceasedYear
                                    ? ` in ${memberData.member.deceasedYear}`
                                    : ""}
                                </span>
                              )}
                              {memberData.hasLce && (
                                <span className="ml-1.5 text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50">
                                  LCE
                                </span>
                              )}
                              {memberData.dataNotProvided && (
                                <span className="ml-1.5 text-xs bg-gray-600/20 text-gray-500 px-2 py-0.5 rounded-full border border-gray-600/30">
                                  No Data in {yearLabel}
                                </span>
                              )}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-medium ${
                              isCurrentUser ? "text-primary-200" : "text-white"
                            }`}
                          >
                            {memberData.totalPeaks ? formatNumber(memberData.totalPeaks) : "-"}
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-medium ${
                              isCurrentUser ? "text-primary-200" : "text-white"
                            }`}
                          >
                            {memberData.peaksInYear ? formatNumber(memberData.peaksInYear) : "-"}
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-medium ${
                              isCurrentUser ? "text-primary-200" : "text-white"
                            }`}
                          >
                            {memberData.totalPeaks > 0 ? `${memberData.fpr.toFixed(1)}%` : "-"}
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-medium ${
                              isCurrentUser ? "text-primary-200" : "text-white"
                            }`}
                          >
                            {memberData.firstQualificationYear || "-"}
                          </td>
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
                            <td colSpan={7} className="p-0 border-l-4 border-dark-600">
                              <HofMemberExpandedDetails
                                memberData={memberData}
                                rank={memberData.originalRank || index + 1}
                                totalMembers={totalQualifiedMembers}
                                totalActiveMembers={totalActiveMembers}
                                currentTier={memberTier}
                                nextTier={nextTier ?? null}
                                yearLabel={yearLabel}
                                hofLabel={hofLabel}
                                isAdmin={currentUserRole === "ADMIN"}
                                hofId={hofId}
                                yearId={yearId}
                                config={config}
                                isEditing={editingEntryId === memberData.entryId}
                                isSaving={isSaving}
                                showSuccess={showSuccess}
                                onEditStart={() =>
                                  memberData.entryId && handleEditStart(memberData.entryId)
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {members.map((memberData, index) => {
              const isCurrentUser = currentUserId === memberData.member.id;
              const memberTier = getMemberTier(memberData.totalPeaks, awardTiers);
              const tierBorderColor = memberTier ? getTierBorderColor(memberTier.name) : "";
              const tierGradient = memberTier ? getTierGradient(memberTier.name) : "";
              const tierHoverBg = memberTier
                ? getTierHoverBg(memberTier.name)
                : "hover:bg-primary-900/20";
              const tierHoverBorder = memberTier
                ? getTierHoverBorder(memberTier.name)
                : "hover:border-primary-600/50";

              // Check if this is the last member in this tier section
              const nextMemberTier =
                index < members.length - 1
                  ? getMemberTier(members[index + 1].totalPeaks, awardTiers)
                  : null;
              const isLastInTier =
                memberTier && (!nextMemberTier || nextMemberTier.name !== memberTier.name);
              const tierBottomBorder =
                isLastInTier && memberTier ? getTierBottomBorder(memberTier.name) : "";

              const isExpanded = expandedRowId === memberData.member.id;

              // Find next tier for progress
              const sortedTiers = [...awardTiers].sort((a, b) => a.minPeaks - b.minPeaks);
              const nextTier = memberTier
                ? sortedTiers.find((t) => t.minPeaks > memberData.totalPeaks)
                : sortedTiers[0];

              return (
                <div key={memberData.member.id} className="space-y-0">
                  <div
                    onClick={() => toggleRow(memberData.member.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-label={`${memberData.member.displayName} - Rank ${
                      index + 1
                    }, ${formatNumber(memberData.totalPeaks)} total peaks. Click to ${
                      isExpanded ? "collapse" : "expand"
                    } details`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleRow(memberData.member.id);
                      }
                    }}
                    className={`border rounded-lg p-4 cursor-pointer ${
                      isExpanded ? "rounded-b-none border-b-0" : ""
                    } ${
                      tierBottomBorder && !isExpanded ? `${tierBottomBorder} border-b-2` : ""
                    } ${tierHoverBg} ${tierHoverBorder} transition-all duration-150 border-l-4 relative overflow-hidden ${
                      isCurrentUser
                        ? `ring-2 ring-primary-600/30 ${
                            tierBorderColor || "border-l-primary-500"
                          } bg-dark-800 border-dark-600`
                        : tierBorderColor
                          ? `${tierBorderColor} bg-dark-800 border-dark-600`
                          : "bg-dark-800 border-dark-600 border-l-dark-600"
                    }`}
                  >
                    {/* Gradient overlay for all rows with tier */}
                    {tierGradient && (
                      <div className={`absolute inset-0 ${tierGradient} pointer-events-none`}></div>
                    )}

                    {/* Rank Badge */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-dark-600 relative z-10">
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isCurrentUser ? "text-primary-200" : "text-white"
                          }`}
                        >
                          {memberData.member.displayName}
                        </p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {isAuthenticated && isCurrentUser && (
                            <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50">
                              You
                            </span>
                          )}
                          {memberData.isNewEntrant && (
                            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-600/50">
                              New Entrant
                            </span>
                          )}
                          {memberData.isFirstTimeAward && memberData.awardTierName && (
                            <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-600/50">
                              New {memberData.awardTierName} Award
                            </span>
                          )}
                          {memberData.member.retiredYear && (
                            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-600/50">
                              Retired in {memberData.member.retiredYear}
                            </span>
                          )}
                          {memberData.member.deceasedYear && (
                            <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-600/50">
                              Deceased
                              {memberData.member.deceasedYear
                                ? ` in ${memberData.member.deceasedYear}`
                                : ""}
                            </span>
                          )}
                          {memberData.hasLce && (
                            <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-600/50">
                              LCE
                            </span>
                          )}
                          {memberData.dataNotProvided && (
                            <span className="text-xs bg-gray-600/20 text-gray-500 px-2 py-0.5 rounded-full border border-gray-600/30">
                              No Data in {yearLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          isCurrentUser
                            ? "bg-primary-600/30 border border-primary-600/70"
                            : "bg-dark-900/50"
                        }`}
                      >
                        <span
                          className={`font-bold text-lg ${
                            isCurrentUser ? "text-primary-300" : "text-primary-400"
                          }`}
                        >
                          {memberData.originalRank || index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total peaks</p>
                        <p
                          className={`text-base font-bold ${
                            isCurrentUser ? "text-primary-200" : "text-white"
                          }`}
                        >
                          {memberData.totalPeaks ? formatNumber(memberData.totalPeaks) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Peaks in {yearLabel}</p>
                        <p
                          className={`text-base font-bold ${
                            isCurrentUser ? "text-primary-200" : "text-white"
                          }`}
                        >
                          {memberData.peaksInYear ? formatNumber(memberData.peaksInYear) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Qualified</p>
                        <p
                          className={`text-base font-bold ${
                            isCurrentUser ? "text-primary-200" : "text-white"
                          }`}
                        >
                          {memberData.firstQualificationYear || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">FPR</p>
                        <p
                          className={`text-base font-bold ${
                            isCurrentUser ? "text-primary-200" : "text-white"
                          }`}
                        >
                          {memberData.totalPeaks > 0 ? `${memberData.fpr.toFixed(1)}%` : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Expand/Collapse indicator */}
                    <div className="flex justify-center pt-3 mt-3 border-t border-dark-600 relative z-10">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border border-t-0 rounded-b-lg border-dark-600">
                      <HofMemberExpandedDetails
                        memberData={memberData}
                        rank={memberData.originalRank || index + 1}
                        totalMembers={totalQualifiedMembers}
                        totalActiveMembers={totalActiveMembers}
                        currentTier={memberTier}
                        nextTier={nextTier ?? null}
                        yearLabel={yearLabel}
                        hofLabel={hofLabel}
                        isAdmin={currentUserRole === "ADMIN"}
                        hofId={hofId}
                        yearId={yearId}
                        config={config}
                        isEditing={editingEntryId === memberData.entryId}
                        isSaving={isSaving}
                        showSuccess={showSuccess}
                        onEditStart={() =>
                          memberData.entryId && handleEditStart(memberData.entryId)
                        }
                        onSave={handleSave}
                        onCancel={handleCancel}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
