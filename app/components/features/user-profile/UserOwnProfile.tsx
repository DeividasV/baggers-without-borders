"use client";

import { useEffect, useState, useRef } from "react";
import { SITE_NAME } from "@/src/config/site";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import Card from "@/ui/Card";
import Button from "@/ui/Button";
import Input from "@/ui/Input";
import LoadingSpinner from "@/ui/LoadingSpinner";
import CountrySelect from "@/ui/CountrySelect";
import RegionSelect from "@/ui/RegionSelect";
import GenderSelect from "@/ui/GenderSelect";
import YearPicker from "@/ui/YearPicker";
import InterestMultiSelect from "@/ui/InterestMultiSelect";
import { formatDateYMD, formatDateTime } from "@/src/lib/utils";
import { generateStrongPassword as generateStrongPasswordShared } from "@/src/lib/passwordStrength";
import { fetchWithTimeout, FetchTimeoutError } from "@/src/lib/fetchWithTimeout";
import type { User as UserType } from "@/src/types";

interface UserOwnProfileProps {
  userId: string;
}

export default function UserOwnProfile({ userId }: UserOwnProfileProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [regionsCountry, setRegionsCountry] = useState<string | null>(null);
  const [selectedResidenceCountry, setSelectedResidenceCountry] = useState<any>(null);
  const [selectedBirthCountry, setSelectedBirthCountry] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const hasInitializedCountries = useRef(false);
  const hasInitializedUser = useRef(false);

  useEffect(() => {
    fetchUser();
  }, []); // Empty array - only fetch on mount

  const fetchCountries = async () => {
    // Only fetch countries once
    if (hasInitializedCountries.current) return;
    hasInitializedCountries.current = true;

    try {
      const response = await fetchWithTimeout("/api/countries");
      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries || []);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const fetchRegions = async (countryCode: string) => {
    if (!countryCode || regionsCountry === countryCode) return;
    try {
      const response = await fetchWithTimeout(`/api/regions?countryCode=${countryCode}`);
      if (response.ok) {
        const data = await response.json();
        setRegions(data.regions || []);
        setRegionsCountry(countryCode);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Display name validation (required)
    if (!formData.displayName || formData.displayName.trim().length < 1) {
      newErrors.displayName = "Display name is required";
    } else if (formData.displayName.trim().length > 255) {
      newErrors.displayName = "Display name cannot exceed 255 characters";
    }

    // Email validation
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // Birth year validation
    if (formData.birthYear) {
      const currentYear = new Date().getFullYear();
      if (formData.birthYear < 1900 || formData.birthYear > currentYear) {
        newErrors.birthYear = `Birth year must be between 1900 and ${currentYear}`;
      }
    }

    // Given name validation
    if (formData.givenName && formData.givenName.trim().length < 1) {
      newErrors.givenName = "Given name cannot be empty";
    }

    // Family name validation
    if (formData.familyName && formData.familyName.trim().length < 1) {
      newErrors.familyName = "Family name cannot be empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    validateForm();
  };

  const fetchUser = async (force: boolean = false) => {
    // Only fetch once on initial mount unless forced
    if (!force && hasInitializedUser.current) return;
    if (!hasInitializedUser.current) {
      hasInitializedUser.current = true;
    }

    try {
      // Fetch countries once
      await fetchCountries();

      const response = await fetchWithTimeout(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);

        setSelectedResidenceCountry(data.residenceCountry || null);
        setSelectedBirthCountry(data.birthCountry || null);

        if (data.residenceCountry?.code) {
          fetchRegions(data.residenceCountry.code);
        }
        setFormData({
          displayName: data.displayName || "",
          givenName: data.givenName || "",
          familyName: data.familyName || "",
          residenceCountry: data.residenceCountry?.id || "",
          residenceRegion: data.residenceRegion?.id || "",
          birthCountry: data.birthCountry?.id || "",
          birthYear: data.birthYear || undefined,
          gender: data.gender || "",
          email: data.email || "",
          interests: data.userInterests?.map((ui: any) => ui.interestId) || [],
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setTouched({
        email: true,
        birthYear: true,
        givenName: true,
        familyName: true,
        displayName: true,
      });
      setSuccessMessage("");
      return;
    }

    setSaving(true);
    try {
      const response = await fetchWithTimeout(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        setSuccessMessage("");
        alert(error.error || "Failed to update profile");
        return;
      }

      await fetchUser(true);
      setIsEditing(false);
      setErrors({});
      setTouched({});
      setSuccessMessage("Profile updated successfully!");
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSuccessMessage("");
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setTouched({});
    setShowSuccess(false);
    setSuccessMessage("");
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        givenName: user.givenName || "",
        familyName: user.familyName || "",
        residenceCountry: user.residenceCountry?.id || "",
        residenceRegion: user.residenceRegion?.id || "",
        birthCountry: user.birthCountry?.id || "",
        birthYear: user.birthYear || undefined,
        gender: user.gender || "",
        email: user.email || "",
        interests: user.userInterests?.map((ui) => ui.interestId) || [],
      });
    }
  };

  const generateStrongPassword = () => {
    try {
      setNewPassword(generateStrongPasswordShared(18));
      setShowPassword(true);
    } catch {
      alert("Password generation is not available in this environment.");
    }
  };

  const calculatePasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "Empty", color: "bg-gray-500" };

    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) return { strength: 25, label: "Weak", color: "bg-red-500" };
    if (score <= 4) return { strength: 50, label: "Fair", color: "bg-orange-500" };
    if (score <= 6) return { strength: 75, label: "Good", color: "bg-yellow-500" };
    return { strength: 100, label: "Strong", color: "bg-green-500" };
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetchWithTimeout(`/api/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to change password");
        return;
      }

      const data = await response.json();

      setUser((prev) => (prev ? { ...prev, passwordChangedAt: data.passwordChangedAt } : null));

      setNewPassword("");
      setShowPassword(false);

      setSuccessMessage("Password changed successfully!");
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    const value = text?.trim();
    if (!value) return false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // fall through to legacy fallback
      }
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">User not found</p>
      </div>
    );
  }

  const passwordStrength = calculatePasswordStrength(newPassword);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dark-700">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-400 truncate">My Profile</h2>
          <p className="text-sm text-gray-400 truncate">
            <span className="text-gray-500">Username:</span> {user.username}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing && (
            <>
              <Link href="/donate?returnTo=/profile">
                <Button variant="secondary" size="sm" type="button">
                  Donate to {SITE_NAME}
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="secondary" size="sm" type="button">
                  Get Help
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && successMessage && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <p className="text-green-400 text-sm flex items-center gap-2">
            <span className="text-lg">✓</span> {successMessage}
          </p>
        </div>
      )}

      {/* Personal Information */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-100 mb-6">Personal Information</h3>

        {isEditing ? (
          <div className="space-y-6">
            {/* Given Name, Family Name, Display Name Row - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Given Name"
                  value={formData.givenName}
                  onChange={(e) => {
                    setFormData({ ...formData, givenName: e.target.value });
                    if (touched.givenName) {
                      validateForm();
                    }
                  }}
                  onBlur={() => handleBlur("givenName")}
                  placeholder="Enter given name"
                  className={
                    touched.givenName && errors.givenName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }
                />
                {touched.givenName && errors.givenName && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <span className="text-lg">⚠</span> {errors.givenName}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="Family Name"
                  value={formData.familyName}
                  onChange={(e) => {
                    setFormData({ ...formData, familyName: e.target.value });
                    if (touched.familyName) {
                      validateForm();
                    }
                  }}
                  onBlur={() => handleBlur("familyName")}
                  placeholder="Enter family name (surname)"
                  className={
                    touched.familyName && errors.familyName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }
                />
                {touched.familyName && errors.familyName && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <span className="text-lg">⚠</span> {errors.familyName}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="Display Name"
                  value={formData.displayName || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, displayName: e.target.value });
                    if (touched.displayName) {
                      validateForm();
                    }
                  }}
                  onBlur={() => handleBlur("displayName")}
                  placeholder="Enter display name"
                  required
                  className={
                    touched.displayName && errors.displayName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }
                />
                {touched.displayName && errors.displayName && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <span className="text-lg">⚠</span> {errors.displayName}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                  This is the name displayed in Hall of Fame tables and throughout the site.{" "}
                  {SITE_NAME} encourages using your real name.
                </p>
              </div>
            </div>

            {/* Email Row */}
            <div>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                disabled
                readOnly
                placeholder="your.email@example.com"
                className="bg-dark-700 cursor-not-allowed opacity-75"
              />
              <p className="mt-2 text-xs text-gray-400 leading-relaxed wrap-break-word">
                To change your email address, please{" "}
                <Link
                  href="/support"
                  className="text-primary-400 hover:text-primary-300 underline inline-block py-1"
                >
                  Contact Help
                </Link>
                .
              </p>
            </div>

            {/* Gender, Year of Birth Row - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GenderSelect
                label="Gender"
                value={formData.gender}
                onChange={(value) => setFormData({ ...formData, gender: value })}
                placeholder="Select gender"
              />
              <div>
                <YearPicker
                  label="Year of Birth"
                  value={formData.birthYear}
                  onChange={(year) => {
                    setFormData({
                      ...formData,
                      birthYear: year ?? "",
                    });
                    if (touched.birthYear) {
                      validateForm();
                    }
                  }}
                  placeholder="Select year"
                />
                {touched.birthYear && errors.birthYear && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <span className="text-lg">⚠</span> {errors.birthYear}
                  </p>
                )}
              </div>
            </div>

            {/* Birth Country, Residence Country, Residence Region Row - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CountrySelect
                label="Birth Country"
                value={formData.birthCountry}
                onChange={(value, country) => {
                  setFormData({ ...formData, birthCountry: value });
                }}
                placeholder="Select country"
              />
              <CountrySelect
                label="Residence Country"
                value={formData.residenceCountry}
                onChange={(value, country) => {
                  setFormData({
                    ...formData,
                    residenceCountry: value,
                    residenceRegion: "",
                  });
                  setSelectedResidenceCountry(country);
                  if (country?.code) {
                    fetchRegions(country.code);
                  } else {
                    setRegions([]);
                    setRegionsCountry(null);
                  }
                }}
                placeholder="Select country"
              />
              <RegionSelect
                label="Residence Region/State"
                countryCode={selectedResidenceCountry?.code}
                value={formData.residenceRegion}
                onChange={(value) => setFormData({ ...formData, residenceRegion: value })}
                placeholder="Select region"
                disabled={!selectedResidenceCountry?.code}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoField label="Given Name" value={user.givenName} />
            <InfoField label="Family Name" value={user.familyName} />
            <InfoField label="Display Name" value={user.displayName} />
            <InfoField label="Email" value={user.email} />
            <InfoField
              label="Gender"
              value={
                user.gender === "M"
                  ? "Male"
                  : user.gender === "F"
                    ? "Female"
                    : user.gender === "O"
                      ? "Other"
                      : user.gender === "N"
                        ? "Prefer not to say"
                        : undefined
              }
            />
            <InfoField label="Year of Birth" value={user.birthYear?.toString()} />
            <InfoField label="Birth Country" value={user.birthCountry?.name} />
            <InfoField label="Residence Country" value={user.residenceCountry?.name} />
            <InfoField label="Residence Region/State" value={user.residenceRegion?.name} />
          </div>
        )}
      </Card>

      {/* Interests */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-100 mb-6">Interests</h3>

        {isEditing ? (
          <InterestMultiSelect
            label="Select interests"
            value={formData.interests || []}
            onChange={(value) => setFormData({ ...formData, interests: value })}
            placeholder="Select interests"
          />
        ) : (
          <div>
            {user.userInterests && user.userInterests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.userInterests.map((ui) => (
                  <span
                    key={ui.interestId}
                    className="px-3 py-1 bg-primary-900/20 border border-primary-500/30 rounded-full text-sm text-primary-400"
                  >
                    {ui.interest.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No interests selected</p>
            )}
          </div>
        )}
      </Card>

      {/* Consent History - Hidden during edit mode */}
      {!isEditing && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-100 mb-6">Consent History</h3>

          {user.userConsents && user.userConsents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Consent Type</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Date Accepted</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Method</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {user.userConsents.map((consent) => (
                    <tr key={consent.id} className="hover:bg-dark-800/50">
                      <td className="py-3 px-2 text-gray-200">{consent.consentType.title}</td>
                      <td className="py-3 px-2 text-gray-300">
                        {consent.dateGiven ? (
                          formatDateTime(consent.dateGiven)
                        ) : (
                          <span className="text-yellow-500">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-gray-400">
                        {consent.consentMethod ? (
                          <span className="px-2 py-0.5 bg-dark-700 rounded text-xs">
                            {consent.consentMethod.replace("_", " ")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {consent.isRequired ? (
                          <span className="px-2 py-0.5 bg-red-900/20 text-red-400 rounded text-xs border border-red-500/30">
                            Required
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-900/20 text-blue-400 rounded text-xs border border-blue-500/30">
                            Optional
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No consent records found</p>
          )}
        </Card>
      )}

      {/* Password Management - Only visible when toggled in edit mode */}
      {isEditing && showPasswordSection && (
        <>
          <Card>
            <h3 className="text-lg font-semibold text-gray-100 mb-6">Password Management</h3>

            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (minimum 8 characters)"
                      autoComplete="new-password"
                      data-form-type="other"
                      data-lpignore="true"
                      className="w-full h-9.5 px-4 py-2 pr-20 bg-dark-700 border border-dark-500 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Password strength:</span>
                        <span
                          className={`font-medium ${
                            passwordStrength.strength === 100
                              ? "text-green-400"
                              : passwordStrength.strength === 75
                                ? "text-yellow-400"
                                : passwordStrength.strength === 50
                                  ? "text-orange-400"
                                  : "text-red-400"
                          }`}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={generateStrongPassword}
                      className="flex-1"
                    >
                      Generate Password
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        const ok = await copyToClipboard(newPassword);
                        if (!ok) {
                          alert(
                            "Copy failed. Your browser may block clipboard access (requires HTTPS or localhost)."
                          );
                        }
                      }}
                      disabled={!newPassword}
                      className="flex-1"
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowPasswordSection(false);
                        setNewPassword("");
                        setShowPassword(false);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handlePasswordChange}
                      disabled={!newPassword || changingPassword}
                      className="flex-1"
                    >
                      {changingPassword ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </div>
              </div>

              {user.passwordChangedAt && (
                <p className="text-xs text-gray-500 mt-3">
                  Last changed: {formatDateTime(user.passwordChangedAt)}
                </p>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Action Buttons at Bottom - Always visible in edit mode */}
      {isEditing && (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-dark-700">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            disabled={showPasswordSection}
          >
            Change Password
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value?: string | null;
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <div className="text-sm text-gray-200">
        {value || <span className="text-gray-600">—</span>}
      </div>
    </div>
  );
}
