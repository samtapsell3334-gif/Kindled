import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const BodySchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 422 });
  }

  const submitterEmail = parsed.data.email;
  const recipientEmail = process.env.CREATOR_SIGNUP_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey && recipientEmail) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Kindled Signups <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `New First Kindler: ${submitterEmail}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
            <h2 style="color:#f59e0b;margin-bottom:8px">New First Kindler</h2>
            <p style="color:#374151;font-size:16px">A new creator just reserved their spot:</p>
            <p style="background:#fef3c7;border-radius:8px;padding:16px 20px;font-size:18px;font-weight:600;color:#92400e">
              ${submitterEmail}
            </p>
            <p style="color:#6b7280;font-size:13px;margin-top:24px">Sent via Kindled Creator Sign-up</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Resend error:", err);
      // Don't fail the user-facing request if email delivery fails
    }
  } else {
    // Dev / unconfigured: just log
    console.warn("[signup] RESEND_API_KEY or CREATOR_SIGNUP_EMAIL not set — email not delivered.", submitterEmail);
  }

  return NextResponse.json({ ok: true });
}
