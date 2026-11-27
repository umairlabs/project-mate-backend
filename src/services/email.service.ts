import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.resendApiKey);

// ============================================================================
// OTP GENERATION
// ============================================================================

/** Returns a cryptographically random 6-digit string e.g. "048271" */
export function generateOtp(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return digits;
}

/** OTP is valid for 10 minutes */
export function otpExpiresAt(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;border-radius:50%;background:#007AFF;color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:40px;">
                  PM
                </div>
                <span style="font-size:20px;font-weight:700;color:#1A1C1E;">Project<span style="color:#007AFF;">Mate</span></span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;border:1px solid #E5E9F0;padding:40px 36px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#73777F;">
                You received this email because an action was taken on your Project Mate account.<br/>
                If you did not request this, you can safely ignore this email.
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

function otpBlock(otp: string): string {
  return `
    <div style="margin:28px 0;text-align:center;">
      <div style="display:inline-block;background:#F0F7FF;border:2px dashed #007AFF;border-radius:16px;padding:20px 40px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#007AFF;font-family:'Courier New',monospace;">${otp}</span>
      </div>
      <p style="margin:12px 0 0;font-size:13px;color:#73777F;">This code expires in <strong>10 minutes</strong>.</p>
    </div>`;
}

// ============================================================================
// SEND: Email Verification OTP
// ============================================================================

export async function sendVerificationEmail(to: string, name: string, otp: string): Promise<void> {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1C1E;">Verify your email</h1>
    <p style="margin:0 0 4px;font-size:15px;color:#43474E;">Hi ${name},</p>
    <p style="margin:0 0 20px;font-size:15px;color:#43474E;">
      Welcome to Project Mate! Enter the code below to verify your email address and activate your account.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0;font-size:13px;color:#73777F;text-align:center;">
      Do not share this code with anyone.
    </p>`;

  await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: `${otp} is your Project Mate verification code`,
    html: baseTemplate('Verify your email — Project Mate', body),
  });
}

// ============================================================================
// SEND: Password Reset OTP
// ============================================================================

export async function sendPasswordResetEmail(to: string, name: string, otp: string): Promise<void> {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1C1E;">Reset your password</h1>
    <p style="margin:0 0 4px;font-size:15px;color:#43474E;">Hi ${name},</p>
    <p style="margin:0 0 20px;font-size:15px;color:#43474E;">
      We received a request to reset your Project Mate password. Enter the code below to continue.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0;font-size:13px;color:#73777F;text-align:center;">
      If you did not request a password reset, please ignore this email — your password will not change.
    </p>`;

  await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: `${otp} is your Project Mate password reset code`,
    html: baseTemplate('Reset your password — Project Mate', body),
  });
}
