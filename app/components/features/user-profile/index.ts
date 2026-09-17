// Main components
import UserProfile from "./UserProfile";
import UserOwnProfile from "./UserOwnProfile";
import UserConsents from "./UserConsents";
export { UserProfile, UserOwnProfile, UserConsents };

// Export UserConsentsRef type
export type { UserConsentsRef } from "./UserConsents";

// Subcomponents
export { default as ProfileHeader } from "./ProfileHeader";
export { default as InfoField } from "./InfoField";
export { default as BwbInformationSection } from "./BwbInformationSection";
export { default as PersonalInformationSection } from "./PersonalInformationSection";
export { default as ExternalPlatformsSection } from "./ExternalPlatformsSection";
export { default as HofParticipationSection } from "./HofParticipationSection";
export { default as YearParticipationSection } from "./YearParticipationSection";
export { default as PasswordManagementSection } from "./PasswordManagementSection";
export * from "./utils";
