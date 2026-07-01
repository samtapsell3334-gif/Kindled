import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, H2, P, UL, Todo } from "@/components/legal-ui";

export const metadata: Metadata = {
  title: "Terms of Service — Kindled",
  description: "The terms on which you may use Kindled, including how money and the prize draw work.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      intro="These terms govern your use of Kindled. This is a working template to be finalised with legal advice before launch."
      updated="Template — pending founder/legal review"
    >
      <Todo>Confirm the contracting entity, company details, and have a solicitor review these terms before launch.</Todo>

      <H2>The service</H2>
      <P>
        Kindled lets you create shared gift &quot;pots&quot;, invite others to contribute, and reveal the result on a chosen
        date. Contributing does not require an account.
      </P>

      <H2>How money works</H2>
      <UL>
        <li>Contributions are collected by our payment provider when a giver chooses to chip in.</li>
        <li>Funds are held and paid out to the pot owner (or applied to catalogue purchases) according to the pot&apos;s settings.</li>
        <li>If a goal isn&apos;t fully funded by the reveal date, the pot owner still receives what was raised, unless they choose to carry the balance over to the next occasion.</li>
        <li>Refunds are handled case by case in line with your statutory rights and the payment provider&apos;s rules.</li>
      </UL>
      <Todo>
        Confirm the exact money-handling model: who holds funds and under what regulatory permission, payout timing, the
        goal-not-met outcome, and the refund/cancellation policy. This section must match reality precisely.
      </Todo>

      <H2 id="stored-credit">Stored credit</H2>
      <P>
        Where you earn credit (e.g. from catalogue purchases), it is held against your account to put towards your own pots.
      </P>
      <Todo>
        Take regulatory advice on whether stored credit constitutes electronic money or a payment service under the FCA /
        Payment Services Regulations, and adjust the product and these terms accordingly before offering it.
      </Todo>

      <H2 id="prize-draw">Prize draw</H2>
      <P>
        From time to time we run a prize draw (currently advertised at £2,500). Contributing to a pot earns automatic
        entries, <strong>but no purchase is necessary</strong>: you can obtain the same number of free entries via the
        free-entry route below, so the draw operates as a lawful free prize draw and not a lottery.
      </P>
      <UL>
        <li>Open to UK residents aged 18 or over. Our staff and their households are excluded.</li>
        <li><strong>Free entry route:</strong> send your name and email by post/email as set out below to receive an entry with no purchase.</li>
        <li>Winners are drawn at random each quarter and notified by email.</li>
      </UL>
      <Todo>
        Publish full prize-draw rules: promoter identity and address, exact free-entry postal/email instructions, opening
        and closing dates, draw date/method, number of prizes, winner notification and publication, and data handling.
      </Todo>

      <H2>Acceptable use</H2>
      <P>Use Kindled lawfully. Don&apos;t misuse the service, attempt to defraud contributors, or upload unlawful content.</P>

      <H2>Liability</H2>
      <P>
        We provide the service with reasonable care and skill. Nothing in these terms limits liability that cannot be
        limited by law (including for death, personal injury, or fraud).
      </P>
      <Todo>Have legal set the liability, warranty, and indemnity wording.</Todo>

      <H2>Changes &amp; governing law</H2>
      <P>
        We may update these terms and will post the revised version here. These terms are governed by the laws of England
        and Wales, and disputes are subject to the courts of England and Wales.
      </P>
      <P>
        Questions? See the{" "}
        <Link href="/contact" className="font-semibold text-stone-800 underline underline-offset-2">contact page</Link>.
      </P>
    </LegalShell>
  );
}
