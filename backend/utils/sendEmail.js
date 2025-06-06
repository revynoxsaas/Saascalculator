// utils/sendEmail.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure the Nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // true for port 465 (SSL), false for 587 (TLS)
  auth: {
    user: process.env.SMTP_USER, // Your SMTP username
    pass: process.env.SMTP_PASS, // Your SMTP password
  },
});

// --- Existing Email Functions (if any, make sure they are also pure JS) ---
// If you had interfaces for these previously, remove them too.
// For example, if you had:
// interface SignupEmailOptions {
//   to: string;
//   name: string;
//   token: string;
// }
// You would just use the function directly:
// export const sendSignupConfirmationEmail = async ({ to, name, token }) => { /* ... */ };


// NEW: Function to send company details email (removed TypeScript interface)
export const sendCompanyDetailsEmail = async ({
  to,
  subject,
  htmlContent,
}) => { // Removed ': CompanyDetailsEmailOptions' and ': Promise<void>'
  try {
    await transporter.sendMail({
      from: `"Revynox SaaS Calculator" <${process.env.SMTP_USER}>`, // Sender's email address
      to,      // Recipient(s)
      subject, // Email subject
      html: htmlContent, // HTML body of the email
    });
    console.log(`Email sent successfully to ${to} with subject: "${subject}"`);
  } catch (error) {
    console.error(`Error sending email to ${to} with subject "${subject}":`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
