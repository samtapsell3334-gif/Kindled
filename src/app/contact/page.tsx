import type { Metadata } from "next";
import { LegalShell, H2, P, Todo } from "@/components/legal-ui";

export const metadata: Metadata = {
  title: "Contact — Kindled",
  description: "How to get in touch with the Kindled team.",
};

export default function ContactPage() {
  return (
    <LegalShell
      title="Contact us"
      intro="We're a small team building Kindled ahead of launch. We'd genuinely love to hear from you."
      updated="Pending founder confirmation"
    >
      <H2>Get in touch</H2>
      <P>
        For anything at all — support, questions, press, or partnerships — email us and we&apos;ll get back to you as soon
        as we can.
      </P>
      <Todo>
        Confirm the public contact email(s) and expected response time, and the registered company name and address for
        the footer and legal pages.
      </Todo>

      <H2>Privacy &amp; data requests</H2>
      <P>
        To exercise your data-protection rights (access, correction, erasure, and so on), please email us and mark your
        message &quot;Data request&quot;. You can also complain to the Information Commissioner&apos;s Office at ico.org.uk.
      </P>

      <H2>Prize draw — free entry</H2>
      <P>
        To enter the current prize draw for free (no purchase necessary), send your full name and email address to our
        contact address with the subject &quot;Free prize-draw entry&quot;.
      </P>
      <Todo>Confirm the exact free-entry address/instructions and add them here and to the prize-draw rules.</Todo>
    </LegalShell>
  );
}
