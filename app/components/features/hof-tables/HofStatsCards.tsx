import { Trophy, TrendingUp, Mountain, Percent } from "lucide-react";
import { formatNumber } from "@/src/lib/utils";

type HofStatsCardsProps = {
  memberCount: number;
  totalPeaks: number;
  totalForeignPeaks: number;
  overallFpr: number;
  hofLabel: string;
  yearLabel: string;
};

export default function HofStatsCards({
  memberCount,
  totalPeaks,
  totalForeignPeaks,
  overallFpr,
  hofLabel,
  yearLabel,
}: HofStatsCardsProps) {
  return (
    <div className="card bg-dark-800 border border-dark-600">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="flex flex-col items-center">
          <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-gray-400">
            {formatNumber(memberCount)}
          </div>
          <div className="text-xs sm:text-sm text-gray-400 text-center">
            Participants ({hofLabel}, {yearLabel})
          </div>
        </div>
        <div className="flex flex-col items-center">
          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-gray-400">
            {formatNumber(totalPeaks)}
          </div>
          <div className="text-xs sm:text-sm text-gray-400 text-center">
            Peaks ({hofLabel}, {yearLabel})
          </div>
        </div>
        <div className="flex flex-col items-center">
          <Mountain className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-gray-400">
            {formatNumber(totalForeignPeaks)}
          </div>
          <div className="text-xs sm:text-sm text-gray-400 text-center">
            Foreign ({hofLabel}, {yearLabel})
          </div>
        </div>
        <div className="flex flex-col items-center">
          <Percent className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-gray-400">
            {overallFpr.toFixed(1)}%
          </div>
          <div className="text-xs sm:text-sm text-gray-400 text-center">
            FPR ({hofLabel}, {yearLabel})
          </div>
        </div>
      </div>
    </div>
  );
}
