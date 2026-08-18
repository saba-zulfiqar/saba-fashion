const nodemailer = require("nodemailer");

/**
 * POST /api/contact
 * Handles customer contact form submissions.
 * Validates inputs and attempts to send email via Nodemailer SMTP.
 * Returns success ONLY if email sending succeeds.
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Server-side validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "A valid email address is required." });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: "Phone number is required." });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: "Subject is required." });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    const recipient = process.env.CONTACT_EMAIL || "sabazulfiqar926@gmail.com";
    const timestamp = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

    const mailSubject = `New Customer Query — Saba Fashion`;

    const mailBodyText = `Subject:
${mailSubject}

Body:

Customer Name: ${name}
Customer Email: ${email}
Customer Phone: ${phone}
Subject: ${subject}

Message:
${message}

Date:
${timestamp}
`;

    const mailBodyHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; padding: 24px; border: 1px solid #eee4de; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #a9615a; margin-top: 0; font-size: 22px;">New Customer Query — Saba Fashion</h2>
        <p style="color: #5c524c; font-size: 14px;"><strong>Date:</strong> ${timestamp}</p>
        <hr style="border: 0; border-top: 1px solid #eee4de; margin: 16px 0;" />
        <p style="margin: 8px 0;"><strong>Customer Name:</strong> ${name}</p>
        <p style="margin: 8px 0;"><strong>Customer Email:</strong> <a href="mailto:${email}" style="color: #a9615a;">${email}</a></p>
        <p style="margin: 8px 0;"><strong>Customer Phone:</strong> ${phone}</p>
        <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
        <hr style="border: 0; border-top: 1px solid #eee4de; margin: 16px 0;" />
        <p style="margin: 8px 0;"><strong>Message:</strong></p>
        <div style="white-space: pre-wrap; background: #faf5f1; padding: 16px; border-radius: 8px; border: 1px solid #eee4de; color: #241d1a;">${message}</div>
      </div>
    `;

    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const missingVars = [];
    if (!smtpUser) missingVars.push("SMTP_USER");
    if (!smtpPass) missingVars.push("SMTP_PASS");

    if (missingVars.length > 0) {
      console.error(`[Contact API] Cannot send email. Missing environment configuration: ${missingVars.join(", ")}`);
      return res.status(500).json({
        success: false,
        message: "We could not send your message right now. Please try again.",
        errorDetails: `Server configuration incomplete. Missing variables: ${missingVars.join(", ")}. Please set SMTP_USER and SMTP_PASS in server/.env file.`,
        missingVars,
      });
    }

    // SMTP credentials configured — send real email via Nodemailer
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"Saba Fashion Query" <${smtpUser}>`,
      replyTo: email,
      to: recipient,
      subject: mailSubject,
      text: mailBodyText,
      html: mailBodyHtml,
    });

    console.log(`[Contact API] Email successfully delivered to ${recipient}`);

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (err) {
    console.error("[Contact API] Nodemailer email sending failed:", err);
    res.status(500).json({
      success: false,
      message: "We could not send your message right now. Please try again.",
      errorDetails: err.message,
    });
  }
};
