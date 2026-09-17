import Link from "next/link";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donation Cancelled",
  description: "Your donation was cancelled.",
};

export default async function DonationCancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo;
  const donateUrl = `/donate${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;

  return (
    <main className="min-h-screen bg-dark-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <Card className="max-w-2xl w-full text-center">
        <div className="flex justify-center mb-6" role="img" aria-label="Cancelled">
          <div className="rounded-full bg-yellow-900/20 p-4">
            <XCircle className="h-16 w-16 text-yellow-400" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-primary-400 mb-4">Donation Cancelled</h1>

        <p className="text-gray-300 text-lg mb-6 wrap-break-word">
          Your donation was not completed. No charges have been made.
        </p>

        <p className="text-gray-400 mb-8 wrap-break-word">
          If you encountered any issues or have questions, please don't hesitate to contact me. I'm
          here to help!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={donateUrl}>
            <Button variant="primary" className="w-full sm:w-auto min-w-40">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">Try Again</span>
            </Button>
          </Link>
          {returnTo && (
            <Link href={returnTo}>
              <Button variant="secondary" className="w-full sm:w-auto min-w-40">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span className="truncate">Back to Profile</span>
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </main>
  );
}
