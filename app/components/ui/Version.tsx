"use client";

import { useEffect, useState } from "react";

interface VersionInfo {
  version: string;
  updatedAt: string;
}

export default function Version() {
  const [version, setVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVersion() {
      try {
        // Try to load version from package.json or version endpoint
        const response = await fetch("/api/version");
        if (response.ok) {
          const data: VersionInfo = await response.json();
          setVersion(data.version);
        } else {
          // Fallback to package.json version if endpoint doesn't exist
          setVersion("0.398.1");
        }
      } catch (error) {
        console.warn("Could not fetch version info:", error);
        // Fallback version
        setVersion("0.398.1");
      } finally {
        setLoading(false);
      }
    }

    fetchVersion();
  }, []);

  if (loading) {
    return <div className="text-xs text-gray-500 animate-pulse">v•••</div>;
  }

  if (!version) {
    return null;
  }

  return (
    <span
      className="transition-colors duration-200 hover:text-gray-300"
      title={`Application version ${version}`}
    >
      v{version}
    </span>
  );
}
