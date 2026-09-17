export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  role: "ADMIN" | "USER";
  status: "NEW" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  givenName?: string;
  familyName?: string;
  gender?: string;
  birthYear?: number;
  birthCountry?: {
    code: string;
    name: string;
  };
  residenceCountry?: {
    code: string;
    name: string;
  };
  residenceRegion?: {
    code: string;
    name: string;
  };
  bwbForumNickname?: string;
  forumJoinDate?: string;
}

export interface AdvancedFilters {
  givenName: string;
  familyName: string;
  email: string;
  gender: string;
  birthYearMin: string;
  birthYearMax: string;
  birthCountry: string[];
  residenceCountry: string[];
  role: string;
  status: string;
  forumNickname: string;
  notes: string;
  createdDateFrom: string;
  createdDateTo: string;
  updatedDateFrom: string;
  updatedDateTo: string;
  sortBy: string;
  sortOrder: string;
  showRetired: boolean;
  showDeceased: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export interface NewUser {
  username: string;
  displayName: string;
  password: string;
  role: "ADMIN" | "USER";
}

export interface UserStats {
  activeCount: number;
  adminCount: number;
}

export type SearchMode = "simple" | "advanced";
