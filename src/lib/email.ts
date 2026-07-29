import nodemailer from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool";

// `createTransport` is overloaded, and `pool: true` selects the SMTPPool
// overload whose SentMessageInfo carries a `pending` array the plain SMTP one
// doesn't. `ReturnType<typeof nodemailer.createTransport>` resolves to the
// *default* overload, so it looks right and fails to compile. Name the pool
// type explicitly.
type Mailer = nodemailer.Transporter<SMTPPool.SentMessageInfo>;

/**
 * Transactional email — Zoho Mail over SMTP.
 *
 * WHY SMTP AND NOT AN API
 *
 * Resend was removed. The mailbox is care@smartscholar.org on Zoho, and Zoho's
 * free tier gives you SMTP but not a transactional HTTP API. SMTP also means
 * there is exactly one place email is configured: if you can send from the
 * mailbox, the app can send from the mailbox.
 *
 * ZOHO GOTCHAS THAT WILL COST YOU AN HOUR EACH
 *
 * 1. **The host is region-specific.** An account created on zoho.com uses
 *    smtp.zoho.com; zoho.eu uses smtp.zoho.eu; zoho.in uses smtp.zoho.in.
 *    Using the wrong one fails authentication with a misleading error.
 * 2. **If two-factor auth is on — and it should be — your normal password will
 *    not work.** You need an app-specific password from
 *    Zoho Account → Security → App Passwords.
 * 3. **The From address must be the authenticated mailbox** (or a verified
 *    alias of it). Zoho rejects anything else outright rather than silently
 *    rewriting it, which is the good behaviour but surprises people.
 * 4. **Free plans are inbound/webmail-only on some tiers.** If SMTP auth keeps
 *    failing with correct credentials, check that IMAP/SMTP access is enabled
 *    in the Zoho admin console.
 *
 * Run `node scripts/test-email.mjs you@gmail.com` before trusting any of this.
 */

const SMTP_HOST = process.env.SMTP_HOST || "smtp.zoho.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";

/**
 * Display name + address students see. Defaults to the SMTP user so a
 * half-finished config still sends from something valid rather than from a
 * placeholder domain that will be rejected.
 */
const FROM_EMAIL =
  process.env.EMAIL_FROM || (SMTP_USER ? `SmartScholar <${SMTP_USER}>` : "");

/** Replies go to a mailbox a human actually reads. */
const REPLY_TO = process.env.EMAIL_REPLY_TO || SMTP_USER;

const IS_CONFIGURED = Boolean(SMTP_USER && SMTP_PASSWORD && FROM_EMAIL);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative. Generated from the HTML when omitted. */
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  sent: boolean;
  reason?: string;
}

/**
 * One transporter per warm process.
 *
 * `pool: true` keeps the TCP connection open between sends, which matters for
 * the nightly reminder cron — otherwise every student costs a fresh TLS
 * handshake and Zoho starts throttling.
 */
let transporter: Mailer | null = null;

function getTransporter(): Mailer {
  if (transporter) return transporter;

  // Assigned via a local so the return value is non-null to the compiler —
  // returning the module-level `let` directly reads as possibly-null.
  const created: Mailer = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    // 465 is implicit TLS; 587 starts plaintext and upgrades via STARTTLS.
    // Getting this backwards is the single most common SMTP misconfiguration.
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    pool: true,
    maxConnections: 2,
    // Serverless functions get killed at ~10s on some plans. Fail fast and
    // log rather than hanging the request that triggered the send.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  transporter = created;
  return created;
}

/** Crude HTML → text. Good enough for a multipart alternative part. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Sends a transactional email.
 *
 * Never throws. Email failures must not break the flow that triggered them —
 * a user should still get an account even if the welcome email bounces. The
 * caller receives a result object and decides what to surface.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendEmailParams): Promise<SendEmailResult> {
  if (!IS_CONFIGURED) {
    const missing = [
      !SMTP_USER && "SMTP_USER",
      !SMTP_PASSWORD && "SMTP_PASSWORD",
      !FROM_EMAIL && "EMAIL_FROM",
    ]
      .filter(Boolean)
      .join(", ");
    console.warn(`[email] Not configured (${missing}) — "${subject}" not sent to ${to}`);
    return { sent: false, reason: `SMTP not configured: ${missing}` };
  }

  try {
    const info = await getTransporter().sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text ?? htmlToText(html),
      replyTo: replyTo ?? REPLY_TO,
      headers: {
        // Tells Gmail/Outlook this is transactional, not bulk. Without it,
        // automated mail to a fresh domain lands in Promotions or worse.
        "Auto-Submitted": "auto-generated",
      },
    });

    // Zoho can accept a message and still reject individual recipients.
    if (info.rejected && info.rejected.length > 0) {
      console.error(`[email] Rejected recipients for "${subject}": ${info.rejected.join(", ")}`);
      return { sent: false, reason: "Recipient rejected by the mail server" };
    }

    return { sent: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown SMTP error";
    console.error(`[email] Failed to send "${subject}" to ${to}: ${msg}`);

    // A bad password poisons the pooled connection; drop it so the next
    // attempt reconnects instead of reusing a dead socket.
    transporter = null;

    return { sent: false, reason: msg };
  }
}

/**
 * True when email is configured well enough to reach arbitrary recipients.
 * Used by the launch readiness check.
 */
export function isEmailProductionReady(): boolean {
  return IS_CONFIGURED;
}

/** For diagnostics only — never log the password. */
export function emailConfigSummary() {
  return {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER || "(unset)",
    from: FROM_EMAIL || "(unset)",
    replyTo: REPLY_TO || "(unset)",
    configured: IS_CONFIGURED,
  };
}
