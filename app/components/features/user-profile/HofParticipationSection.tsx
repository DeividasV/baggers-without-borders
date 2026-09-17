"use client";

import { useState } from "react";
import Card from "@/ui/Card";
import Switch from "@/ui/Switch";
import LoadingSpinner from "@/ui/LoadingSpinner";
import type { User as UserType } from "@/src/types";

interface HofParticipation {
  id: string;
  enabled: boolean;
  hof: {
    id: string;
    code: string;
    title: string;
  };
}

interface HofParticipationSectionProps {
  user: UserType;
  isEditing: boolean;
  hofParticipations: HofParticipation[];
  setHofParticipations: (participations: HofParticipation[]) => void;
  loadingParticipations: boolean;
}

export default function HofParticipationSection({
  isEditing,
  hofParticipations,
  setHofParticipations,
  loadingParticipations,
}: HofParticipationSectionProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-100 mb-6">
        Hall of Fame Participation
      </h3>

      {isEditing && (
        <p className="text-sm text-gray-400 mb-6">
          Control which Hall of Fame tables this user participates in. Disabled
          HOFs will exclude the user from those rankings.
        </p>
      )}

      {loadingParticipations ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : hofParticipations.length === 0 ? (
        <p className="text-sm text-gray-400">No participation data available</p>
      ) : isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hofParticipations.map((participation) => (
            <div
              key={participation.id}
              className="flex items-center justify-between p-4 bg-dark-800 border border-dark-600 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-300">
                  {participation.hof.title}
                </p>
                <p className="text-xs text-gray-500">
                  {participation.hof.code}
                </p>
              </div>
              <Switch
                id={`hof-${participation.hof.id}`}
                checked={participation.enabled}
                onChange={(checked) => {
                  setHofParticipations(
                    hofParticipations.map((p) =>
                      p.id === participation.id ? { ...p, enabled: checked } : p
                    )
                  );
                }}
                label=""
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {hofParticipations.map((participation) => (
            <div
              key={participation.id}
              className={`p-3 rounded-lg border ${
                participation.enabled
                  ? "bg-green-900/20 border-green-600/30"
                  : "bg-red-900/20 border-red-600/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    {participation.hof.code}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {participation.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    participation.enabled ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
