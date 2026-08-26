const pool = require("../config/db");
const nodemailer = require("nodemailer");
const templates = require("../utils/emailTemplates");
const { getIo } = require("../config/socket");

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const notificationService = {
    /**
     * Send a notification through multiple channels (In-app WebSocket, Database, Email, SMS)
     * Handles both notify({ userId, message, ... }) and notify(userIdOrContractorId, { message, ... })
     */
    notify: async (param1, param2) => {
        try {
            let opts = {};
            if (typeof param1 === "object" && param1 !== null) {
                opts = { ...param1 };
            } else {
                opts = { userId: param1, ...(param2 || {}) };
            }

            let { userId, contractorId, message, type, data, email, subject, templateName, templateData } = opts;
            if (!message) return;

            // Resolve target user_id if a contractor ID was supplied or passed as userId
            let targetUserId = userId;
            if (!targetUserId && contractorId) {
                const cRes = await pool.query("SELECT user_id FROM contractors WHERE id = $1", [contractorId]);
                if (cRes.rows[0]) targetUserId = cRes.rows[0].user_id;
            } else if (targetUserId) {
                // If targetUserId is not directly in users, check if it's a contractor id
                const uRes = await pool.query("SELECT id, email, name FROM users WHERE id = $1", [targetUserId]);
                if (!uRes.rows[0]) {
                    const cRes = await pool.query("SELECT user_id FROM contractors WHERE id = $1", [targetUserId]);
                    if (cRes.rows[0]) {
                        targetUserId = cRes.rows[0].user_id;
                    }
                } else if (!email && uRes.rows[0].email) {
                    email = uRes.rows[0].email;
                }
            }

            let savedNotification = null;

            // 1. Save In-App Notification in DB
            if (targetUserId) {
                const insertRes = await pool.query(
                    "INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3) RETURNING *",
                    [targetUserId, message, type || "general"]
                );
                savedNotification = insertRes.rows[0];
            }

            // 2. Real-Time WebSocket Push via Socket.IO
            if (targetUserId) {
                try {
                    const io = getIo();
                    if (io) {
                        const payload = {
                            notification: savedNotification,
                            id: savedNotification?.id || `notif_${Date.now()}`,
                            message,
                            type: type || "general",
                            data: data || {},
                            created_at: new Date().toISOString(),
                        };

                        io.to(String(targetUserId)).emit("notification:new", payload);
                        io.to(String(targetUserId)).emit("notification", payload);

                        if (type?.includes("booking") || type?.includes("quick_booking")) {
                            io.to(String(targetUserId)).emit("booking:new", payload);
                        }

                        console.log(`[REALTIME PUSH] Emitted notification to User ${targetUserId}: ${message}`);
                    }
                } catch (socketErr) {
                    // Socket not initialized or offline, non-blocking
                }
            }

            // 3. Send Email if SMTP configured
            if (email && process.env.SMTP_USER) {
                let htmlContent = `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #6366f1;">SahKaar</h2>
                            <p>${message}</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <small style="color: #999;">Cooperative Labour Federation Automated Notification</small>
                           </div>`;

                if (templateName && templates[templateName]) {
                    htmlContent = templates[templateName](...(templateData || []));
                }

                const mailOptions = {
                    from: `"SahKaar" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject: subject || "SahKaar Notification",
                    text: message,
                    html: htmlContent,
                };

                await transporter.sendMail(mailOptions).catch((e) => console.warn("Email send failed:", e.message));
            }

            console.log(`Notification dispatched to User ${targetUserId}: ${message}`);
            return savedNotification;
        } catch (error) {
            console.error("Notification Service Error:", error);
        }
    },

    sendOTP: async (phoneOrEmail, otp) => {
        console.log(`[SECURE] Sending OTP ${otp} to ${phoneOrEmail}`);
        if (phoneOrEmail.includes("@") && process.env.SMTP_USER) {
            await notificationService.notify({
                email: phoneOrEmail,
                subject: "Your SahKaar OTP",
                message: `Your one-time password (OTP) is: ${otp}.`,
                templateName: "otpTemplate",
                templateData: [otp]
            });
        }
    }
};

module.exports = notificationService;
