import { prisma } from "./prisma";

/**
 * Check if a user has any missing required consents
 * Returns array of missing consent types that need to be accepted
 * Only checks for new legal consents (Privacy Policy and Terms of Service)
 */
export async function checkMissingRequiredConsents(userId: string) {
  try {
    const missingConsents = await prisma.userConsent.findMany({
      where: {
        userId: userId,
        isRequired: true,
        dateGiven: null,
        consentType: {
          status: "ACTIVE",
          title: {
            in: ["Privacy Policy", "Terms of Service"],
          },
        },
      },
      include: {
        consentType: true,
      },
    });

    return missingConsents;
  } catch (error) {
    console.error("Error checking missing consents:", error);
    return [];
  }
}

/**
 * Get all consent types (for seeding or management)
 */
export async function getConsentTypes() {
  return await prisma.consentType.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: {
      dateIntroduced: "asc",
    },
  });
}

/**
 * Create or update user consent acceptance
 */
export async function recordConsentAcceptance(
  userId: string,
  consentTypeId: string,
  method: string = "web"
) {
  return await prisma.userConsent.upsert({
    where: {
      userId_consentTypeId: {
        userId,
        consentTypeId,
      },
    },
    update: {
      dateGiven: new Date(),
      consentMethod: method,
    },
    create: {
      userId,
      consentTypeId,
      dateGiven: new Date(),
      consentMethod: method,
      isRequired: true,
    },
  });
}
