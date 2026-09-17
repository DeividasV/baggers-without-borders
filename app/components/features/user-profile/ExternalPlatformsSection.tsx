import Card from "@/ui/Card";
import Input from "@/ui/Input";
import InfoField from "./InfoField";
import type { User as UserType } from "@/src/types";

interface ExternalPlatformsSectionProps {
  user: UserType;
  isEditing: boolean;
  formData: any;
  onFormDataChange: (updates: any) => void;
}

export default function ExternalPlatformsSection({
  user,
  isEditing,
  formData,
  onFormDataChange,
}: ExternalPlatformsSectionProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-100 mb-6">
        External Platforms
      </h3>

      {isEditing ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Peakbagger ID"
              value={formData.peakbaggerId}
              onChange={(e) => {
                onFormDataChange({ peakbaggerId: e.target.value });
              }}
              placeholder="Enter Peakbagger ID"
            />
            <Input
              label="Hill Bagging ID"
              value={formData.hillBaggingId}
              onChange={(e) => {
                onFormDataChange({ hillBaggingId: e.target.value });
              }}
              placeholder="Enter Hill Bagging ID"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showPeakbaggerLink}
                onChange={(e) =>
                  onFormDataChange({ showPeakbaggerLink: e.target.checked })
                }
                className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-800"
              />
              <span className="text-sm text-gray-300">
                Show Peakbagger link on profile
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showHillBaggingLink}
                onChange={(e) =>
                  onFormDataChange({ showHillBaggingLink: e.target.checked })
                }
                className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-800"
              />
              <span className="text-sm text-gray-300">
                Show Hill Bagging link on profile
              </span>
            </label>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Peakbagger ID" value={user.peakbaggerId} />
          <InfoField label="Hill Bagging ID" value={user.hillBaggingId} />
        </div>
      )}
    </Card>
  );
}
