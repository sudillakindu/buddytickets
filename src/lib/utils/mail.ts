// lib/utils/mail.ts
import nodemailer from 'nodemailer';

const BASE_URL = (process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const LOGO_URL = `${BASE_URL}/email-logo.png`;
const EVENTS_URL = `${BASE_URL}/events`;
const PRIVACY_URL = `${BASE_URL}/privacy`;
const SIGN_IN_URL = `${BASE_URL}/sign-in`;
const FORGOT_PASSWORD_URL = `${BASE_URL}/forget-password`;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? '';
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER ?? '';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%20received%20a%20notification%20that%20my%20BuddyTickets%20account%20password%20was%20changed.%20I%20did%20not%20make%20this%20change%20and%20need%20immediate%20assistance.`;

function getMailerCredentials(): { user: string; pass: string } {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('Missing Gmail credentials in environment variables.');
  }

  return { user, pass };
}

function getTransporter() {
  const credentials = getMailerCredentials();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: credentials.user, pass: credentials.pass },
  });
}

function buildEmailTemplate(title: string, headerTitle: string, headerSubtitle: string, contentHtml: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.10);border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#0f172a 0%,#7c3aed 100%);padding:36px 32px 28px;text-align:center;">
        <a href="${BASE_URL}" style="display:inline-block;margin:0 0 20px;">
          <img src="${LOGO_URL}" alt="BuddyTickets" width="48" height="48" style="display:block;margin:0 auto;width:48px;height:48px;border-radius:12px;object-fit:contain;">
        </a>
        <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 6px;letter-spacing:-0.3px;line-height:1.3;">${headerTitle}</h1>
        <p style="color:rgba(255,255,255,0.72);font-size:13px;margin:0;line-height:1.5;">${headerSubtitle}</p>
      </div>
      <div style="padding:36px 32px;">
        ${contentHtml}
      </div>
      <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="text-align:center;padding:0 0 12px;">
              <a href="${BASE_URL}" style="color:#7c3aed;font-size:13px;font-weight:600;text-decoration:none;">BuddyTickets</a>
              <span style="color:#e2e8f0;margin:0 8px;">|</span>
              <a href="${EVENTS_URL}" style="color:#64748b;font-size:12px;text-decoration:none;">Events</a>
              <span style="color:#e2e8f0;margin:0 8px;">|</span>
              <a href="${PRIVACY_URL}" style="color:#64748b;font-size:12px;text-decoration:none;">Privacy</a>
              <span style="color:#e2e8f0;margin:0 8px;">|</span>
              <a href="mailto:${SUPPORT_EMAIL}" style="color:#64748b;font-size:12px;text-decoration:none;">Support</a>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;">
              <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">&copy; ${year} BuddyTickets &middot; Matara, Sri Lanka<br>You received this email because you have an account with BuddyTickets.</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendSignUpOtpEmail(to: string, otp: string): Promise<void> {
  const credentials = getMailerCredentials();
  const transporter = getTransporter();
  const content = `
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">You&rsquo;re almost there! Enter the verification code below to confirm your email address and activate your <strong style="color:#1e293b;">BuddyTickets</strong> account.</p>
    <p style="color:#64748b;font-size:14px;margin:0 0 32px;">Copy the code and paste it on the verification page. Do not share it with anyone.</p>
    <div style="background:linear-gradient(135deg,#f8fafc 0%,#ede9fe 100%);border:2px solid #7c3aed;border-radius:14px;padding:28px 24px;text-align:center;margin:0 0 32px;">
      <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">Your Verification Code</p>
      <span style="font-size:40px;font-weight:800;letter-spacing:14px;color:#7c3aed;font-family:'Courier New',monospace;display:inline-block;padding:0 8px;">${otp}</span>
      <p style="color:#64748b;font-size:12px;margin:12px 0 0;">⏱ This code expires in <strong>10 minutes</strong></p>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;line-height:1.6;">Didn&rsquo;t create an account? You can safely ignore this email.</p>`;

  await transporter.sendMail({
    from: `"BuddyTickets" <${credentials.user}>`,
    to,
    subject: 'Verify Your Email - BuddyTickets',
    html: buildEmailTemplate('Verify Your Email', 'One Step to Go! 🎉', 'Verify your email to activate your account', content),
  });
}

