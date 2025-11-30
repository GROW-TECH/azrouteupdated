// lib/email.js
import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: process.env.EMAIL_SERVER_PORT,
  secure: process.env.EMAIL_SERVER_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendEmail({ to, subject, template, data }) {
  const templates = {
    'event-registration': ({ eventTitle, eventDate, ticketType, registrationId }) => `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for registering for ${eventTitle}!</h2>
        <p>We are excited to have you join us. Here are the details of your registration:</p>
        <ul>
          <li><strong>Event Title:</strong> ${eventTitle}</li>
          <li><strong>Event Date:</strong> ${new Date(eventDate).toLocaleString()}</li>
          <li><strong>Ticket Type:</strong> ${ticketType}</li>
          <li><strong>Registration ID:</strong> ${registrationId}</li>
        </ul>
        <p>If you have any questions, feel free to contact us.</p>
        <p>We look forward to seeing you there!</p>
      </div>
    `,
    // Add other templates as needed
  };

  if (!templates[template]) {
    throw new Error(`Email template '${template}' not found`);
  }

  const html = templates[template](data);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Send email error:', error);
    throw new Error('Failed to send email');
  }
}
export async function sendPasswordResetEmail({ email, name, token, role }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const resetUrl = `${baseUrl}/auth/${role}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hello ${name},</h2>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #0070f3;">${resetUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail({ email, name, token, role, type = 'verify' }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  let subject, linkPath, buttonText, message;
  
  if (type === 'reset') {
    subject = 'Reset Your Password';
    linkPath = `/auth/${role}/reset-password`;
    buttonText = 'Reset Password';
    message = 'You requested to reset your password. Click the button below to reset it:';
  } else {
    subject = 'Verify Your Email';
    linkPath = `/auth/${role}/verify-token`;
    buttonText = 'Verify Email';
    message = 'Thank you for registering! Please verify your email by clicking the button below:';
  }

  const actionUrl = `${baseUrl}${linkPath}?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hello ${name},</h2>
        <p>${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            ${buttonText}
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #0070f3;">${actionUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
}
