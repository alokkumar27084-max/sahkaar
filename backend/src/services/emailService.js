// Simple email service using nodemailer for OTP delivery
const nodemailer = require('nodemailer');

// Create transporter using environment variables
// For development: uses ethereal/console fallback
// For production: use real SMTP (Gmail, SES, etc.)
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });
    } else {
        // Development fallback: log to console
        transporter = {
            sendMail: async (options) => {
                console.log('─── EMAIL (dev fallback) ───');
                console.log(`To: ${options.to}`);
                console.log(`Subject: ${options.subject}`);
                console.log(`Body: ${options.text || options.html}`);
                console.log('────────────────────────────');
                return { messageId: 'dev-' + Date.now() };
            },
        };
    }

    return transporter;
}

/**
 * Send OTP email
 * @param {string} email
 * @param {string} otp  6-digit code
 */
async function sendOtpEmail(email, otp) {
    const t = getTransporter();
    const siteName = 'Thekedaar';

    await t.sendMail({
        from: process.env.SMTP_FROM || `"${siteName}" <noreply@thekedaar.com>`,
        to: email,
        subject: `${otp} is your ${siteName} verification code`,
        text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\n– ${siteName}`,
        html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px; background: #0f172a; border-radius: 16px; color: #e2e8f0;">
        <h1 style="margin: 0 0 8px; font-size: 24px; color: #fff;">The<span style="color: #6366f1;">kedaar</span></h1>
        <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px;">Verification Code</p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 36px; letter-spacing: 8px; font-weight: 700; color: #6366f1; margin: 0; font-family: monospace;">${otp}</p>
        </div>
        <p style="font-size: 13px; color: #94a3b8; margin: 0;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="font-size: 12px; color: #64748b; margin: 16px 0 0;">If you didn't request this code, ignore this email.</p>
      </div>
    `,
    });
}

module.exports = { sendOtpEmail };
