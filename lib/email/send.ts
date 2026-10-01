import mailchimpTx from "@mailchimp/mailchimp_transactional";

/**
 * Same transactional provider as MetGo-BE (Mailchimp Transactional / Mandrill),
 * called directly with inline HTML rather than a dashboard-managed template so
 * no Mailchimp-side template setup is required.
 *
 * With MAILCHIMP_TRANSACTIONAL_API_KEY unset (e.g. local dev), emails are
 * logged to the console instead of sent, so the reset/verify flow is testable
 * without real credentials.
 */

let client: ReturnType<typeof mailchimpTx> | null = null;

function getClient(): ReturnType<typeof mailchimpTx> | null {
  const key = process.env.MAILCHIMP_TRANSACTIONAL_API_KEY;
  if (!key) return null;
  if (!client) client = mailchimpTx(key);
  return client;
}

export async function sendEmail(opts: { to: string; cc?: string[]; subject: string; html: string }): Promise<void> {
  const mc = getClient();

  if (!mc) {
    console.warn(
      `[email:dev] MAILCHIMP_TRANSACTIONAL_API_KEY not set — logging instead of sending.\n` +
        `To: ${opts.to}${opts.cc?.length ? `\nCc: ${opts.cc.join(", ")}` : ""}\nSubject: ${opts.subject}\n${opts.html}`
    );
    return;
  }

  // The client resolves (not rejects) on API errors, and a 200 can still carry
  // per-recipient rejections — check both so failures surface to callers.
  const result: unknown = await mc.messages.send({
    message: {
      from_email: process.env.MAILCHIMP_FROM_EMAIL || "no-reply@metgo.app",
      from_name: "MetGo",
      to: [
        { email: opts.to, type: "to" },
        ...(opts.cc ?? []).map((email) => ({ email, type: "cc" as const })),
      ],
      preserve_recipients: Boolean(opts.cc?.length),
      subject: opts.subject,
      html: opts.html,
    },
  });

  if (!Array.isArray(result)) {
    const err = result as { message?: string; response?: { status?: number; data?: unknown } };
    throw new Error(
      `Mailchimp send failed (${err?.response?.status ?? "no status"}): ${JSON.stringify(err?.response?.data ?? err?.message ?? result)}`
    );
  }
  const failed = result.filter((r: { status?: string }) => r.status === "rejected" || r.status === "invalid");
  if (failed.length) {
    throw new Error(`Mailchimp rejected email: ${JSON.stringify(failed)}`);
  }
}
