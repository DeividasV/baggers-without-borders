import { TicketDetail } from "@/app/components/features/helpdesk";

export const metadata = {
  title: "Helpdesk Ticket - Admin",
  description: "View helpdesk ticket details and attachments",
};

export default async function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Middleware ensures user is authenticated and is ADMIN
  const { id } = await params;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <TicketDetail ticketId={id} />
    </main>
  );
}
