export interface Gender {
  value: string;
  label: string;
}

export interface HofParticipation {
  id: string;
  hofId: string;
  enabled: boolean;
  hof: {
    id: string;
    code: string;
    title: string;
  };
}

export interface YearParticipation {
  id: string;
  yearId: string;
  enabled: boolean;
  dataNotProvided?: boolean;
  countryId?: string | null;
  year: {
    id: string;
    code: string;
    title: string;
  };
  country?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface PasswordStrength {
  strength: number;
  label: string;
  color: string;
}

export const GENDERS: Gender[] = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
  { value: "N", label: "Prefer not to say" },
];
