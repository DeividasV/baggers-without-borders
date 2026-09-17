"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Card from "@/ui/Card";
import LoadingSpinner from "@/ui/LoadingSpinner";
import Modal from "@/ui/Modal";
import UserConsents, { UserConsentsRef } from "./UserConsents";
import ConfirmationDialog from "@/ui/ConfirmationDialog";
import ProfileHeader from "./ProfileHeader";
import BwbInformationSection from "./BwbInformationSection";
import PersonalInformationSection from "./PersonalInformationSection";
import ExternalPlatformsSection from "./ExternalPlatformsSection";
import HofParticipationSection from "./HofParticipationSection";
import YearParticipationSection from "./YearParticipationSection";
import PasswordManagementSection from "./PasswordManagementSection";
import type { User as UserType } from "@/src/types";
import {
  fetchWithTimeout,
  FetchTimeoutError,
} from "@/src/lib/fetchWithTimeout";

interface UserProfileProps {
  userId: string;
  onClose?: () => void;
}

export default function UserProfile({ userId, onClose }: UserProfileProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consentsRef = useRef<UserConsentsRef>(null);
  const { data: session } = useSession();

  // User state
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // UI state
  const [copiedId, setCopiedId] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [pendingPassword, setPendingPassword] = useState("");

  // Deletion state
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hofEntryCount, setHofEntryCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [hofMeisterAssignments, setHofMeisterAssignments] = useState<any[]>([]);
  const [isLoadingHofMeister, setIsLoadingHofMeister] = useState(false);

  // Check if viewing own profile
  const isSelfProfile = session?.user?.id === userId;

  // Country/Region state
  const [countries, setCountries] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [regionsCountry, setRegionsCountry] = useState<string | null>(null);
  const [selectedResidenceCountry, setSelectedResidenceCountry] =
    useState<any>(null);

  // Participation state
  const [hofParticipations, setHofParticipations] = useState<any[]>([]);
  const [yearParticipations, setYearParticipations] = useState<any[]>([]);
  const [loadingParticipations, setLoadingParticipations] = useState(false);

  // Refs to prevent duplicate fetches
  const hasInitializedCountries = useRef(false);
  const hasInitializedUser = useRef(false);

  useEffect(() => {
    fetchUser();
    // Fetch HOF entry count for deletion confirmation
    fetchHofEntryCount();
    // Fetch HoF Meister assignments for deletion warning
    fetchHofMeisterAssignments();

    // Check if should auto-enable edit mode
    const editParam = searchParams.get("edit");
    if (editParam === "true") {
      setIsEditing(true);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchParticipations();
    }
  }, [userId]);

  const fetchHofEntryCount = async () => {
    setIsLoadingCount(true);
    try {
      const response = await fetchWithTimeout(
        `/api/users/${userId}/hof-entries?count=true`,
      );
      if (response.ok) {
        const data = await response.json();
        setHofEntryCount(data.count ?? 0);
      }
    } catch (error) {
      console.error("Error fetching HOF entry count:", error);
      // Set to null to show "Unknown" in confirmation
      setHofEntryCount(null);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const fetchHofMeisterAssignments = async () => {
    setIsLoadingHofMeister(true);
    try {
      const response = await fetchWithTimeout(
        `/api/users/${userId}/hofmeister-assignments`,
      );
      if (response.ok) {
        const data = await response.json();
        setHofMeisterAssignments(data.assignments ?? []);
      }
    } catch (error) {
      console.error("Error fetching HoF Meister assignments:", error);
      setHofMeisterAssignments([]);
    } finally {
      setIsLoadingHofMeister(false);
    }
  };

  const fetchCountries = async () => {
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
      const response = await fetchWithTimeout(
        `/api/regions?countryCode=${countryCode}`,
      );
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

    // Email validation removed - now handled in BwbInformationSection

    if (formData.birthYear) {
      const currentYear = new Date().getFullYear();
      if (formData.birthYear < 1900 || formData.birthYear > currentYear) {
        newErrors.birthYear = `Birth year must be between 1900 and ${currentYear}`;
      }
    }

    if (formData.givenName && formData.givenName.trim().length < 1) {
      newErrors.givenName = "Given name cannot be empty";
    }

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
    if (!force && hasInitializedUser.current) return;
    if (force || !hasInitializedUser.current) {
      hasInitializedUser.current = true;
    }

    try {
      await fetchCountries();

      const response = await fetchWithTimeout(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);

        setSelectedResidenceCountry(data.residenceCountry || null);

        if (data.residenceCountry?.code) {
          fetchRegions(data.residenceCountry.code);
        }

        setFormData({
          role: data.role || "USER",
          status: data.status || "NEW",
          username: data.username || "",
          displayName: data.displayName || "",
          givenName: data.givenName || "",
          familyName: data.familyName || "",
          residenceCountry: data.residenceCountry?.id || "",
          residenceRegion: data.residenceRegion?.id || "",
          birthCountry: data.birthCountry?.id || "",
          birthYear: data.birthYear ?? "",
          gender: data.gender || "",
          email: data.email || "",
          peakbaggerId: data.peakbaggerId || "",
          peakbaggerAllAscents: data.peakbaggerAllAscents ?? false,
          bwbForumNickname: data.bwbForumNickname || "",
          hillBaggingId: data.hillBaggingId || "",
          forumJoinDate: data.forumJoinDate || "",
          retiredYear: data.retiredYear || "",
          deceasedYear: data.deceasedYear || "",
          notes: data.notes || "",
          allowManualEntry: data.allowManualEntry ?? true,
          interests: data.userInterests?.map((ui: any) => ui.interestId) || [],
          showPeakbaggerLink: data.showPeakbaggerLink ?? false,
          showHillBaggingLink: data.showHillBaggingLink ?? false,
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipations = async () => {
    setLoadingParticipations(true);
    try {
      const response = await fetchWithTimeout(
        `/api/users/${userId}/participations`,
      );
      if (response.ok) {
        const data = await response.json();
        setHofParticipations(data.hofParticipations || []);
        setYearParticipations(data.yearParticipations || []);
      }
    } catch (error) {
      console.error("Error fetching participations:", error);
    } finally {
      setLoadingParticipations(false);
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
        console.error("Error saving user profile:", error);
        setSuccessMessage("");
        alert(error.error || "Failed to update user profile");
        return;
      }

      const savedData = await response.json();

      let consentsSaved = true;
      if (consentsRef.current) {
        consentsSaved = await consentsRef.current.saveConsents();
      }

      const participationsResponse = await fetch(
        `/api/users/${userId}/participations`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hofParticipations: hofParticipations.map((p) => ({
              hofId: p.hofId,
              enabled: p.enabled,
            })),
            yearParticipations: yearParticipations.map((p) => ({
              yearId: p.yearId,
              enabled: p.enabled,
              dataNotProvided: p.dataNotProvided || false,
              countryId: p.countryId,
            })),
          }),
        },
      );

      if (!participationsResponse.ok) {
        console.error("Failed to save participations");
      }

      if (consentsSaved) {
        await fetchUser(true);
        await fetchParticipations();
        setIsEditing(false);
        setErrors({});
        setTouched({});
        setSuccessMessage("User profile updated successfully!");
        setShowSuccess(true);

        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      } else {
        setSuccessMessage("");
        alert(
          "User profile saved, but some consents failed to save. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setSuccessMessage("");
      alert("Failed to update user profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    await handleSave();

    // Wait a bit for save to complete, then navigate
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/members");
      }
    }, 500);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setTouched({});
    setShowSuccess(false);
    setSuccessMessage("");

    if (user) {
      setFormData({
        role: user.role || "USER",
        status: user.status || "NEW",
        username: user.username || "",
        displayName: user.displayName || "",
        givenName: user.givenName || "",
        familyName: user.familyName || "",
        residenceCountry: user.residenceCountry?.id || "",
        residenceRegion: user.residenceRegion?.id || "",
        birthCountry: user.birthCountry?.id || "",
        birthYear: user.birthYear ?? "",
        gender: user.gender || "",
        email: user.email || "",
        peakbaggerId: user.peakbaggerId || "",
        peakbaggerAllAscents: user.peakbaggerAllAscents ?? false,
        bwbForumNickname: user.bwbForumNickname || "",
        hillBaggingId: user.hillBaggingId || "",
        forumJoinDate: user.forumJoinDate || "",
        retiredYear: user.retiredYear || "",
        deceasedYear: user.deceasedYear || "",
        notes: user.notes || "",
        allowManualEntry: user.allowManualEntry ?? true,
        interests:
          (user as any).userInterests?.map((ui: any) => ui.interestId) || [],
        showPeakbaggerLink: (user as any).showPeakbaggerLink ?? false,
        showHillBaggingLink: (user as any).showHillBaggingLink ?? false,
      });
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteWarning(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const response = await fetchWithTimeout(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Navigate away after successful deletion
        if (onClose) {
          onClose();
          // If parent component has a refetch method, it will be called automatically
        } else {
          router.push("/admin/members");
        }
      } else {
        const data = await response.json();
        setDeleteErrorMessage(data.error || "Failed to delete member");
        setShowDeleteError(true);
        setShowDeleteConfirmation(false);
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      setDeleteErrorMessage("An error occurred while deleting the member");
      setShowDeleteError(true);
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteConfirmationText = () => {
    if (!user) return "DELETE";
    return user.givenName || user.familyName || "DELETE";
  };

  const handlePasswordChange = async (password: string) => {
    setPendingPassword(password);
    setShowPasswordConfirm(true);
  };

  const executePasswordChange = async () => {
    setShowPasswordConfirm(false);
    try {
      const response = await fetchWithTimeout(`/api/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pendingPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to change password");
        return;
      }

      const data = await response.json();
      setUser((prev) =>
        prev ? { ...prev, passwordChangedAt: data.passwordChangedAt } : null,
      );

      setSuccessMessage("Password changed successfully!");
      setShowSuccess(true);
      setPendingPassword(""); // Clear the pending password

      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password");
    }
  };

  const handleFormDataChange = (updates: any) => {
    setFormData({ ...formData, ...updates });
    if (Object.keys(touched).length > 0) {
      validateForm();
    }
  };

  const handleCopyId = () => {
    if (user) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (loading) {
    return (
      <Card>
        <LoadingSpinner size="lg" text="Loading profile..." />
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <div className="text-center text-gray-400">User not found</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && successMessage && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div className="flex-1">
              <h3 className="text-green-400 font-semibold">{successMessage}</h3>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-green-400 hover:text-green-300 transition-colors text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Validation Error Summary */}
      {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-2">
                Please fix the following errors:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>
                    <span className="font-medium capitalize">
                      {field === "givenName"
                        ? "Given Name"
                        : field === "familyName"
                          ? "Family Name"
                          : field === "birthYear"
                            ? "Birth Year"
                            : field}
                      :
                    </span>{" "}
                    {message}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => {
                setErrors({});
                setTouched({});
              }}
              className="text-red-400 hover:text-red-300 transition-colors text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <ProfileHeader
        user={user}
        isEditing={isEditing}
        saving={saving}
        onEdit={() => setIsEditing(true)}
        onCancel={handleCancel}
        onSave={handleSave}
        onSaveAndClose={handleSaveAndClose}
        onDelete={handleDeleteClick}
        isDeleting={isDeleting}
        isSelfProfile={isSelfProfile}
        isLoadingCount={isLoadingCount}
        onBack={() => {
          if (onClose) {
            onClose();
          } else {
            const returnTo = searchParams.get("returnTo");
            router.push(returnTo || "/admin/members");
          }
        }}
      />

      {/* BwB Information */}
      <BwbInformationSection
        user={user}
        isEditing={isEditing}
        isAdmin={session?.user?.role === "ADMIN"}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        copiedId={copiedId}
        onCopyId={handleCopyId}
      />

      {/* Personal Information */}
      <PersonalInformationSection
        user={user}
        isEditing={isEditing}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        selectedResidenceCountry={selectedResidenceCountry}
        setSelectedResidenceCountry={setSelectedResidenceCountry}
        errors={errors}
        touched={touched}
        onBlur={handleBlur}
      />

      {/* External Platforms */}
      <ExternalPlatformsSection
        user={user}
        isEditing={isEditing}
        formData={formData}
        onFormDataChange={handleFormDataChange}
      />

      {/* HOF Participation */}
      <HofParticipationSection
        user={user}
        isEditing={isEditing}
        hofParticipations={hofParticipations}
        setHofParticipations={setHofParticipations}
        loadingParticipations={loadingParticipations}
      />

      {/* Year Participation */}
      <YearParticipationSection
        user={user}
        isEditing={isEditing}
        yearParticipations={yearParticipations}
        setYearParticipations={setYearParticipations}
        loadingParticipations={loadingParticipations}
      />

      {/* Password Management - Only in edit mode */}
      {isEditing && (
        <PasswordManagementSection
          user={user}
          userId={userId}
          onPasswordChange={handlePasswordChange}
        />
      )}

      {/* User Consents */}
      <Card>
        <UserConsents ref={consentsRef} userId={userId} isEditing={isEditing} />
      </Card>

      {/* Password Change Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showPasswordConfirm}
        onClose={() => setShowPasswordConfirm(false)}
        onConfirm={() => executePasswordChange()}
        title="Change Password"
        message={`Are you sure you want to change the password for ${user.displayName}? This action cannot be undone.`}
        confirmText="Change Password"
      />

      {/* Delete Warning Dialog (First Step) */}
      <ConfirmationDialog
        isOpen={showDeleteWarning}
        onClose={() => setShowDeleteWarning(false)}
        onConfirm={() => {
          setShowDeleteWarning(false);
          setShowDeleteConfirmation(true);
        }}
        title="Delete Member?"
        message={`Are you sure you want to delete ${
          user.displayName
        }?\n\nThis will permanently delete:\n• ${
          isLoadingCount ? "Loading..." : (hofEntryCount ?? "Unknown")
        } HOF entries\n• Participation records\n• Consents\n• Change requests${
          isLoadingHofMeister
            ? "\n• Loading HoF Meister assignments..."
            : hofMeisterAssignments.length > 0
              ? `\n\n⚠️ WARNING: This member is assigned as HoF Meister for ${
                  hofMeisterAssignments.length
                } HoF year configuration(s):\n${hofMeisterAssignments
                  .map((a) => `  • ${a.hof.title} (${a.year.title})`)
                  .join(
                    "\n",
                  )}\n\nDeletion will be BLOCKED unless these assignments are removed first.`
              : ""
        }\n\nThis action cannot be undone.`}
        confirmText="Continue to Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Confirmation Dialog (Second Step - Text Input) */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`To permanently delete ${
          user.displayName
        }, type "${getDeleteConfirmationText()}" below:`}
        confirmText="Delete Member"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        requireTextConfirmation={{
          expectedText: getDeleteConfirmationText(),
          placeholder: `Type ${getDeleteConfirmationText()} to confirm`,
          instructionText:
            "This action is irreversible and will delete all member data",
        }}
      />

      {/* Delete Error Modal */}
      <Modal
        isOpen={showDeleteError}
        onClose={() => setShowDeleteError(false)}
        title="Cannot Delete Member"
      >
        <div className="space-y-4">
          <p className="text-dark-200 whitespace-pre-line">
            {deleteErrorMessage}
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setShowDeleteError(false)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
