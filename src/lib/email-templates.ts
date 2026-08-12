function baseTemplate(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          ${content}
          <tr>
            <td style="padding:32px 40px;background-color:#FAF9F6;border-top:1px solid #E8E4DC">
              <p style="margin:0;font-size:13px;color:#8C97A8;text-align:center">
                SmartScholar &middot; Your gateway to global education
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Escapes user-supplied strings before they go into an HTML template. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Email verification.
 *
 * Language-aware: `lang` reflects which language the visitor was actually
 * using when they signed up (read from the site's own language preference,
 * not guessed), and the template is fully one language or the other — never
 * mixed.
 *
 * Arabic is the default when no language is known, because the product is
 * Arabic first and this is the very first thing a new student ever receives
 * from us. An English-only confirmation email on an Arabic signup reads as a
 * template someone forgot to translate — which is exactly what it was.
 *
 * The raw URL is printed below the button on purpose in both languages. A
 * meaningful share of users read mail in clients that strip or mangle styled
 * anchors, and "the button does nothing" is an unrecoverable dead end at the
 * very top of the funnel.
 */
export function confirmSignupHtml(
  name: string,
  confirmUrl: string,
  lang: "en" | "ar" = "ar"
): string {
  const safeName = esc(name);

  if (lang === "en") {
    return baseTemplate(
      `
      <tr>
        <td style="padding:36px 40px 0;text-align:center">
          <div style="width:56px;height:56px;border-radius:14px;background-color:#162C4C;margin:0 auto;text-align:center;line-height:56px">
            <span style="font-size:26px">&#9993;</span>
          </div>
          <h1 style="margin:20px 0 0;font-size:24px;font-weight:700;color:#162C4C">
            Confirm your email
          </h1>
          <p style="margin:12px 0 0;font-size:15px;color:#5F6B7F;line-height:1.6">
            Hi ${safeName} — your <strong style="color:#162C4C">SmartScholar</strong> account has been created.<br>
            Click the button below to verify your email and get started.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 40px 0;text-align:center">
          <a href="${confirmUrl}" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:600;color:#ffffff;background-color:#162C4C;border-radius:10px;text-decoration:none">
            Verify email address
          </a>
          <p style="margin:14px 0 0;font-size:13px;color:#8C97A8">
            This link is valid for 24 hours.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 40px 0">
          <p style="margin:0 0 6px;font-size:12px;color:#8C97A8;text-align:center">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="margin:0;font-size:12px;color:#162C4C;word-break:break-all;text-align:center" dir="ltr">
            ${confirmUrl}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 40px 32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;border-radius:10px">
            <tr>
              <td style="padding:18px">
                <p style="margin:0;font-size:13px;color:#5F6B7F;line-height:1.6">
                  <strong style="color:#162C4C">Why verify?</strong>
                  So we can send you a reminder before every step in your plan —
                  booking a test, requesting recommendation letters, starting a
                  draft. That's the most useful part of the product, and none of
                  it can reach you without a confirmed email.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-size:12px;color:#8C97A8;line-height:1.6;text-align:center">
            Didn't create this account? You can safely ignore this email — no
            further action is needed.
          </p>
        </td>
      </tr>
    `,
      "Confirm your email · SmartScholar"
    );
  }

  return baseTemplate(
    `
    <tr>
      <td style="padding:36px 40px 0;text-align:center" dir="rtl">
        <div style="width:56px;height:56px;border-radius:14px;background-color:#162C4C;margin:0 auto;text-align:center;line-height:56px">
          <span style="font-size:26px">✉️</span>
        </div>
        <h1 style="margin:20px 0 0;font-size:24px;font-weight:700;color:#162C4C">
          أكّد بريدك الإلكتروني
        </h1>
        <p style="margin:12px 0 0;font-size:15px;color:#5F6B7F;line-height:1.8">
          أهلاً ${safeName} — تم إنشاء حسابك في <strong style="color:#162C4C">SmartScholar</strong>.<br>
          اضغط الزر بالأسفل لتفعيل الحساب وتبدأ.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 40px 0;text-align:center">
        <a href="${confirmUrl}" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:600;color:#ffffff;background-color:#162C4C;border-radius:10px;text-decoration:none">
          تفعيل الحساب
        </a>
        <p style="margin:14px 0 0;font-size:13px;color:#8C97A8" dir="rtl">
          الرابط صالح لمدة ٢٤ ساعة
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 0">
        <p style="margin:0 0 6px;font-size:12px;color:#8C97A8;text-align:center" dir="rtl">
          لو الزر مش شغال، انسخ الرابط ده في المتصفح:
        </p>
        <p style="margin:0;font-size:12px;color:#162C4C;word-break:break-all;text-align:center" dir="ltr">
          ${confirmUrl}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 32px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;border-radius:10px">
          <tr>
            <td style="padding:18px" dir="rtl">
              <p style="margin:0;font-size:13px;color:#5F6B7F;line-height:1.8">
                <strong style="color:#162C4C">ليه التأكيد؟</strong>
                عشان نبعتلك تذكير قبل كل خطوة في خطتك — حجز الاختبار، طلب خطابات
                التوصية، بداية الكتابة. ده أهم جزء في الموقع، ومن غير بريد مؤكد
                مش هيوصلك.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:12px;color:#8C97A8;line-height:1.7;text-align:center" dir="rtl">
          لو مش إنت اللي عملت الحساب ده، تجاهل الرسالة ببساطة.
        </p>
        <p style="margin:10px 0 0;font-size:12px;color:#8C97A8;line-height:1.6;text-align:center">
          Didn't create this account? You can safely ignore this email.
        </p>
      </td>
    </tr>
  `,
    "أكّد بريدك الإلكتروني · Verify your email"
  );
}

export function resetPasswordHtml(resetUrl: string): string {
  return baseTemplate(`
    <tr>
      <td style="padding:48px 40px 32px;text-align:center">
        <h1 style="margin:0;font-size:28px;font-weight:700;color:#162C4C">Reset your password</h1>
        <p style="margin:12px 0 0;font-size:16px;color:#5F6B7F;line-height:1.5">
          Click below to choose a new password for your account.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;text-align:center">
        <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;background-color:#162C4C;border-radius:8px;text-decoration:none">
          Reset password
        </a>
        <p style="margin:20px 0 0;font-size:14px;color:#8C97A8">
          This link expires in 1 hour.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 48px">
        <p style="margin:0;font-size:14px;color:#5F6B7F;line-height:1.6">
          If you didn't request this, you can safely ignore this email.
        </p>
      </td>
    </tr>
  `, "Reset your password");
}

export function welcomeHtml(name: string, loginUrl: string): string {
  return baseTemplate(`
    <tr>
      <td style="padding:48px 40px 32px;text-align:center">
        <h1 style="margin:0;font-size:28px;font-weight:700;color:#162C4C">Welcome, ${name}!</h1>
        <p style="margin:12px 0 0;font-size:16px;color:#5F6B7F;line-height:1.5">
          Your account is ready. Log in to start exploring scholarships that match your profile.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 48px;text-align:center">
        <a href="${loginUrl}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;background-color:#162C4C;border-radius:8px;text-decoration:none">
          Log in to SmartScholar
        </a>
      </td>
    </tr>
  `, "Welcome to SmartScholar");
}

/**
 * Deadline reminder.
 *
 * Written in Arabic because the product is Arabic-first and this is the only
 * email a student receives unprompted — it has to feel like it came from a
 * service they chose, not a system.
 *
 * `dir="rtl"` on the body, and every number rendered as a plain numeral rather
 * than Arabic-Indic: email clients are wildly inconsistent about digit shaping
 * and a mangled date is worse than a Latin one.
 */
export function deadlineReminderHtml(
  name: string,
  items: { scholarshipName: string; step: string; daysLeft: number; dueDate: string }[],
  roadmapUrl: string
): string {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #E8E4DC">
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#162C4C">${i.step}</p>
          <p style="margin:0;font-size:13px;color:#5F6B7F">${i.scholarshipName}</p>
          <p style="margin:6px 0 0;font-size:13px;color:${i.daysLeft <= 3 ? "#A8443A" : "#162C4C"};font-weight:600">
            ${i.daysLeft <= 0 ? "اليوم" : `خلال ${i.daysLeft} ${i.daysLeft === 1 ? "يوم" : "أيام"}`} &middot; ${i.dueDate}
          </p>
        </td>
      </tr>`
    )
    .join("");

  return baseTemplate(
    `
    <tr>
      <td style="padding:36px 40px 0" dir="rtl">
        <h1 style="margin:0 0 8px;font-size:22px;color:#162C4C">مرحباً ${name}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#5F6B7F">
          هذه الخطوات في خطتك تقترب مواعيدها. الطلاب لا يفوّتون المنح لأنهم نسوا
          الموعد النهائي، بل لأنهم بدأوا متأخرين بأسابيع.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        <p style="margin:28px 0 0;text-align:center">
          <a href="${roadmapUrl}" style="display:inline-block;background-color:#162C4C;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:600">
            عرض خطتي
          </a>
        </p>
        <p style="margin:24px 0 36px;font-size:12px;color:#8C97A8;text-align:center">
          تصلك هذه الرسالة لأنك حفظت خطة لهذه المنحة.
        </p>
      </td>
    </tr>`,
    "تذكير بمواعيد منحتك"
  );
}
