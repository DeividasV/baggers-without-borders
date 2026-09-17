import Card from "@/ui/Card";
import Input from "@/ui/Input";
import CountrySelect from "@/ui/CountrySelect";
import RegionSelect from "@/ui/RegionSelect";
import GenderSelect from "@/ui/GenderSelect";
import YearPicker from "@/ui/YearPicker";
import InfoField from "./InfoField";
import { GENDERS } from "@/src/types/user-profile";
import type { User as UserType } from "@/src/types";

interface PersonalInformationSectionProps {
  user: UserType;
  isEditing: boolean;
  formData: any;
  onFormDataChange: (updates: any) => void;
  selectedResidenceCountry: any;
  setSelectedResidenceCountry: (country: any) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onBlur: (field: string) => void;
}

export default function PersonalInformationSection({
  user,
  isEditing,
  formData,
  onFormDataChange,
  selectedResidenceCountry,
  setSelectedResidenceCountry,
  errors,
  touched,
  onBlur,
}: PersonalInformationSectionProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-100 mb-6">
        Personal Information
      </h3>

      {isEditing ? (
        <div className="space-y-6">
          {/* Given Name, Family Name, Display Name Row - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Given Name"
                value={formData.givenName}
                onChange={(e) => {
                  onFormDataChange({ givenName: e.target.value });
                }}
                onBlur={() => onBlur("givenName")}
                placeholder="Enter given name"
                error={touched.givenName ? errors.givenName : undefined}
              />
            </div>
            <div>
              <Input
                label="Family Name"
                value={formData.familyName}
                onChange={(e) => {
                  onFormDataChange({ familyName: e.target.value });
                }}
                onBlur={() => onBlur("familyName")}
                placeholder="Enter family name (surname)"
                error={touched.familyName ? errors.familyName : undefined}
              />
            </div>
            <div>
              <Input
                label="Display Name"
                value={formData.displayName || ""}
                onChange={(e) => {
                  onFormDataChange({ displayName: e.target.value });
                }}
                onBlur={() => onBlur("displayName")}
                placeholder="Enter display name"
                required
                helperText="This is the name displayed in Hall of Fame tables and throughout the site"
                error={touched.displayName ? errors.displayName : undefined}
              />
            </div>
          </div>

          {/* Gender, Year of Birth, Birth Country Row - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GenderSelect
              label="Gender"
              value={formData.gender}
              onChange={(value) => onFormDataChange({ gender: value })}
              placeholder="Select gender"
            />
            <div>
              <YearPicker
                label="Year of Birth"
                value={formData.birthYear}
                onChange={(year) => {
                  onFormDataChange({
                    birthYear: year ?? "",
                  });
                  onBlur("birthYear");
                }}
                placeholder="Select or type year"
                minYear={1900}
                maxYear={new Date().getFullYear()}
              />
              {touched.birthYear && errors.birthYear && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <span className="text-lg">⚠</span> {errors.birthYear}
                </p>
              )}
            </div>
            <CountrySelect
              label="Birth Country"
              value={formData.birthCountry}
              onChange={(value) => {
                onFormDataChange({ birthCountry: value });
              }}
              placeholder="Select country"
            />
          </div>

          {/* Residence Country and Region - 2 columns with blank space */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CountrySelect
              label="Residence Country"
              value={formData.residenceCountry}
              onChange={(value, country) => {
                setSelectedResidenceCountry(country || null);
                // Clear region when country changes
                if (value !== formData.residenceCountry) {
                  onFormDataChange({
                    residenceCountry: value,
                    residenceRegion: "",
                  });
                } else {
                  onFormDataChange({ residenceCountry: value });
                }
              }}
              placeholder="Select country"
            />
            <RegionSelect
              label="Residence Region/State"
              value={formData.residenceRegion}
              countryCode={selectedResidenceCountry?.code}
              onChange={(value) => {
                onFormDataChange({ residenceRegion: value });
              }}
              placeholder="Select region"
            />
            <div></div> {/* Blank space */}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoField label="Given Name" value={user.givenName} />
          <InfoField label="Family Name" value={user.familyName} />
          <InfoField label="Display Name" value={user.displayName} />
          <InfoField
            label="Gender"
            value={
              user.gender
                ? GENDERS.find((g) => g.value === user.gender)?.label
                : undefined
            }
          />
          <InfoField label="Birth Year" value={user.birthYear?.toString()} />
          <InfoField label="Birth Country" value={user.birthCountry?.name} />
          <InfoField
            label="Residence Country"
            value={user.residenceCountry?.name}
          />
          <InfoField
            label="Residence Region/State"
            value={user.residenceRegion?.name}
          />
        </div>
      )}
    </Card>
  );
}
