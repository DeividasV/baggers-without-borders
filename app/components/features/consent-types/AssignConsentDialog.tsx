"use client";

import { useState } from "react";
import { X, Users, Globe, UserCheck, Loader } from "lucide-react";
import CountryMultiSelect from "@/ui/CountryMultiSelect";

interface AssignConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consentTypeId: string;
  consentTypeName: string;
  onSuccess: () => void;
}

export default function AssignConsentDialog({
  isOpen,
  onClose,
  consentTypeId,
  consentTypeName,
  onSuccess,
}: AssignConsentDialogProps) {
  const [assignTo, setAssignTo] = useState<"all" | "country" | "specific">(
    "all"
  );
  const [isRequired, setIsRequired] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const body: any = {
        assignTo,
        isRequired,
      };

      if (assignTo === "country") {
        if (selectedCountries.length === 0) {
          alert("Please select at least one country");
          setAssigning(false);
          return;
        }
        body.countryIds = selectedCountries;
      }

      const response = await fetch(
        `/api/consent-types/${consentTypeId}/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(
          `Assigned to ${result.assignedCount} users.${
            result.skippedCount > 0
              ? ` ${result.skippedCount} already had this consent.`
              : ""
          }`
        );
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Couldn't assign consent. Please try again.");
      }
    } catch (error) {
      console.error("Error assigning consent:", error);
      alert("Unable to connect. Check your connection and try again.");
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <div>
            <h2 className="text-xl font-bold text-primary-400">
              Assign Consent Type to Users
            </h2>
            <p className="text-sm text-gray-400 mt-1">{consentTypeName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={assigning}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Assignment Type */}
          <div className="space-y-3">
            <div className="block text-sm font-medium text-gray-300">
              Assign to:
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg border-2 border-dark-600 hover:border-primary-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  value="all"
                  checked={assignTo === "all"}
                  onChange={(e) =>
                    setAssignTo(
                      e.target.value as "all" | "country" | "specific"
                    )
                  }
                  className="text-primary-500"
                  disabled={assigning}
                />
                <Users className="h-5 w-5 text-primary-400" />
                <div className="flex-1">
                  <div className="font-medium text-white">All Active Users</div>
                  <div className="text-xs text-gray-400">
                    Assign to all users with NEW or ACTIVE status
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg border-2 border-dark-600 hover:border-primary-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  value="country"
                  checked={assignTo === "country"}
                  onChange={(e) =>
                    setAssignTo(
                      e.target.value as "all" | "country" | "specific"
                    )
                  }
                  className="text-primary-500"
                  disabled={assigning}
                />
                <Globe className="h-5 w-5 text-primary-400" />
                <div className="flex-1">
                  <div className="font-medium text-white">Users by Country</div>
                  <div className="text-xs text-gray-400">
                    Assign to users from specific countries (birth or residence)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Country Selection */}
          {assignTo === "country" && (
            <div className="space-y-3">
              <CountryMultiSelect
                label="Select Countries"
                selectedCountryIds={selectedCountries}
                onChange={setSelectedCountries}
                placeholder="Choose countries to assign this consent to..."
                disabled={assigning}
                useIds={true}
              />
              <p className="text-xs text-gray-400">
                Users from selected countries (by birth or residence) will
                receive this consent
              </p>
            </div>
          )}

          {/* Required Toggle */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg border border-dark-600">
              <input
                id="consent-required"
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="rounded text-primary-500"
                disabled={assigning}
              />
              <label htmlFor="consent-required" className="flex-1">
                <div className="font-medium text-white">
                  Mark as Required Consent
                </div>
                <div className="text-xs text-gray-400">
                  Users will be marked as needing to provide this consent
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-dark-600">
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-2"
            disabled={assigning}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            className="btn-primary px-6 py-2 flex items-center space-x-2"
            disabled={assigning}
          >
            {assigning ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                <span>Assign to Users</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
