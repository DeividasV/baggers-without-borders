import Link from "next/link";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import Logo from "@/app/components/ui/Logo";
import { Home, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You",
  description: "Thank you for your donation!",
};

export default async function DonationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo;

  return (
    <main className="min-h-screen bg-dark-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <Card className="max-w-2xl w-full text-center">
        <div className="flex justify-center mb-8" role="img" aria-label="Success">
          <div className="bg-primary-900/20 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20">
            <Logo size="xl" className="drop-shadow-2xl" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-primary-400 mb-6">Thank You for Your Donation!</h1>

        <p className="text-gray-300 text-lg mb-4 wrap-break-word">
          Your donation has been successfully processed. You should receive a confirmation email
          shortly.
        </p>

        <p className="text-gray-400 mb-8 leading-relaxed">
          Your contribution helps cover the hosting, development and running costs of this site.
          Thank you for your donation!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {returnTo && (
            <Link href={returnTo}>
              <Button variant="primary" className="w-full sm:w-auto min-w-40">
                <span className="truncate">Back to Profile</span>
              </Button>
            </Link>
          )}
          <Link href="/home">
            <Button
              variant={returnTo ? "secondary" : "primary"}
              className="w-full sm:w-auto min-w-40"
            >
              <span className="truncate">Go to Dashboard</span>
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
