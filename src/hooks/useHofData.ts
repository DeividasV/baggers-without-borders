/**
 * Custom hook for fetching and managing Hall of Fame data
 * Used in forms that need HoF selection with recipient information
 */

import { useState, useEffect } from "react";

export interface HofOption {
  id: string;
  label: string;
  meister?: string;
}

export interface YearOption {
  id: string;
  title: string;
}

interface UseHofDataResult {
  hofs: HofOption[];
  years: YearOption[];
  loading: boolean;
  error: Error | null;
}

/**
 * Fetches Hall of Fame data with recipient information
 * @param enabled - Whether to fetch data (typically based on category selection)
 * @returns HoFs, years, loading state, and error
 */
export function useHofData(enabled: boolean): UseHofDataResult {
  const [hofs, setHofs] = useState<HofOption[]>([]);
  const [years, setYears] = useState<YearOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || hofs.length > 0) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [hofsData, yearsData, settingsData] = await Promise.all([
          fetch("/api/hofs?limit=100").then((res) => res.json()),
          fetch("/api/years").then((res) => res.json()),
          fetch("/api/app-settings").then((res) => res.json()),
        ]);

        if (Array.isArray(hofsData) && Array.isArray(yearsData)) {
          // Get latest year
          const latestYear = yearsData.sort(
            (a: YearOption, b: YearOption) =>
              parseInt(b.title) - parseInt(a.title)
          )[0];

          // Fetch HoF year configs for latest year to get meisters
          const configsResponse = await fetch(
            `/api/hof-year-configs?yearId=${latestYear?.id || ""}`
          );
          const configs = configsResponse.ok
            ? await configsResponse.json()
            : [];

          // Get clerk and admin emails from settings
          const clerkEmail = settingsData?.find(
            (s: any) => s.key === "support_clerk_email"
          )?.value;
          const adminEmail = settingsData?.find(
            (s: any) => s.key === "support_admin_email"
          )?.value;

          // Transform HoF data with recipient information
          const transformedHofs = transformHofData(
            hofsData,
            configs,
            clerkEmail,
            adminEmail
          );

          setHofs(transformedHofs);
          setYears(yearsData);
        }
      } catch (err) {
        setError(err as Error);
        console.error("Failed to load HoFs/Years:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [enabled, hofs.length]);

  return { hofs, years, loading, error };
}

/**
 * Transforms raw HoF data into options with recipient information
 */
function transformHofData(
  hofsData: { id: string; title: string }[],
  configs: any[],
  clerkEmail?: string,
  adminEmail?: string
): HofOption[] {
  return hofsData.map((hof) => {
    const config = Array.isArray(configs)
      ? configs.find((c: any) => c.hofId === hof.id)
      : null;
    const meisterName = config?.hofmeister?.name;
    const meisterEmail = config?.hofmeister?.email;

    let recipient = "";
    if (meisterName && meisterEmail) {
      recipient = `HoF Meister: ${meisterName}`;
    } else if (clerkEmail) {
      recipient = "HoF Clerk";
    } else if (adminEmail) {
      recipient = "Admin";
    } else {
      recipient = "Support Team";
    }

    return {
      id: hof.id,
      label: `${hof.title} (${recipient})`,
      meister: recipient,
    };
  });
}
