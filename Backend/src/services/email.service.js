import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { config } from '../config/env.js';

let transporter = null;

/**
 * Initialize and get the Nodemailer transporter
 */
const getTransporter = () => {
  if (!process.env.EMAIL_USER) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    dotenv.config({ path: path.resolve(process.cwd(), 'Backend/.env') });
  }

  const emailUser = process.env.EMAIL_USER || config.email?.user || '';
  const emailPass = process.env.EMAIL_PASS || config.email?.pass || '';

  // If user and pass are provided in env, configure real SMTP transporter
  if (emailUser && emailPass) {
    if (!transporter || transporter.isMock) {
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || config.email?.service || 'gmail',
        host: process.env.EMAIL_HOST || config.email?.host || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || config.email?.port || '587', 10),
        secure: (process.env.EMAIL_SECURE || config.email?.secure) === 'true',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      transporter.verify((error) => {
        if (error) {
          console.warn(`[Nodemailer Warning] SMTP verification failed: ${error.message}`);
        } else {
          console.log(`[Nodemailer] SMTP Transporter connected successfully (${emailUser})`);
        }
      });
    }
    return transporter;
  }

  // Development fallback mock transporter (logs to console)
  console.log('[Nodemailer] Running in simulated mode (Add EMAIL_USER & EMAIL_PASS in .env for live email delivery)');
  const mockTransporter = {
    isMock: true,
    sendMail: async (mailOptions) => {
      console.log('\n================== [NODEMAILER SIMULATED EMAIL] ==================');
      console.log(`To:      ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`From:    ${mailOptions.from || config.email?.from}`);
      console.log('------------------------------------------------------------------');
      console.log(mailOptions.text || '(HTML Email Content Sent)');
      console.log('==================================================================\n');
      return { messageId: `mock_${Date.now()}` };
    },
  };
  return mockTransporter;
};

/**
 * Reusable HTML Email Base Template Generator
 */
const renderBaseTemplate = ({ title, subtitle, contentHtml, footerNote = '' }) => {
  const currentYear = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #334155;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 50%, #10b981 100%);
          padding: 40px 32px;
          text-align: center;
          color: #ffffff;
        }
        .header-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          opacity: 0.95;
          font-weight: 400;
        }
        .body-content {
          padding: 36px 32px;
          background-color: #ffffff;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px 32px;
          text-align: center;
          border-top: 1px solid #f1f5f9;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.5;
        }
        .footer-brand {
          font-weight: 600;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-badge">CAMPUS TRAINING PORTAL</div>
          <h1>${title}</h1>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
        <div class="body-content">
          ${contentHtml}
        </div>
        <div class="footer">
          <p class="footer-brand">Campus Learning & Skill Assessment System</p>
          ${footerNote ? `<p>${footerNote}</p>` : ''}
          <p>&copy; ${currentYear} Campus Training Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send an OTP Verification Email with enhanced HTML template
 */
export const sendOtpEmail = async ({ to, otp, name = 'Student' }) => {
  try {
    const client = getTransporter();

    const contentHtml = `
      <div style="font-size: 16px; color: #1e293b; margin-bottom: 20px; font-weight: 600;">
        Hello ${name},
      </div>
      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        You requested a verification code to authenticate your account on the <strong>Campus Training Portal</strong>. Please use the code below to complete your login or registration.
      </p>

      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #6366f1; border-radius: 16px; padding: 28px 20px; text-align: center; margin: 28px 0; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #6366f1; margin-bottom: 10px;">
          Verification Passcode (OTP)
        </div>
        <div style="font-family: 'Courier New', Consolas, monospace; font-size: 38px; font-weight: 900; color: #4338ca; letter-spacing: 10px; margin: 8px 0; text-shadow: 0 2px 4px rgba(99, 102, 241, 0.15);">
          ${otp}
        </div>
        <div style="font-size: 13px; color: #64748b; margin-top: 10px;">
          ⏱️ Valid for <strong style="color: #0f172a;">10 minutes</strong>
        </div>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin-top: 24px;">
        <div style="font-size: 13px; color: #991b1b; font-weight: 600; margin-bottom: 2px;">
          🔒 Security Notice
        </div>
        <div style="font-size: 12.5px; color: #7f1d1d; line-height: 1.5;">
          Never share this code with anyone, including training portal staff. If you did not request this OTP, your account remains secure and you may safely disregard this email.
        </div>
      </div>
    `;

    const htmlContent = renderBaseTemplate({
      title: 'Authentication Code',
      subtitle: 'One-Time Password for Verification',
      contentHtml,
      footerNote: 'This is an automated security email. Please do not reply directly.',
    });

    const emailUser = process.env.EMAIL_USER || config.email?.user || '';
    const senderHeader = `"Campus Training Portal" <${emailUser}>`;

    const mailOptions = {
      from: senderHeader,
      to,
      subject: `[Training Portal] ${otp} is your Login Verification Code`,
      text: `Hello ${name},\n\nYour Login Verification OTP is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: htmlContent,
    };

    const info = await client.sendMail(mailOptions);
    console.log(`[Nodemailer] OTP email sent to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`[Nodemailer Error] Failed to send OTP email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send a Welcome Email upon account creation
 */
export const sendWelcomeEmail = async ({ to, name, role = 'student' }) => {
  try {
    const client = getTransporter();
    const emailUser = process.env.EMAIL_USER || config.email?.user || '';
    const senderHeader = `"Campus Training Portal" <${emailUser}>`;

    const roleUpper = role.toUpperCase();
    const badgeBg = role.toLowerCase() === 'admin' ? '#ef4444' : role.toLowerCase() === 'coordinator' ? '#f59e0b' : '#3b82f6';
    const regUrl = `http://localhost:5173/register?email=${encodeURIComponent(to)}`;

    const contentHtml = `
      <div style="font-size: 20px; color: #0f172a; font-weight: 700; margin-bottom: 12px;">
        Welcome ${name}! 🎉
      </div>
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Your account on the <strong>Campus Training & Placement Portal</strong> has been created by your Administrator. Please complete your registration to get started.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Registration Account Details
        </div>
        <div style="display: flex; align-items: center; font-size: 14px; color: #334155; margin-bottom: 6px;">
          <strong style="width: 140px;">Full Name:</strong> ${name}
        </div>
        <div style="display: flex; align-items: center; font-size: 14px; color: #334155; margin-bottom: 6px;">
          <strong style="width: 140px;">Registered Email:</strong> <span style="font-weight:700; color:#4f46e5;">${to}</span>
        </div>
        <div style="display: flex; align-items: center; font-size: 14px; color: #334155;">
          <strong style="width: 140px;">Assigned Role:</strong> 
          <span style="background-color: ${badgeBg}; color: #ffffff; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">
            ${roleUpper}
          </span>
        </div>
      </div>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
        <div style="font-weight: 700; color: #1e40af; font-size: 14px; margin-bottom: 4px;">
          ⚠️ Important Registration Requirement:
        </div>
        <div style="color: #1e3a8a; font-size: 13.5px; line-height: 1.5;">
          Make sure to use this exact email address (<strong>${to}</strong>) when completing your registration so your admin profile preferences are linked correctly.
        </div>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${regUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
          Complete Your Registration &rarr;
        </a>
      </div>
    `;

    const htmlContent = renderBaseTemplate({
      title: 'Welcome to Campus Training Portal',
      subtitle: 'Complete Your Registration',
      contentHtml,
      footerNote: 'Need assistance? Reach out to your campus administrator or coordinator.',
    });

    const mailOptions = {
      from: senderHeader,
      to,
      subject: `Welcome ${name}! Complete your registration`,
      text: `Hello ${name},\n\nWelcome to Campus Training Portal!\n\nYour account with role ${roleUpper} has been created by your Administrator. Please complete your registration using your registered email: ${to}\n\nComplete Registration URL: ${regUrl}\n\nBest regards,\nCampus Training Portal Team`,
      html: htmlContent,
    };

    const info = await client.sendMail(mailOptions);
    console.log(`[Nodemailer] Welcome email sent to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`[Nodemailer Error] Welcome email dispatch failed for ${to}:`, error.message);
    return null;
  }
};

/**
 * Send Generic Email wrapped in standard Portal Template
 */
export const sendGenericEmail = async ({ to, subject, html, text }) => {
  try {
    const client = getTransporter();
    const emailUser = process.env.EMAIL_USER || config.email?.user || '';
    const senderHeader = `"Campus Training Portal" <${emailUser}>`;

    const htmlContent = html
      ? renderBaseTemplate({
          title: subject || 'Training Portal Notification',
          subtitle: '',
          contentHtml: html,
        })
      : null;

    const mailOptions = {
      from: senderHeader,
      to,
      subject,
      text,
      html: htmlContent,
    };
    return await client.sendMail(mailOptions);
  } catch (error) {
    console.error(`[Nodemailer Error] Failed to send generic email to ${to}:`, error.message);
    throw error;
  }
};
