import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendly — DuoMind Solutions",
  description: "Agendly es un SaaS de agendamiento por WhatsApp para pequeños negocios en México.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
