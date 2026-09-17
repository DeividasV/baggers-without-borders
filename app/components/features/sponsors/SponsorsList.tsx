"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  description: string | null;
  logoPath: string | null;
  url: string | null;
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl p-5 flex flex-col gap-3">
      {/* Logo + name + link */}
      <div className="flex items-center gap-4">
        {sponsor.logoPath ? (
          <img
            src={`/api/uploads/sponsors/${sponsor.id}.webp`}
            alt={`${sponsor.name} logo`}
            className="h-12 w-12 object-contain rounded-lg shrink-0 bg-dark-700 p-1"
          />
        ) : null}

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-100 leading-tight">{sponsor.name}</h3>
          {sponsor.url && (
            <a
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {sponsor.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Description — always visible */}
      {sponsor.description && (
        <p className="text-sm text-gray-400 leading-relaxed border-t border-dark-700 pt-3">
          {sponsor.description}
        </p>
      )}
    </div>
  );
}

export function SponsorsList() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sponsors")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load sponsors");
        return r.json();
      })
      .then(setSponsors)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-400 text-sm py-16 text-center">Loading…</div>;
  }

  if (error) {
    return <div className="text-red-400 text-sm py-16 text-center">{error}</div>;
  }

  if (sponsors.length === 0) {
    return <div className="text-gray-500 text-sm py-16 text-center">No sponsors listed yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sponsors.map((s) => (
        <SponsorCard key={s.id} sponsor={s} />
      ))}
    </div>
  );
}
