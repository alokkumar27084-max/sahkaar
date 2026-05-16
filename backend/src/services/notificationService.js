const pool = require("../config/db");
const nodemailer = require("nodemailer");
const templates = require("../utils/emailTemplates");

// Create a transporter using environment variables
// Fallback to a "Log Transporter" for development
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const notificationService = {
    /**
     * Send a notification through multiple channels (In-app, Email, SMS)
     */
    notify: async ({ userId, message, type, email, subject, templateName, templateData }) => {
        try {
            // 1. Save In-App Notification (Always)
            if (userId) {
                await pool.query(
                    "INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)",
                    [userId, message, type]
                );
            }

            // 2. Send Email if provided
            if (email && process.env.SMTP_USER) {
                let htmlContent = `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #6366f1;">Thekedaar</h2>
                            <p>${message}</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <small style="color: #999;">This is an automated notification. Please do not reply.</small>
                           </div>`;

                if (templateName && templates[templateName]) {
                    htmlContent = templates[templateName](...(templateData || []));
                }

                const mailOptions = {
                    from: `"Thekedaar" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject: subject || "Update from Thekedaar",
                    text: message,
                    html: htmlContent,
                };

                await transporter.sendMail(mailOptions);
            }

            // 3. Send SMS (Placeholder for Twilio/MSG91)
            // if (phone) { ... }

            console.log(`Notification sent to User ${userId}: ${message}`);
        } catch (error) {
            console.error("Notification Service Error:", error);
            // We don't throw here to avoid breaking the main request flow
        }
    },

    sendOTP: async (phoneOrEmail, otp) => {
        console.log(`[SECURE] Sending OTP ${otp} to ${phoneOrEmail}`);
        // If email, send via SMTP
        if (phoneOrEmail.includes("@") && process.env.SMTP_USER) {
            await notificationService.notify({
                email: phoneOrEmail,
                subject: "Your Thekedaar OTP",
                message: `Your one-time password (OTP) is: ${otp}.`,
                templateName: "otpTemplate",
                templateData: [otp]
            });
        }
    }
};

module.exports = notificationService;
