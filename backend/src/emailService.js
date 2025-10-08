import nodemailer from 'nodemailer';

// Configure the email transporter using credentials from environment variables.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * A reusable function to send an email.
 * @param {string} recipientEmail - The email address of the person receiving the email.
 * @param {string} subject - The subject line of the email.
 * @param {string} htmlBody - The HTML content of the email body.
 */
export const sendNotificationEmail = async (recipientEmail, subject, htmlBody) => {
  try {
    const mailOptions = {
      from: `"ClearPath Exeat" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlBody,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Notification email sent successfully to ${recipientEmail}`);
  } catch (error) {
    // Log the error for debugging, but don't crash the main application flow.
    // Email failure should not prevent the API from responding successfully.
    console.error(`Failed to send email to ${recipientEmail}:`, error);
  }
};