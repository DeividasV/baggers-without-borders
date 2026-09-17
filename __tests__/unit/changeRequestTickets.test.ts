import { isMissingFriendlyTicketSchema } from "@/src/lib/changeRequestTickets";

describe("changeRequestTickets", () => {
  describe("isMissingFriendlyTicketSchema", () => {
    it("matches ticket-specific missing schema errors", () => {
      expect(isMissingFriendlyTicketSchema(new Error("no such column: ticketNumber"))).toBe(true);
      expect(isMissingFriendlyTicketSchema(new Error("no such column: ticketSlug"))).toBe(true);
      expect(
        isMissingFriendlyTicketSchema(new Error("no such table: change_request_ticket_counters"))
      ).toBe(true);
    });

    it("ignores unrelated missing schema errors", () => {
      expect(isMissingFriendlyTicketSchema(new Error("no such table: users"))).toBe(false);
      expect(isMissingFriendlyTicketSchema(new Error("no such column: createdAt"))).toBe(false);
      expect(isMissingFriendlyTicketSchema(new Error('relation "audit_logs" does not exist'))).toBe(
        false
      );
    });
  });
});
