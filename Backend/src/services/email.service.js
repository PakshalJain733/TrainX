import { BrevoClient } from '@getbrevo/brevo';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { query } from '../config/db.js';

// Ensure environment variables are loaded
if (!process.env.BREVO_API_KEY && !process.env.SMTP_HOST) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'Backend/.env') });
}

let brevoClient = null;
let smtpTransporter = null;

const getSmtpTransporter = () => {
  if (!smtpTransporter && process.env.SMTP_HOST) {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: (process.env.SMTP_USER || '').trim(),
        pass: (process.env.SMTP_PASS || '').trim(),
      },
    });
  }
  return smtpTransporter;
};

/**
 * Get or initialize Brevo Client instance
 */
const getBrevoClient = () => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[Brevo Warning] BREVO_API_KEY is not set in environment variables.');
    return null;
  }
  if (!brevoClient) {
    brevoClient = new BrevoClient({ apiKey });
  }
  return brevoClient;
};

/**
 * Helper to check if email system or email OTP is disabled by Super Admin Feature Switches
 */
export const isEmailSystemDisabled = async () => {
  try {
    const emergencyRow = await query(`SELECT is_active FROM feature_switches WHERE feature_key = '__global_emergency_mode' LIMIT 1`);
    if (emergencyRow && emergencyRow.length > 0 && Boolean(emergencyRow[0].is_active)) {
      return true;
    }
    const emailRow = await query(`SELECT is_active FROM feature_switches WHERE feature_key = 'emailSystem' LIMIT 1`);
    if (emailRow && emailRow.length > 0) {
      return emailRow[0].is_active === 0 || emailRow[0].is_active === false;
    }
  } catch (e) {}
  return false;
};

/**
 * Centralized function to send emails via SMTP or Brevo API
 */
