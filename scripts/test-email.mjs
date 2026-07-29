import "./_env.mjs";
import net from "node:net";
import tls from "node:tls";

/**
 * Verifies the Zoho SMTP chain end to end.
 *
 *   node scripts/test-email.mjs                  # check config + login only
 *   node scripts/test-email.mjs you@gmail.com    # also send a real message
 *
 * Deliberately has no dependencies. This script has to be runnable before
 * `npm install`, because "email doesn't work" and "node_modules is out of
 * date" are the two states you most need to tell apart.
 *
 * A silent email failure is the worst kind: the product looks fine and
 * students simply never hear from you. Run this before trusting signup or the
 * reminder cron.
 */

const HOST = process.env.SMTP_HOST || "smtp.zoho.com";
const PORT = Number(process.env.SMTP_PORT || 465);
const USER = process.env.SMTP_USER || "";
const PASS = process.env.SMTP_PASSWORD || "";
const FROM = process.env.EMAIL_FROM || (USER ? `SmartScholar <${USER}>` : "");
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
const info = (m) => console.log(`    ${m}`);

const addressOf = (v) => {
  const m = v.match(/<([^>]+)>/);
  return (m ? m[1] : v).trim();
};

/** Minimal SMTP client. Enough to authenticate and send one message. */
function smtp(socket) {
  let buffer = "";
  const waiters = [];

  socket.setEncoding("utf8");
  socket.on("data", (chunk) => {
    buffer += chunk;
    // A reply is complete when a line reads "NNN " (space, not hyphen).
    const match = buffer.match(/^\d{3} [^\n]*\r?\n/m);
    if (match) {
      const reply = buffer;
      buffer = "";
      const w = waiters.shift();
      if (w) w.resolve({ code: Number(reply.slice(0, 3)), text: reply.trim() });
    }
  });

  const read = () =>
    new Promise((resolve, reject) => {
      waiters.push({ resolve, reject });
      setTimeout(() => reject(new Error("SMTP read timed out")), 20_000).unref?.();
    });

  return {
    read,
    async send(line, { secret = false } = {}) {
      if (process.env.SMTP_DEBUG) console.log(`    > ${secret ? "***" : line}`);
      socket.write(line + "\r\n");
      return read();
    },
    async expect(line, codes, opts) {
      const r = await this.send(line, opts);
      if (!codes.includes(r.code)) {
        throw new Error(`${line.split(" ")[0]} -> ${r.text.split("\n")[0]}`);
      }
      return r;
    },
  };
}

function connect() {
  return new Promise((resolve, reject) => {
    const onError = (e) => reject(new Error(`${e.code || "ERR"}: ${e.message}`));
    const socket =
      PORT === 465
        ? tls.connect({ host: HOST, port: PORT, servername: HOST }, () => resolve(socket))
        : net.connect({ host: HOST, port: PORT }, () => resolve(socket));
    socket.once("error", onError);
    socket.setTimeout(15_000, () => reject(new Error("Connection timed out")));
  });
}

/** RFC 2047 encoded-word, so Arabic subjects survive every mail client. */
const encodeHeader = (s) =>
  /^[\x20-\x7E]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;

