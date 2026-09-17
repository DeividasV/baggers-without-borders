"use client";

import {
  Users,
  UserCheck,
  Shield,
  Plus,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { formatNumber } from "@/src/lib/utils";
import { UserStats as UserStatsType } from "@/src/types/user-management";
import StatsCard from "@/ui/StatsCard";
import { useRouter } from "next/navigation";

interface UserStatsProps {
  totalCount: number;
  stats: UserStatsType;
  onCreateClick: () => void;
}

export default function UserStats({
  totalCount,
  stats,
  onCreateClick,
}: UserStatsProps) {
  const router = useRouter();

  return (
    <>
      <div className="card bg-dark-800 border border-dark-600">
        <div className="grid grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          <StatsCard
            icon={Users}
            value={formatNumber(totalCount)}
            label="Total"
          />
          <StatsCard
            icon={UserCheck}
            value={formatNumber(stats.activeCount)}
            label="Active"
          />
          <StatsCard
            icon={Shield}
            value={formatNumber(stats.adminCount)}
            label="Admins"
          />
        </div>
      </div>

      {/* Management and Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/admin/interests")}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Heart className="h-5 w-5" />
            <span>Manage Interests</span>
          </button>
          <button
            onClick={() => router.push("/admin/consent-types")}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="h-5 w-5" />
            <span>Manage Consents</span>
          </button>
        </div>
        <button
          onClick={onCreateClick}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Member</span>
        </button>
      </div>
    </>
  );
}