export const sendEmail = async ({ to, toName = '', subject, htmlContent, textContent, templateId, params }) => {
  if (await isEmailSystemDisabled()) {
    console.warn(`[Email Service Warning] Blocked attempt to send email to ${to}: Email system is currently toggled OFF in Feature Switches.`);
    throw new Error('Email delivery system is currently disabled by Super Admin maintenance policy.');
  }

  const useSmtp = (process.env.EMAIL_PROVIDER || '').toLowerCase() === 'smtp' ||
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (useSmtp) {
    try {
      const transporter = getSmtpTransporter();
      if (!transporter) throw new Error('SMTP transporter is not configured');
      const senderEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'admin@trainingportal.com').trim();
      const senderName = (process.env.SMTP_FROM_NAME || 'TrainX Portal').trim();
      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        text: textContent || '',
        html: htmlContent || textContent || '',
      });
      console.log(`[SMTP] Email sent to ${to} (Message ID: ${info.messageId})`);
      return info;
    } catch (smtpErr) {
      console.error(`[SMTP Error] Failed to send email to ${to}:`, smtpErr.message);
      if (!process.env.BREVO_API_KEY) {
        throw smtpErr;
      }
      console.warn('[SMTP Warning] Falling back to Brevo HTTPS API...');
    }
  }

  const apiKey = (process.env.BREVO_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (!apiKey) {
    console.warn('[Email Warning] Neither SMTP nor BREVO_API_KEY is configured. Email logged locally.');
    console.log(`📧 [Email Dispatch Fallback] To: ${to} | Subject: ${subject}`);
    return { messageId: `fallback_${Date.now()}`, fallback: true };
  }

  const senderEmail = (process.env.BREVO_SENDER_EMAIL || 'admin@trainingportal.com').trim().replace(/^["']|["']$/g, '');
  const senderName = (process.env.BREVO_SENDER_NAME || 'Campus Training Portal').trim().replace(/^["']|["']$/g, '');

  const sendOptions = {
    sender: {
      email: senderEmail,
      name: senderName,
    },
    replyTo: {
      email: senderEmail,
      name: senderName,
    },
    to: [
      {
        email: to,
        ...(toName ? { name: toName } : {}),
      },
    ],
    subject,
  };

  if (templateId) {
    sendOptions.templateId = parseInt(templateId, 10);
    if (params && typeof params === 'object') {
      sendOptions.params = params;
    }
  } else {
    if (htmlContent) sendOptions.htmlContent = htmlContent;
    if (textContent) sendOptions.textContent = textContent;
  }

  // 1. Try Direct Native HTTPS REST API Call (Fastest & Most Reliable across all hosting environments)
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(sendOptions),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const messageId = data?.messageId || `brevo_${Date.now()}`;
      console.log(`[Brevo HTTPS API] Transactional email sent to ${to} (Message ID: ${messageId})`);
      return data;
    }

    // If HTTP error returned from Brevo API
    const errorMsg = data?.message || data?.code || `HTTP ${res.status}`;
    const maskedKey = apiKey ? (apiKey.slice(0, 12) + '...' + apiKey.slice(-6)) : 'EMPTY';
    console.warn(`[Brevo HTTPS API Warning] Direct API returned ${res.status}: ${errorMsg}. (Key loaded: ${maskedKey}, Length: ${apiKey.length})`);
  } catch (httpError) {
    console.warn(`[Brevo HTTPS API Warning] Direct HTTPS fetch failed (${httpError.message}). Trying SDK fallback...`);
  }

  // 2. SDK Fallback
  try {
    const client = getBrevoClient();
    if (!client) {
      throw new Error('Brevo API client is not configured');
    }
    const response = await client.transactionalEmails.sendTransacEmail(sendOptions);
    const messageId = response?.messageId || response?.body?.messageId || `brevo_${Date.now()}`;
    console.log(`[Brevo SDK] Transactional email sent to ${to} (Message ID: ${messageId})`);
    return response;
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.body?.message || error?.message || 'Unknown Brevo API error';
    console.error(`[Brevo Error] Failed to send email to ${to}:`, errorMsg);
    throw error;
  }
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
 * Send an OTP Verification Email via Brevo
 */
export const sendOtpEmail = async ({ to, otp, name = 'Student' }) => {
  try {
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

    const subject = `[Training Portal] ${otp} is your Login Verification Code`;
    const textContent = `Hello ${name},\n\nYour Login Verification OTP is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`;

    return await sendEmail({
      to,
      toName: name,
      subject,
      htmlContent,
      textContent,
    });
  } catch (error) {
    console.error(`[Brevo Error] Failed to send OTP email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send a Welcome Email upon account creation via Brevo
 */
export const sendWelcomeEmail = async ({
  to,
  name,
  role = 'student',
  secure_code = '',
  mobile_number = '',
  roll_number = '',
  department = '',
  year = '',
  division = '',
}) => {
  try {
    const roleUpper = role.toUpperCase();
    const badgeBg = role.toLowerCase() === 'admin' ? '#ef4444' : role.toLowerCase() === 'coordinator' ? '#f59e0b' : '#3b82f6';
    
    const queryParamsObj = {
      email: to || '',
      name: name || '',
      role: role || 'student',
      mobile_number: mobile_number || '',
      roll_number: roll_number || '',
      department: department || '',
      year: year || '',
      division: division || '',
    };
    if (secure_code) {
      queryParamsObj.secure_code = secure_code;
      queryParamsObj.code = secure_code;
    }

    const queryParams = new URLSearchParams(queryParamsObj).toString();
    const regUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?${queryParams}`;

    const contentHtml = `
      <div style="font-size: 20px; color: #0f172a; font-weight: 700; margin-bottom: 12px;">
        Welcome ${name}! 🎉
      </div>
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Your account on the <strong>Campus Training & Placement Portal</strong> has been created by your Administrator. Complete your registration below using your assigned Secure Access Code.
      </p>

      ${secure_code ? `
      <div style="background-color: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          🔑 Your Secure Access Code
        </div>
        <div style="font-family: monospace; font-size: 28px; font-weight: 800; color: #1e1b4b; letter-spacing: 4px; margin: 8px 0;">
          ${secure_code}
        </div>
        <p style="margin: 0; color: #475569; font-size: 13px;">
          Keep this code ready or click the button below to have it filled in automatically.
        </p>
      </div>
      ` : ''}

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Pre-Configured Account Details
        </div>
        <div style="display: flex; align-items: center; font-size: 14px; color: #334155; margin-bottom: 6px;">
          <strong style="width: 140px;">Full Name:</strong> ${name}
        </div>
        <div style="display: flex; align-items: center; font-size: 14px; color: #334155; margin-bottom: 6px;">
          <strong style="width: 140px;">Registered Email:</strong> <span style="font-weight:700; color:#4f46e5;">${to}</span>
        </div>
        ${mobile_number ? `<div style="display: flex; align-items: center; font-size: 14px; color: #334155; margin-bottom: 6px;"><strong style="width: 140px;">Mobile Number:</strong> ${mobile_number}</div>` : ''}
        ${roll_number ? `<div style="display: flex; align-items: center; font-size: 14px; color: #334155; margin-bottom: 6px;"><strong style="width: 140px;">College / Roll ID:</strong> ${roll_number}</div>` : ''}
        ${department ? `<div style="display: flex; align-items: center; font-size: 14px; color: #334155; margin-bottom: 6px;"><strong style="width: 140px;">Department:</strong> ${department}</div>` : ''}
        ${year ? `<div style="display: flex; align-items: center; font-size: 14px; color: #334155; margin-bottom: 6px;"><strong style="width: 140px;">Academic Year:</strong> ${year} ${division ? `(Division ${division})` : ''}</div>` : ''}
        <div style="display: flex; align-items: center; font-size: 14px; color: #334155;">
          <strong style="width: 140px;">Assigned Role:</strong> 
          <span style="background-color: ${badgeBg}; color: #ffffff; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">
            ${roleUpper}
          </span>
        </div>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">Onboarding & Verification Steps:</div>
        <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
          <li>Click the <strong>Complete Your Registration</strong> button below.</li>
          <li>Enter your new account password and confirm it.</li>
          <li>Link your <strong>Authenticator App</strong> (Microsoft Authenticator or Google Authenticator) by scanning the QR code.</li>
          <li>Once 2FA is verified, your status will change from <strong>Unverified</strong> to <strong>Verified</strong>.</li>
          <li>Your Administrator will then perform a final review and <strong>manually approve</strong> your account.</li>
        </ol>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${regUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
          Complete Your Registration &rarr;
        </a>
      </div>
    `;

    const htmlContent = renderBaseTemplate({
      title: 'Welcome to Campus Training Portal',
      subtitle: secure_code ? 'Action Required: Complete Your Registration' : 'Complete Your Registration',
      contentHtml,
      footerNote: 'Need assistance? Reach out to your campus administrator or coordinator.',
    });

    const subject = secure_code 
      ? `Action Required: Complete Your ${roleUpper} Registration (Secure Code: ${secure_code})`
      : `Welcome ${name}! Complete your registration`;
    const textContent = `Hello ${name},\n\nWelcome to Campus Training Portal!\n\nYour account with role ${roleUpper} has been created by your Administrator. ${secure_code ? `Your Secure Access Code is: ${secure_code}\n\n` : ''}Please complete your registration using your registered email: ${to}\n\nComplete Registration URL: ${regUrl}\n\nNote: Once registration and Authenticator 2FA are paired, your status changes to Verified and will be manually approved by your Administrator.\n\nBest regards,\nCampus Training Portal Team`;

    return await sendEmail({
      to,
      toName: name,
      subject,
      htmlContent,
      textContent,
    });
  } catch (error) {
    console.error(`[Brevo Error] Welcome email dispatch failed for ${to}:`, error.message);
    return null;
  }
};

export const sendAccountApprovedEmail = async ({ to, name, role = 'User' }) => {
  try {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/`;
    const roleUpper = String(role).toUpperCase();

    const contentHtml = `
      <div style="font-size: 20px; color: #0f172a; font-weight: 700; margin-bottom: 12px;">
        Account Approved! 🎉
      </div>
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Hello <strong>${name}</strong>, your account registration for the role of <strong>${roleUpper}</strong> has been officially approved by the Administrator.
      </p>

      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <div style="font-weight: 700; color: #065f46; font-size: 14px; margin-bottom: 4px;">
          ✅ Account Status: Active & Approved
        </div>
        <div style="color: #047857; font-size: 13.5px; line-height: 1.5;">
          You can now log in using your registered email, password, and 6-digit Authenticator app code.
        </div>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${loginUrl}" style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
          Log In Now &rarr;
        </a>
      </div>
    `;

    const htmlContent = renderBaseTemplate({
      title: 'Campus Training Portal',
      subtitle: 'Account Approved',
      contentHtml,
      footerNote: 'Need assistance? Reach out to your campus administrator.',
    });

    return await sendEmail({
      to,
      toName: name,
      subject: `🎉 Account Approved: You can now log in to Campus Training Portal`,
      htmlContent,
      textContent: `Hello ${name},\n\nYour account with role ${roleUpper} has been officially approved by the Administrator!\n\nYou can now log in at: ${loginUrl}\n\nBest regards,\nCampus Training Portal Team`,
    });
  } catch (error) {
    console.error(`[Email Error] sendAccountApprovedEmail failed for ${to}:`, error.message);
    return null;
  }
};

/**
 * Send Generic Email wrapped in standard Portal Template via Brevo
 */
export const sendGenericEmail = async ({ to, subject, html, text }) => {
  try {
    const htmlContent = html
      ? renderBaseTemplate({
          title: subject || 'Training Portal Notification',
          subtitle: '',
          contentHtml: html,
        })
      : null;

    return await sendEmail({
      to,
      subject,
      htmlContent,
      textContent: text,
    });
  } catch (error) {
    console.error(`[Brevo Error] Failed to send generic email to ${to}:`, error.message);
    throw error;
  }
};