async function main() {
  const to = process.argv[2];

  console.log("\nSMTP configuration\n" + "─".repeat(52));

  let fatal = false;
  if (!USER) { bad("SMTP_USER not set"); fatal = true; } else ok(`User: ${USER}`);
  if (!PASS) {
    bad("SMTP_PASSWORD not set");
    info("With 2FA on, this must be a Zoho APP PASSWORD, not your login password.");
    info("Zoho Account -> Security -> App Passwords");
    fatal = true;
  } else {
    ok(`Password: set (${PASS.length} chars)`);
  }
  if (!FROM) { bad("EMAIL_FROM not set"); fatal = true; } else ok(`From: ${FROM}`);

  ok(`Server: ${HOST}:${PORT} (${PORT === 465 ? "implicit TLS" : "STARTTLS"})`);

  if (PORT !== 465 && PORT !== 587) {
    warn(`Port ${PORT} is unusual for Zoho. Expected 465 or 587.`);
  }
  if (USER && FROM && addressOf(FROM).toLowerCase() !== USER.toLowerCase()) {
    warn(`EMAIL_FROM (${addressOf(FROM)}) differs from SMTP_USER (${USER})`);
    info("Zoho rejects a From address that isn't the mailbox or a verified alias.");
  }
  if (!SITE) {
    warn("NEXT_PUBLIC_SITE_URL not set — confirmation links in emails will be broken");
  } else if (SITE.includes("localhost")) {
    warn(`NEXT_PUBLIC_SITE_URL is ${SITE} — confirmation links will point at localhost`);
  } else {
    ok(`Site URL: ${SITE}`);
  }

  if (fatal) {
    console.log("\nFix the above first.\n");
    process.exitCode = 1;
    return;
  }

  console.log("\nConnecting\n" + "─".repeat(52));

  let socket;
  try {
    socket = await connect();
  } catch (e) {
    bad(e.message);
    info("");
    info("Common causes:");
    info(`  · Wrong region. Try smtp.zoho.eu or smtp.zoho.in instead of ${HOST}.`);
    info("  · Port blocked by your network or ISP.");
    process.exitCode = 1;
    return;
  }

  const c = smtp(socket);

  try {
    const greeting = await c.read();
    if (greeting.code !== 220) throw new Error(`Unexpected greeting: ${greeting.text}`);
    ok("Connected");

    await c.expect(`EHLO smartscholar.org`, [250]);

    if (PORT !== 465) {
      await c.expect("STARTTLS", [220]);
      bad("STARTTLS upgrade isn't implemented in this script — use port 465 to test.");
      socket.end();
      process.exitCode = 1;
      return;
    }

    const authPayload = Buffer.from(`\0${USER}\0${PASS}`, "utf8").toString("base64");
    await c.expect(`AUTH PLAIN ${authPayload}`, [235], { secret: true });
    ok("Authenticated");
  } catch (e) {
    bad(e.message);
    if (/535|authentication/i.test(e.message)) {
      info("");
      info("535 means the credentials were refused. In order of likelihood:");
      info("  1. 2FA is on and this is your normal password — you need an app password.");
      info("  2. SMTP access is disabled for the mailbox in the Zoho admin console.");
      info("  3. Wrong region host (zoho.com vs zoho.eu vs zoho.in).");
    }
    socket.end();
    process.exitCode = 1;
    return;
  }

  if (!to) {
    socket.end();
    console.log("\n" + "─".repeat(52));
    console.log("Config and login are good. To send a real test:\n");
    console.log("  node scripts/test-email.mjs you@gmail.com\n");
    return;
  }

  console.log(`\nSending to ${to}\n` + "─".repeat(52));

  const subject = "SmartScholar — اختبار البريد · test email";
  const body = [
    `From: ${FROM}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(
      `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px">
         <h2 style="color:#0f172a;margin:0 0 12px">Email is working.</h2>
         <p style="color:#475569;line-height:1.7;margin:0 0 20px">
           If you're reading this, the whole chain is live: Zoho accepted the
           credentials, the From address was allowed, and confirmation emails
           and deadline reminders will reach students.
         </p>
         <p style="color:#94a3b8;font-size:13px;margin:0">
           Sent from ${FROM} via ${HOST}:${PORT} · ${SITE || "no site URL set"}
         </p>
       </div>`,
      "utf8"
    )
      .toString("base64")
      .replace(/(.{76})/g, "$1\r\n"),
  ].join("\r\n");

  try {
    await c.expect(`MAIL FROM:<${addressOf(FROM)}>`, [250]);
    await c.expect(`RCPT TO:<${to}>`, [250, 251]);
    await c.expect("DATA", [354]);
    const sent = await c.send(body + "\r\n.");
    if (sent.code !== 250) throw new Error(sent.text.split("\n")[0]);
    ok("Accepted by Zoho");
    await c.send("QUIT");
    socket.end();

    info("");
    info("Now check the inbox. Three things to look at:");
    info("  1. Did it arrive at all?");
    info("  2. Is it in SPAM? If so, your SPF/DKIM/DMARC need attention.");
    info("  3. Does the sender name read the way students should see it?");
    info("");
    info("If it landed in spam, add these DNS records for smartscholar.org:");
    info("  SPF   TXT  @   v=spf1 include:zohomail.com ~all");
    info("  DKIM  from Zoho Mail Admin -> Email Configuration -> DKIM");
    info("  DMARC TXT  _dmarc  v=DMARC1; p=none; rua=mailto:care@smartscholar.org");
    info("");
    info("Only ONE SPF record is allowed per domain. If one already exists,");
    info("merge the include into it — never add a second.");
  } catch (e) {
    bad(e.message);
    if (/553|571|relay/i.test(e.message)) {
      info("");
      info("Zoho refused the From address. It must be the authenticated mailbox");
      info("or a verified alias of it.");
    }
    socket.end();
    process.exitCode = 1;
  }
}

main().catch((e) => {
  bad(e.message);
  process.exitCode = 1;
});
