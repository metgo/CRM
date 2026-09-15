const BRAND_COLOR = "#0279b1";

function layout(title: string, bodyHtml: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;border:1px solid #eee;">
    <div style="background:${BRAND_COLOR};padding:16px 24px;">
      <span style="color:#fff;font-size:18px;font-weight:bold;">MetGo</span>
    </div>
    <div style="padding:24px;color:#222;">
      <h2 style="margin-top:0;">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="padding:16px 24px;color:#888;font-size:12px;border-top:1px solid #eee;">
      MetGo &middot; support@metgo.app
    </div>
  </div>`;
}

function button(href: string, label: string): string {
  return `<p><a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">${label}</a></p>`;
}

export function passwordResetEmail(resetLink: string): { subject: string; html: string } {
  return {
    subject: "Reset your MetGo CRM password",
    html: layout(
      "Reset your password",
      `<p>We received a request to reset your MetGo CRM password.</p>
       ${button(resetLink, "Reset password")}
       <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`
    ),
  };
}

export function verificationEmail(verifyLink: string): { subject: string; html: string } {
  return {
    subject: "Verify your MetGo CRM email",
    html: layout(
      "Verify your email",
      `<p>Confirm this email address to finish setting up your MetGo CRM account.</p>
       ${button(verifyLink, "Verify email")}
       <p>This link expires in 24 hours.</p>`
    ),
  };
}
