import { ContactForm } from "@/app/components/features/helpdesk";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch: general inquiries, Hall of Fame data questions, or a technical problem to report.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <ContactForm isAuthenticated={false} />
      </Suspense>
    </div>
  );
}
