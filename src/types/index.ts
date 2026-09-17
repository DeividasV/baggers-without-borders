// Type definitions for the BWB Climbing App

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "USER";
  status?: "NEW" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt?: string;
  passwordChangedAt?: string;

  // Extended profile fields
  givenName?: string;
  familyName?: string;
  residenceCountry?: {
    id: string;
    code: string;
    name: string;
  };
  residenceRegion?: {
    id: string;
    code: string;
    name: string;
  };
  birthCountry?: {
    id: string;
    code: string;
    name: string;
  };
  birthYear?: number;
  gender?: string;
  email?: string;

  // User interests
  userInterests?: Array<{
    interestId: string;
    interest: {
      id: string;
      name: string;
      description?: string;
    };
  }>;

  // User consents (new consent tracking system)
  userConsents?: Array<{
    id: string;
    dateGiven: string | null;
    consentMethod: string | null;
    isRequired: boolean;
    consentType: {
      id: string;
      title: string;
      description?: string;
      status: string;
    };
  }>;

  // Privacy consent (DateTime in DB, string when serialized from API)
  prHallConsent?: string;
  pIndexConsent?: string;
  infoRetentionConsent?: string;
  publishTotalsConsent?: string;

  // External platform integration
  peakbaggerId?: string;
  peakbaggerAllAscents?: boolean;
  bwbForumNickname?: string;
  hillBaggingId?: string;
  forumJoinDate?: string;
  retiredYear?: number;
  deceasedYear?: number;

  // Administrative notes
  notes?: string;

  // Manual data entry control
  allowManualEntry?: boolean;
}

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  type: "FEATURE" | "BUG" | "ENHANCEMENT" | "DOCUMENTATION" | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  impact: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    displayName: string;
    username: string;
  };
  attachments: ChangeRequestAttachment[];
  _count?: {
    attachments: number;
  };
  // Git sync fields
  commitHash?: string | null;
  commitDate?: string | null;
  version?: string | null;
  category?: string | null;
  linesAdded?: number | null;
  linesDeleted?: number | null;
  filesChanged?: number | null;
  isFromGit?: boolean;
  // Enhanced breakdown fields
  technicalDetails?: string | null;
  businessValue?: string | null;
  affectedAreas?: string | null;
}

export interface ChangeRequestAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

export interface NewUser {
  username: string;
  displayName: string;
  password: string;
  role: "ADMIN" | "USER";
}

export interface UserProfileFormData {
  username: string;
  email: string;
  displayName: string;
  role: "ADMIN" | "USER";
  status: "NEW" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  givenName: string;
  familyName: string;
  residenceCountry: string;
  residenceRegion: string;
  birthCountry: string;
  birthYear: string; // Form input as string
  gender: string;

  // Privacy consent (form checkboxes or date inputs)
  prHallConsent: boolean | string;
  pIndexConsent: boolean | string;
  infoRetentionConsent: boolean | string;
  publishTotalsConsent: boolean | string;

  // External platform integration
  peakbaggerId: string;
  peakbaggerAllAscents: boolean;
  bwbForumNickname: string;
  hillBaggingId: string;
  forumJoinDate: string; // ISO date string from date input
  retiredYear: string; // Form input as string
  deceasedYear: string; // Form input as string

  // Administrative notes
  notes: string;
}

// Form data types
export interface ChangeRequestFormData {
  title: string;
  description: string;
  type: string;
  priority: string;
  impact: string;
  status: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Navigation types
export interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Component prop types
export interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}