export async function sendSignInOtpEmail(to: string, otp: string): Promise<void> {
  const credentials = getMailerCredentials();
  const transporter = getTransporter();
  const content = `
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">We noticed a sign-in attempt to your <strong style="color:#1e293b;">BuddyTickets</strong> account. Use the code below to verify your identity and complete sign-in.</p>
    <p style="color:#64748b;font-size:14px;margin:0 0 32px;">Copy the code and paste it on the verification page. Do not share it with anyone.</p>
    <div style="background:linear-gradient(135deg,#f8fafc 0%,#ede9fe 100%);border:2px solid #7c3aed;border-radius:14px;padding:28px 24px;text-align:center;margin:0 0 32px;">
      <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">Your Verification Code</p>
      <span style="font-size:40px;font-weight:800;letter-spacing:14px;color:#7c3aed;font-family:'Courier New',monospace;display:inline-block;padding:0 8px;">${otp}</span>
      <p style="color:#64748b;font-size:12px;margin:12px 0 0;">⏱ This code expires in <strong>10 minutes</strong></p>
    </div>
    <p style="color:#ea580c;font-size:14px;font-weight:600;margin:0 0 6px;line-height:1.6;">If you didn&rsquo;t try to sign in, your account may be at risk.</p>
    <p style="color:#64748b;font-size:14px;margin:0;line-height:1.6;"><a href="${FORGOT_PASSWORD_URL}" style="color:#7c3aed;font-weight:600;text-decoration:none;">Reset your password now &rarr;</a></p>`;

  await transporter.sendMail({
    from: `"BuddyTickets" <${credentials.user}>`,
    to,
    subject: 'Sign-In Verification Code - BuddyTickets',
    html: buildEmailTemplate('Sign-In Verification', 'Sign-In Verification 🔐', 'Confirm your identity to continue', content),
  });
}

