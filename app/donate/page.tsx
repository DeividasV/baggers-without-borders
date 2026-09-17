import { DonationForm, DonationErrorBoundary } from "@/features/donations";
import { SITE_NAME } from "@/src/config/site";
import { RunningCostsIndicator } from "@/app/components/features/donations/RunningCostsIndicator";
import { getOptionalSession } from "@/src/lib/api-auth";
import Logo from "@/app/components/ui/Logo";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support the hosting and development of this site.",
};

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const session = await getOptionalSession();

  // Safely handle searchParams - don't crash if malformed
  let params: { returnTo?: string } = {};
  try {
    params = await searchParams;
  } catch (error) {
    console.error("Failed to parse searchParams:", error);
    // Continue with empty params - graceful degradation
  }

  return (
    <main className="min-h-screen bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <header className="text-center mb-8">
          <h1 className="flex items-center justify-center gap-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-400 mb-4">
            <span>Donate to</span>
            <Logo size="xl" className="drop-shadow-2xl" asLink />
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Help keep this community platform running and growing
          </p>
        </header>

        {/* Community & Funding Information */}
        <div className="mb-8 bg-dark-800/70 border border-dark-600 rounded-lg p-4 sm:p-6 max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-400 mb-4">About {SITE_NAME}</h2>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-3">
            {SITE_NAME} is a community project built by climbers and hikers, for climbers and hikers
            worldwide. We maintain Hall of Fame tables that celebrate achievements across peak lists
            globally—recognising completions, tracking progress, and connecting a community of
            dedicated peak-baggers.
          </p>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-3">
            The platform is designed, built, and maintained entirely by volunteers. I handle the
            technical side—website, database, hosting, infrastructure—while the wider community
            maintains the data and contributes ideas, feedback, and expertise that shape every
            improvement.
          </p>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-3">
            <strong className="text-primary-400">Where donations go:</strong>
          </p>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-3">
            Donations cover the operational costs of running the platform: server hosting, database
            services, email delivery, domain registration, SSL certificates, and development tools.
            They also support ongoing development, testing, and maintenance work.
          </p>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            {SITE_NAME} is free to use. Your support helps cover its running costs.
          </p>

          {/* Running Costs Indicator - Wrapped in error boundary for resilience */}
          <DonationErrorBoundary
            fallback={
              <div className="mt-6 pt-6 border-t border-dark-600 text-gray-500 text-sm text-center">
                Running costs information temporarily unavailable
              </div>
            }
          >
            <RunningCostsIndicator />
          </DonationErrorBoundary>

          <div className="mt-4 pt-4 border-t border-dark-600 text-center text-sm text-gray-400">
            View our{" "}
            <Link
              href="/sponsors"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              sponsors &amp; donors page
            </Link>{" "}
            to see who has contributed.
          </div>
        </div>

        {/* Donation Form */}
        <DonationForm
          prefilledEmail={session?.user?.email || undefined}
          prefilledName={session?.user?.name || undefined}
          returnTo={params.returnTo}
        />

        {/* Legal Notice */}
        <aside
          className="mt-8 bg-dark-800/60 border border-dark-600 rounded-lg p-4 sm:p-6 max-w-2xl mx-auto"
          aria-label="Legal information about donations"
        >
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Important Legal Notice
          </h3>
          <div className="text-gray-400 text-xs sm:text-sm leading-relaxed space-y-2">
            <p>
              <strong>Voluntary Contributions:</strong> All donations are strictly voluntary.
              Payment is not required to access or use any feature of this site.
            </p>
            <p>
              <strong>Equal Access:</strong> All users have access to the exact same features,
              functionality, and level of service, regardless of whether they have made a donation.
              Donations do not confer any special privileges, enhanced features, or priority
              support.
            </p>
            <p>
              <strong>Non-Commercial Project:</strong> This site is operated as a non-commercial,
              community-driven project. All donations are allocated exclusively toward operational
              expenses (hosting, development tools, domain registration) and future platform
              development and support.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
