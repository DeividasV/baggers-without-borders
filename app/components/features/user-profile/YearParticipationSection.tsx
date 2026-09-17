"use client";

import { useState } from "react";
import Card from "@/ui/Card";
import Switch from "@/ui/Switch";
import CountrySelect from "@/ui/CountrySelect";
import LoadingSpinner from "@/ui/LoadingSpinner";
import type { User as UserType } from "@/src/types";

interface YearParticipation {
  id: string;
  enabled: boolean;
  dataNotProvided: boolean | null;
  countryId: string | null;
  country?: {
    id: string;
    code: string;
    name: string;
  } | null;
  year: {
    id: string;
    code: string;
    title: string;
  };
}

interface YearParticipationSectionProps {
  user: UserType;
  isEditing: boolean;
  yearParticipations: YearParticipation[];
  setYearParticipations: (participations: YearParticipation[]) => void;
  loadingParticipations: boolean;
}

export default function YearParticipationSection({
  user,
  isEditing,
  yearParticipations,
  setYearParticipations,
  loadingParticipations,
}: YearParticipationSectionProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-100 mb-6">
        {isEditing
          ? "Year Participation & Country Override"
          : "Year Participation"}
      </h3>

      {isEditing && (
        <p className="text-sm text-gray-400 mb-6">
          Control which years this user participates in and optionally override
          their residence country for specific years.
        </p>
      )}

      {loadingParticipations ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : yearParticipations.length === 0 ? (
        <p className="text-sm text-gray-400">No participation data available</p>
      ) : isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearParticipations.map((participation) => (
            <div
              key={participation.id}
              className="p-4 bg-dark-800 border border-dark-600 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    {participation.year.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {participation.year.code}
                  </p>
                </div>
                <Switch
                  id={`year-${participation.year.id}`}
                  checked={participation.enabled}
                  onChange={(checked) => {
                    setYearParticipations(
                      yearParticipations.map((p) =>
                        p.id === participation.id
                          ? { ...p, enabled: checked }
                          : p
                      )
                    );
                  }}
                  label=""
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-700 rounded border border-dark-600">
                <label
                  htmlFor={`data-not-provided-${participation.year.id}`}
                  className="text-xs text-gray-400 cursor-pointer"
                >
                  Data Not Provided
                </label>
                <Switch
                  id={`data-not-provided-${participation.year.id}`}
                  checked={participation.dataNotProvided || false}
                  onChange={(checked) => {
                    setYearParticipations(
                      yearParticipations.map((p) =>
                        p.id === participation.id
                          ? { ...p, dataNotProvided: checked }
                          : p
                      )
                    );
                  }}
                  label=""
                />
              </div>
              <div>
                <CountrySelect
                  value={
                    participation.countryId || user?.residenceCountry?.id || ""
                  }
                  onChange={(value) => {
                    setYearParticipations(
                      yearParticipations.map((p) =>
                        p.id === participation.id
                          ? { ...p, countryId: value || null }
                          : p
                      )
                    );
                  }}
                  placeholder="Select country"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {yearParticipations.map((participation) => {
            const countryName =
              participation.countryId && participation.country
                ? participation.country.name
                : user?.residenceCountry?.name || "N/A";
            const truncatedCountry =
              countryName.length > 15
                ? countryName.substring(0, 15) + "..."
                : countryName;

            return (
              <div
                key={participation.id}
                className={`p-3 rounded-lg border ${
                  participation.enabled
                    ? "bg-green-900/20 border-green-600/30"
                    : "bg-red-900/20 border-red-600/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      {participation.year.code}
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

                {/* Country */}
                <div className="pt-2 border-t border-dark-600">
                  <p className="text-xs text-gray-500">
                    {participation.countryId ? "Override" : "Country"}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      participation.countryId
                        ? "text-primary-400 font-medium"
                        : "text-gray-400"
                    }`}
                    title={countryName}
                  >
                    {truncatedCountry}
                  </p>
                </div>

                {/* Data Not Provided Status */}
                {participation.dataNotProvided === true && (
                  <div className="pt-2 mt-2 border-t border-dark-600">
                    <p className="text-xs text-amber-400 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      No Data Provided
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