export async function sendForgotPasswordOtpEmail(to: string, otp: string): Promise<void> {
  const credentials = getMailerCredentials();
  const transporter = getTransporter();
  const content = `
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">We received a password reset request for your <strong style="color:#1e293b;">BuddyTickets</strong> account. Use the code below to verify your identity before setting a new password.</p>
    <p style="color:#64748b;font-size:14px;margin:0 0 32px;">Copy the code and paste it on the verification page. Do not share it with anyone.</p>
    <div style="background:linear-gradient(135deg,#f8fafc 0%,#ede9fe 100%);border:2px solid #7c3aed;border-radius:14px;padding:28px 24px;text-align:center;margin:0 0 32px;">
      <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">Your Verification Code</p>
      <span style="font-size:40px;font-weight:800;letter-spacing:14px;color:#7c3aed;font-family:'Courier New',monospace;display:inline-block;padding:0 8px;">${otp}</span>
      <p style="color:#64748b;font-size:12px;margin:12px 0 0;">⏱ This code expires in <strong>10 minutes</strong></p>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0 0 6px;text-align:center;line-height:1.6;">Didn&rsquo;t request this? Your password is safe, no changes were made.</p>
    <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;line-height:1.6;">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#7c3aed;text-decoration:none;">Contact support</a>.</p>`;

  await transporter.sendMail({
    from: `"BuddyTickets" <${credentials.user}>`,
    to,
    subject: 'Password Reset Code - BuddyTickets',
    html: buildEmailTemplate('Password Reset', 'Password Reset 🔑', 'Reset your account password', content),
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const credentials = getMailerCredentials();
  const transporter = getTransporter();
  const firstName = name.split(' ')[0];
  const content = `
    <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 16px;">Hey <strong style="color:#1e293b;">${firstName}</strong>! 👋</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 32px;">Welcome to <strong style="color:#1e293b;">BuddyTickets</strong>. Sri Lanka&rsquo;s premier platform for discovering and enjoying events with the people you love. Your account is ready to go!</p>
    <div style="margin:0 0 32px;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin:0 0 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="width:36px;vertical-align:middle;font-size:22px;">🎫</td>
            <td style="vertical-align:middle;padding-left:8px;">
              <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0 0 2px;">Browse Events</p>
              <p style="color:#64748b;font-size:13px;margin:0;">Discover concerts, workshops &amp; more near you</p>
            </td>
          </tr>
        </table>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin:0 0 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="width:36px;vertical-align:middle;font-size:22px;">👥</td>
            <td style="vertical-align:middle;padding-left:8px;">
              <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0 0 2px;">Find Buddies</p>
              <p style="color:#64748b;font-size:13px;margin:0;">Connect with friends and experience events together</p>
            </td>
          </tr>
        </table>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin:0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="width:36px;vertical-align:middle;font-size:22px;">🎟️</td>
            <td style="vertical-align:middle;padding-left:8px;">
              <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0 0 2px;">Book Tickets</p>
              <p style="color:#64748b;font-size:13px;margin:0;">Secure your spot quickly and easily</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <div style="text-align:center;margin:0 0 32px;">
      <a href="${EVENTS_URL}" style="display:inline-block;background:linear-gradient(135deg,#0f172a 0%,#7c3aed 100%);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:0.2px;">Explore Events Now</a>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;line-height:1.6;">Need help getting started? <a href="mailto:${SUPPORT_EMAIL}" style="color:#7c3aed;text-decoration:none;">Contact our support team</a>.</p>`;

  await transporter.sendMail({
    from: `"BuddyTickets" <${credentials.user}>`,
    to,
    subject: `Welcome to BuddyTickets, ${firstName}! 🎉`,
    html: buildEmailTemplate('Welcome to BuddyTickets', 'Welcome Aboard! 🎉', 'Your account is ready. Let&rsquo;s explore events', content),
  });
}

export async function sendPasswordChangedEmail(to: string, name: string): Promise<void> {
  const credentials = getMailerCredentials();
  const transporter = getTransporter();
  const firstName = name.split(' ')[0];
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const content = `
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">Hi <strong style="color:#1e293b;">${firstName}</strong>,</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 32px;">Your <strong style="color:#1e293b;">BuddyTickets</strong> account password was successfully updated. Here&rsquo;s a summary of the change:</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin:0 0 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:12px 16px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="width:32px;vertical-align:middle;font-size:18px;line-height:1;">📅</td>
                <td style="vertical-align:middle;padding-left:8px;">
                  <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Date</span><br>
                  <span style="color:#1e293b;font-size:14px;font-weight:500;">${dateStr}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 16px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
        <tr>
          <td style="padding:12px 16px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="width:32px;vertical-align:middle;font-size:18px;line-height:1;">🕐</td>
                <td style="vertical-align:middle;padding-left:8px;">
                  <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Time</span><br>
                  <span style="color:#1e293b;font-size:14px;font-weight:500;">${timeStr}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 16px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
        <tr>
          <td style="padding:12px 16px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="width:32px;vertical-align:middle;font-size:18px;line-height:1;">✅</td>
                <td style="vertical-align:middle;padding-left:8px;">
                  <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Status</span><br>
                  <span style="color:#1e293b;font-size:14px;font-weight:500;">Password changed successfully</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    <div style="margin:0 0 32px;">
      <p style="color:#ea580c;font-size:14px;font-weight:600;margin:0 0 6px;line-height:1.6;">Wasn&rsquo;t you?</p>
      <p style="color:#64748b;font-size:14px;margin:0;line-height:1.6;"><a href="${FORGOT_PASSWORD_URL}" style="color:#7c3aed;font-weight:600;text-decoration:none;">Secure your account immediately!</a></p>
      <p style="color:#94a3b8;font-size:13px;margin:12px 0 0;">If you need assistance, <a href="${WHATSAPP_URL}" style="color:#7c3aed;text-decoration:none;">contact us on WhatsApp</a>.</p>
    </div>
    <div style="text-align:center;margin:0 0 32px;">
      <a href="${SIGN_IN_URL}" style="display:inline-block;background:linear-gradient(135deg,#0f172a 0%,#7c3aed 100%);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:0.2px;">Sign In to Your Account</a>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;line-height:1.6;">This notification was sent to protect your <a href="${BASE_URL}" style="color:#7c3aed;text-decoration:none;">BuddyTickets</a> account.</p>`;

  await transporter.sendMail({
    from: `"BuddyTickets" <${credentials.user}>`,
    to,
    subject: 'Your Password Was Changed - BuddyTickets',
    html: buildEmailTemplate('Password Updated', 'Password Updated ✅', 'Your account password has been changed', content),
  });
}