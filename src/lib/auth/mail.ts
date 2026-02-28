import nodemailer from "nodemailer";

function getMailCredentials(): { gmailUsername: string; gmailPassword: string } {
    const gmailUsername = process.env.GMAIL_USER;
    if (!gmailUsername) {
        throw new Error(
            "Missing GMAIL_USER environment variable. Set it to your Gmail address."
        );
    }
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;
    if (!gmailPassword) {
        throw new Error(
            "Missing GMAIL_APP_PASSWORD environment variable. Generate one at: https://myaccount.google.com/apppasswords"
        );
    }
    return { gmailUsername, gmailPassword };
}

const { gmailUsername: gmailUsername, gmailPassword: gmailPassword } = getMailCredentials();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUsername, pass: gmailPassword },
});

const SUBJECTS: Record<string, string> = {
    signup: "Verify Your Email - BuddyTickets",
    signin: "Sign In Verification - BuddyTickets",
    "forgot-password": "Password Reset Code - BuddyTickets",
};

export async function sendOtpEmail(
    to: string,
    otp: string,
    purpose: string
): Promise<void> {
    const subject = SUBJECTS[purpose] ?? "Your Verification Code - BuddyTickets";
    const actionText = purpose === "forgot-password" ? "reset your password" : "verify your email";

    await transporter.sendMail({
        from: `"BuddyTickets" <${gmailUsername}>`,
        to,
        subject,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
                <h2 style="color:#1e293b;margin-bottom:8px">Your Verification Code</h2>
                <p style="color:#64748b;margin-bottom:24px">
                    Use the code below to ${actionText}. It expires in 10 minutes.
                </p>
                <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                    <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1e293b">${otp}</span>
                </div>
                <p style="color:#94a3b8;font-size:13px">
                    If you didn't request this, you can safely ignore this email.
                </p>
            </div>
        `.trim(),
    });
}