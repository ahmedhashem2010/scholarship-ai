function baseTemplate(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          ${content}
          <tr>
            <td style="padding:32px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0">
              <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center">
                Scholarship Hub &middot; Your gateway to global education
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

export function confirmSignupHtml(confirmUrl: string): string {
  return baseTemplate(`
    <tr>
      <td style="padding:48px 40px 32px;text-align:center">
        <h1 style="margin:0;font-size:28px;font-weight:700;color:#1e293b">Welcome to Scholarship Hub</h1>
        <p style="margin:12px 0 0;font-size:16px;color:#64748b;line-height:1.5">
          You're one step away from discovering your ideal scholarship.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;text-align:center">
        <a href="${confirmUrl}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;background-color:#2563eb;border-radius:8px;text-decoration:none">
          Confirm your email
        </a>
        <p style="margin:20px 0 0;font-size:14px;color:#94a3b8">
          This link expires in 24 hours.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 48px">
        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </td>
    </tr>
  `, "Confirm your email");
}

export function resetPasswordHtml(resetUrl: string): string {
  return baseTemplate(`
    <tr>
      <td style="padding:48px 40px 32px;text-align:center">
        <h1 style="margin:0;font-size:28px;font-weight:700;color:#1e293b">Reset your password</h1>
        <p style="margin:12px 0 0;font-size:16px;color:#64748b;line-height:1.5">
          Click below to choose a new password for your account.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;text-align:center">
        <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;background-color:#2563eb;border-radius:8px;text-decoration:none">
          Reset password
        </a>
        <p style="margin:20px 0 0;font-size:14px;color:#94a3b8">
          This link expires in 1 hour.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 48px">
        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6">
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
        <h1 style="margin:0;font-size:28px;font-weight:700;color:#1e293b">Welcome, ${name}!</h1>
        <p style="margin:12px 0 0;font-size:16px;color:#64748b;line-height:1.5">
          Your account is ready. Log in to start exploring scholarships that match your profile.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 48px;text-align:center">
        <a href="${loginUrl}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;background-color:#2563eb;border-radius:8px;text-decoration:none">
          Log in to Scholarship Hub
        </a>
      </td>
    </tr>
  `, "Welcome to Scholarship Hub");
}
