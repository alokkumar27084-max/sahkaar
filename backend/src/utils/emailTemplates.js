const BRAND_COLOR = "#6366f1";
const ACCENT_COLOR = "#22d3ee";
const BG_COLOR = "#f8fafc";

const wrapTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${BG_COLOR}; padding: 40px 20px; }
        .card { background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .logo { font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 24px; text-align: center; }
        .h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 16px; line-height: 1.2; }
        .text { font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
        .button { display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 8px; }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
        .milestone-box { background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 4px solid ${BRAND_COLOR}; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">THEKEDAAR</div>
        <div class="card">
            ${content}
        </div>
        <div class="footer">
            &copy; 2026 Thekedaar. India's Trusted Contractor Platform.<br>
            Manit Bhopal, Madhya Pradesh, India.
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    otpTemplate: (otp) => wrapTemplate(`
        <h1 class="h1">Verify your identity</h1>
        <p class="text">Use the following one-time password (OTP) to complete your login. This code is valid for 10 minutes.</p>
        <div style="background: #f8fafc; border: 2px dashed #e2e8f0; padding: 20px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: ${BRAND_COLOR}; margin: 20px 0;">
            ${otp}
        </div>
        <p class="text" style="font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
    `),

    bookingConfirmed: (customerName, serviceName, amount) => wrapTemplate(`
        <h1 class="h1">Booking Confirmed!</h1>
        <p class="text">Hi ${customerName}, your booking for <strong>${serviceName}</strong> has been successfully created.</p>
        <div class="milestone-box">
            <p style="margin: 0; font-weight: bold; color: #0f172a;">Escrow Secured: ₹${Number(amount).toLocaleString('en-IN')}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">Funds are held safely and will only be released when you approve milestones.</p>
        </div>
        <p class="text">The contractor will reach out to you shortly to discuss the next steps.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/dashboard" class="button">View Dashboard</a>
    `),

    paymentReceived: (contractorName, serviceName, amount) => wrapTemplate(`
        <h1 class="h1">New Job Secured!</h1>
        <p class="text">Hi ${contractorName}, a new customer has secured payment for <strong>${serviceName}</strong>.</p>
        <div class="milestone-box" style="border-left-color: ${ACCENT_COLOR};">
            <p style="margin: 0; font-weight: bold; color: #0f172a;">Amount in Escrow: ₹${Number(amount).toLocaleString('en-IN')}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">You can now safely start the work. Funds are guaranteed once milestones are approved.</p>
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contractor/dashboard" class="button">Go to Dashboard</a>
    `),

    jobCompleted: (projectName) => wrapTemplate(`
        <h1 class="h1">Project Completed</h1>
        <p class="text">The project <strong>${projectName}</strong> has been marked as completed. Funds have been released from escrow to the contractor.</p>
        <p class="text">Thank you for using Thekedaar!</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/dashboard" class="button">Leave a Review</a>
    `)
};
