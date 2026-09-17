/**
 * Mock data for testing
 */

export const mockUser = {
  id: "test-user-1",
  username: "testuser",
  email: "test@example.com",
  role: "USER",
  firstName: "Test",
  lastName: "User",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockAdminUser = {
  id: "admin-user-1",
  username: "admin",
  email: "admin@example.com",
  role: "ADMIN",
  firstName: "Admin",
  lastName: "User",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockHofEntry = {
  id: "hof-entry-1",
  userId: "test-user-1",
  hofId: "hof-1",
  yearId: "year-2024",
  peaksCompleted: 50,
  totalPeaks: 50,
  tierId: "tier-bronze",
  rank: 1,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockAwardTier = {
  id: "tier-bronze",
  name: "Bronze",
  minPeaks: 1,
  maxPeaks: 100,
  displayOrder: 1,
};

export const mockAwardTiers = [
  {
    id: "tier-bronze",
    name: "Bronze",
    minPeaks: 1,
    maxPeaks: 100,
    displayOrder: 1,
  },
  {
    id: "tier-silver",
    name: "Silver",
    minPeaks: 101,
    maxPeaks: 200,
    displayOrder: 2,
  },
  {
    id: "tier-gold",
    name: "Gold",
    minPeaks: 201,
    maxPeaks: 300,
    displayOrder: 3,
  },
  {
    id: "tier-emerald",
    name: "Emerald",
    minPeaks: 301,
    maxPeaks: 400,
    displayOrder: 4,
  },
  {
    id: "tier-sapphire",
    name: "Sapphire",
    minPeaks: 401,
    maxPeaks: 500,
    displayOrder: 5,
  },
  {
    id: "tier-diamond",
    name: "Diamond",
    minPeaks: 501,
    maxPeaks: null,
    displayOrder: 6,
  },
];

export const mockChangeRequest = {
  id: "change-1",
  title: "Test Change Request",
  description: "This is a test change request",
  type: "FEATURE",
  priority: "MEDIUM",
  impact: "LOW",
  status: "PENDING",
  requesterId: "test-user-1",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockDocument = {
  id: "doc-1",
  filename: "test-document.pdf",
  originalFilename: "test-document.pdf",
  mimeType: "application/pdf",
  size: 1024,
  uploadedBy: "test-user-1",
  uploadedAt: new Date("2024-01-01"),
};

export const mockCountry = {
  id: "country-1",
  name: "Canada",
  code: "CA",
};

export const mockRegion = {
  id: "region-1",
  name: "Ontario",
  countryId: "country-1",
};

export const mockInterest = {
  id: "interest-1",
  name: "Rock Climbing",
};

export const mockConsentType = {
  id: "consent-1",
  name: "Privacy Policy",
  description: "Consent for privacy policy",
  required: true,
  displayOrder: 1,
};
