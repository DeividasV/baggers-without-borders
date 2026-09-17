import { FileText, XCircle, Users, Globe } from "lucide-react";
import StatsCard from "@/ui/StatsCard";
import { LogsStats as StatsType } from "./LogsManagement";

interface LogsStatsProps {
  stats: StatsType;
}

export default function LogsStats({ stats }: LogsStatsProps) {
  // Country code to flag emoji
  const getFlagEmoji = (countryCode: string): string => {
    if (!countryCode || countryCode === "XX") return "🌐";
    if (countryCode === "T1") return "🧅"; // Tor

    // Convert ISO 3166-1 Alpha-2 to emoji
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="card bg-dark-800 border border-dark-600">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          icon={FileText}
          value={stats.total.toLocaleString()}
          label="Total Events"
        />
        <StatsCard
          icon={XCircle}
          value={stats.failed.toLocaleString()}
          label="Failed Events"
        />
        <StatsCard
          icon={Users}
          value={stats.uniqueUsers.toLocaleString()}
          label="Unique Users"
        />
        <div className="flex flex-col items-center">
          <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 mb-2" />
          <div className="text-xs sm:text-sm text-gray-400 text-center">
            Top Countries
          </div>
          <div className="text-xs sm:text-sm text-gray-400 text-center mt-1">
            {stats.topCountries.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-center">
                {stats.topCountries.map((country, idx) => (
                  <span
                    key={country.code || `unknown-${idx}`}
                    title={`${country.count} events`}
                    className="whitespace-nowrap"
                  >
                    {country.code ? getFlagEmoji(country.code) : "❓"} {country.code}{" "}
                    <span className="text-gray-500">{country.count}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span>No data</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
