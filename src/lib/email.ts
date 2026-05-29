const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

// Resend sandbox: use onboarding@resend.dev until you verify a domain at resend.com/domains
// To send to any recipient, verify a domain and update this.
const FROM_EMAIL = "Scholarship Hub <onboarding@resend.dev>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — email not sent to", to);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}
