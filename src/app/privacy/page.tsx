import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, H2, P, UL, Todo } from "@/components/legal-ui";

export const metadata: Metadata = {
  title: "Privacy Policy — Kindled",
  description: "How Kindled collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      intro="This policy explains what personal data Kindled collects, why, and the rights you have under UK data protection law. It is a working template — the items marked below must be confirmed before launch."
      updated="Template — pending founder/legal review"
    >
      <Todo>
        Confirm the legal entity (company name, number, registered address), the named data controller, and the
        Data Protection Officer / contact, then replace the placeholders throughout.
      </Todo>

      <H2>Who we are</H2>
      <P>
        Kindled (&quot;we&quot;, &quot;us&quot;) provides a group-gifting service that lets families and friends contribute
        towards shared gift pots. For the purposes of UK GDPR, the data controller is the entity to be confirmed above.
      </P>

      <H2>What we collect</H2>
      <UL>
        <li>Contact details you give us — e.g. your email address when you join the waitlist or create an account.</li>
        <li>Pot and contribution details — the pots you create or contribute to, amounts, and any message or media you add.</li>
        <li>Payment data processed by our payment provider (see &quot;Payments&quot;) — we do not store full card numbers.</li>
        <li>Technical data — essential cookies, device/browser information, and aggregated usage analytics (only with your consent).</li>
      </UL>

      <H2>How we use your data &amp; our lawful bases</H2>
      <UL>
        <li>To provide the service and process contributions — <strong>performance of a contract</strong>.</li>
        <li>To send you launch and early-access updates you asked for — <strong>consent</strong> (withdraw any time).</li>
        <li>To keep the service secure and prevent fraud — <strong>legitimate interests</strong>.</li>
        <li>To meet legal and financial-record obligations — <strong>legal obligation</strong>.</li>
      </UL>

      <H2>Cookies</H2>
      <P>
        We use strictly necessary cookies to make the site work. Optional analytics/marketing cookies are only set if you
        accept them in our consent banner, in line with PECR. You can change your choice at any time by clearing the
        &quot;kindled-consent&quot; preference in your browser.
      </P>

      <H2>Payments</H2>
      <P>
        Card and open-banking payments are handled by Stripe, our payment processor. Your card details are sent directly
        to Stripe and are not stored on our servers. See Stripe&apos;s own privacy notice for how they process payment data.
      </P>
      <Todo>Confirm the payment processor(s) actually used and link their privacy notice(s).</Todo>

      <H2>Children&apos;s data</H2>
      <P>
        Some features (e.g. star charts) relate to children but are set up and managed by a parent or guardian. We design
        these with the ICO&apos;s Age Appropriate Design Code (&quot;Children&apos;s Code&quot;) in mind.
      </P>
      <Todo>
        Complete a Children&apos;s Code assessment: confirm what child data is processed, data-minimisation, default
        high-privacy settings, and that no child profiling or targeted marketing occurs. Legal to sign off.
      </Todo>

      <H2>Sharing &amp; processors</H2>
      <P>
        We share data only with the processors needed to run the service (e.g. payment, email delivery, and hosting
        providers), under contract. We do not sell your personal data.
      </P>
      <Todo>List all sub-processors (hosting, email, payments, analytics) and the safeguards for any transfers outside the UK.</Todo>

      <H2>How long we keep it</H2>
      <P>We keep personal data only as long as needed for the purposes above and to meet legal/financial-record requirements.</P>
      <Todo>Set concrete retention periods per data category.</Todo>

      <H2>Your rights</H2>
      <P>
        Under UK GDPR you can request access, correction, erasure, restriction, portability, or object to certain
        processing, and withdraw consent at any time. To exercise these, contact us via the{" "}
        <Link href="/contact" className="font-semibold text-stone-800 underline underline-offset-2">contact page</Link>.
        You also have the right to complain to the Information Commissioner&apos;s Office (ico.org.uk).
      </P>
    </LegalShell>
  );
}
