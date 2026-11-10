import { BrevoClient } from '@getbrevo/brevo';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import net from 'net';
import { query } from '../config/db.js';

let nodemailerModule = null;
const getNodemailer = async () => {
  if (nodemailerModule) return nodemailerModule;
  try {
    const mod = await import('nodemailer');
    nodemailerModule = mod.default || mod;
    return nodemailerModule;
  } catch (_) {
    return null;
  }
};

// Enforce IPv4 resolution order across Node.js to prevent ENETUNREACH on platforms without IPv6 routing
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Ensure environment variables are loaded regardless of current working directory
dotenv.config({ path: path.resolve(process.cwd(), 'Backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let brevoClient = null;
let smtpTransporter = null;
let cachedIpv4Host = null;
let lastSmtpFailureTime = 0;
const SMTP_CIRCUIT_BREAKER_TTL = 10 * 60 * 1000; // 10 minutes cache when SMTP network is unreachable

export const getPrimaryFrontendUrl = () => {
  const raw = process.env.FRONTEND_URL || 'https://trainingportal.getflytechnologies.com';
  // If multiple URLs are provided (comma-separated, e.g. for CORS allowlists), take the primary URL
  const firstUrl = raw.split(',')[0].trim();
  return firstUrl.replace(/\/+$/, '');
};

const getResolvedIpv4Host = async (host) => {
  if (!host || net.isIP(host)) return host;
  if (cachedIpv4Host) return cachedIpv4Host;
  try {
    const ips = await dns.promises.resolve4(host);
    if (ips && ips.length > 0) {
      cachedIpv4Host = ips[0];
      return cachedIpv4Host;
    }
  } catch (_) {}
  return host;
};

const createTransporterInstance = async (port, isSecure) => {
  const nm = await getNodemailer();
  if (!nm) {
    throw new Error('Nodemailer package is not installed. Please configure Brevo or install nodemailer.');
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const resolvedHost = await getResolvedIpv4Host(host);

  return nm.createTransport({
    host: resolvedHost,
    port,
    secure: isSecure,
    auth: { user, pass },
    connectionTimeout: 4000, // Fast 4s timeout so blocked SMTP ports don't stall user requests
    greetingTimeout: 4000,
    socketTimeout: 8000,
    tls: {
      servername: host, // Ensures TLS certificate validates correctly against smtp.gmail.com
      rejectUnauthorized: true,
    },
  });
};

const getSmtpTransporter = async (alternatePort = false) => {
  const defaultPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const defaultSecure = process.env.SMTP_SECURE === 'true' || defaultPort === 465;

  if (alternatePort) {
    const fallbackPort = defaultPort === 465 ? 587 : 465;
    return await createTransporterInstance(fallbackPort, fallbackPort === 465);
  }

  if (!smtpTransporter) {
    smtpTransporter = await createTransporterInstance(defaultPort, defaultSecure);
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

  const provider = (process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const hasSmtpConfig = Boolean(smtpUser && smtpPass);
  const isSmtpCircuitOpen = (Date.now() - lastSmtpFailureTime) < SMTP_CIRCUIT_BREAKER_TTL;

  // SMTP is attempted when configured, not overridden to brevo, and circuit breaker is not currently tripped
  if (provider !== 'brevo' && hasSmtpConfig && !isSmtpCircuitOpen) {
    const senderEmail = (process.env.SMTP_FROM_EMAIL || smtpUser || 'admin@trainingportal.com').trim();
    const senderName = (process.env.SMTP_FROM_NAME || 'TrainX').trim();
    const mailPayload = {
      from: `"${senderName}" <${senderEmail}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      text: textContent || '',
      html: htmlContent || textContent || '',
    };

    // Attempt 1: Primary SMTP port (default 465 SSL, forced IPv4)
    try {
      const transporter = await getSmtpTransporter(false);
      const info = await transporter.sendMail(mailPayload);
      console.log(`[SMTP Primary] Email successfully delivered to ${to} (Message ID: ${info.messageId})`);
      return info;
    } catch (smtpErr1) {
      console.warn(`[SMTP Primary Warning] Delivery via primary port failed for ${to}: ${smtpErr1.message}. Trying alternate SMTP port...`);
      smtpTransporter = null;

      // Attempt 2: Alternate SMTP port (port 587 STARTTLS)
      try {
        const altTransporter = await getSmtpTransporter(true);
        const info2 = await altTransporter.sendMail(mailPayload);
        console.log(`[SMTP Alternate] Email successfully delivered to ${to} via alternate port (Message ID: ${info2.messageId})`);
        return info2;
      } catch (smtpErr2) {
        console.error(`[SMTP Error] Both SMTP attempts failed for ${to}: ${smtpErr2.message}`);
        lastSmtpFailureTime = Date.now();
        console.warn('[SMTP Fallback] Engaging Brevo as backup delivery to ensure OTP delivery...');
      }
    }
  } else if (isSmtpCircuitOpen && hasSmtpConfig) {
    console.info(`[SMTP Circuit Active] Direct SMTP previously unreachable. Fast-routing ${to} directly to Brevo HTTPS API.`);
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
    console.error(`[Email Error] Failed to send OTP email to ${to}:`, error.message);
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
    const isStudent = String(role || '').toLowerCase().trim() === 'student';
    const badgeBg = role.toLowerCase() === 'admin' ? '#ef4444' : role.toLowerCase() === 'coordinator' ? '#f59e0b' : role.toLowerCase() === 'trainer' ? '#3b82f6' : '#6366f1';
    
    const queryParamsObj = {
      email: to || '',
      name: name || '',
      role: role || 'student',
      mobile_number: mobile_number || '',
      roll_number: roll_number || '',
      department: department || '',
    };
    if (isStudent) {
      if (year) queryParamsObj.year = year;
      if (division) queryParamsObj.division = division;
    }
    if (secure_code) {
      queryParamsObj.secure_code = secure_code;
      queryParamsObj.code = secure_code;
    }

    const queryParams = new URLSearchParams(queryParamsObj).toString();
    const regUrl = `${getPrimaryFrontendUrl()}/register?${queryParams}`;

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
        ${isStudent && year ? `<div style="display: flex; align-items: center; font-size: 14px; color: #334155; margin-bottom: 6px;"><strong style="width: 140px;">Academic Year:</strong> ${year} ${division ? `(Division ${division})` : ''}</div>` : ''}
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
          <li>Once submitted, your account will be reviewed and approved by your Administrator.</li>
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
    const textContent = `Hello ${name},\n\nWelcome to Campus Training Portal!\n\nYour account with role ${roleUpper} has been created by your Administrator. ${secure_code ? `Your Secure Access Code is: ${secure_code}\n\n` : ''}Please complete your registration using your registered email: ${to}\n\nComplete Registration URL: ${regUrl}\n\nNote: Once registration is submitted, your account will be manually approved by your Administrator.\n\nBest regards,\nCampus Training Portal Team`;

    return await sendEmail({
      to,
      toName: name,
      subject,
      htmlContent,
      textContent,
    });
  } catch (error) {
    console.error(`[Email Error] Welcome email dispatch failed for ${to}:`, error.message);
    return null;
  }
};

export const sendAccountApprovedEmail = async ({ to, name, role = 'User' }) => {
  try {
    const loginUrl = `${getPrimaryFrontendUrl()}/`;
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
          You can now log in using your registered email and password.
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
 * Send Login Credentials Email to a newly created Admin (College Admin / Institutional Admin)
 * Provisioned directly by Super Admin with pre-set password
 */
export const sendAdminCredentialsEmail = async ({
  to,
  name,
  password,
  collegeName = '',
  role = 'College Administrator',
}) => {
  try {
    const frontendBase = (process.env.FRONTEND_URL || 'https://trainingportal.getflytechnologies.com').replace(/\/+$/, '');
    const loginUrl = `${frontendBase}/`;
    const roleUpper = String(role).toUpperCase();

    const contentHtml = `
      <div style="font-size: 20px; color: #0f172a; font-weight: 700; margin-bottom: 12px;">
        Welcome ${name}! 🎉
      </div>
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Your <strong>${role}</strong> account on the <strong>Campus Training Portal</strong> has been created and approved by the <strong>Super Administrator</strong>.
        You can now log in directly using the credentials provided below.
      </p>

      <!-- Credentials Box -->
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 22px; margin: 24px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="font-size: 12px; font-weight: 800; color: #4338ca; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px;">
          🔐 YOUR LOGIN CREDENTIALS
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b; width: 140px;">Portal Link:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">
              <a href="${loginUrl}" style="color: #4f46e5; text-decoration: none;">${loginUrl}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Login Email:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">
              <span style="background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 14px;">${to}</span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Password:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">
              <span style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 15px; letter-spacing: 0.5px;">${password}</span>
            </td>
          </tr>
          ${collegeName ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">College / Institution:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${collegeName}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Assigned Role:</td>
            <td style="padding: 10px 0;">
              <span style="background-color: #6366f1; color: #ffffff; padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                ${roleUpper}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Quick Steps -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">Getting Started:</div>
        <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 13.5px; line-height: 1.6;">
          <li>Click the <strong>Log In to Portal</strong> button below.</li>
          <li>Enter your <strong>Login Email</strong> and <strong>Password</strong> shown above.</li>
          <li>You will have direct access to your campus administrative dashboard, coordinators, and students.</li>
          <li>For security, you may change your password anytime from your profile settings.</li>
        </ol>
      </div>

      <!-- Login CTA Button -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${loginUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
          Log In to Portal &rarr;
        </a>
      </div>
    `;

    const htmlContent = renderBaseTemplate({
      title: 'Administrator Account Created',
      subtitle: 'Your Login Credentials & Portal Access',
      contentHtml,
      footerNote: 'This email contains sensitive login credentials. Please keep it confidential.',
    });

    const subject = `Your Admin Account Credentials - Campus Training Portal`;
    const textContent = `Hello ${name},\n\nYour Administrator account on Campus Training Portal has been successfully created by Super Admin.\n\nLogin URL: ${loginUrl}\nEmail: ${to}\nPassword: ${password}\n${collegeName ? `College: ${collegeName}\n` : ''}Role: ${roleUpper}\n\nYou can log in directly at ${loginUrl} using the credentials above.\n\nBest regards,\nCampus Training Portal Team`;

    return await sendEmail({
      to,
      toName: name,
      subject,
      htmlContent,
      textContent,
    });
  } catch (error) {
    console.error(`[Email Service Error] sendAdminCredentialsEmail failed for ${to}:`, error.message);
    return null;
  }
};

/**
 * Send Student Credentials Email on Bulk Upload
 * Sends immediate login credentials with default password '12345678'
 */
export const sendStudentCredentialsEmail = async ({
  to,
  name,
  password = '12345678',
  roll_number = '',
  department = '',
  collegeName = '',
}) => {
  try {
    const frontendBase = (process.env.FRONTEND_URL || 'https://trainingportal.getflytechnologies.com').replace(/\/+$/, '');
    const loginUrl = `${frontendBase}/`;

    const contentHtml = `
      <div style="font-size: 20px; color: #0f172a; font-weight: 700; margin-bottom: 12px;">
        Welcome to Campus Training Portal, ${name}! 🎉
      </div>
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Your student training account has been registered and activated. You can now log in directly to access your courses, practice problems, mock assessments, and campus training sessions.
      </p>

      <!-- Credentials Box -->
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 22px; margin: 24px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="font-size: 12px; font-weight: 800; color: #4338ca; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px;">
          🔑 YOUR LOGIN CREDENTIALS
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b; width: 140px;">Portal Link:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">
              <a href="${loginUrl}" style="color: #4f46e5; text-decoration: none;">${loginUrl}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Login Email:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">
              <span style="background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 14px;">${to}</span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Default Password:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">
              <span style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 15px; letter-spacing: 0.5px;">${password}</span>
            </td>
          </tr>
          ${roll_number ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Roll / Student ID:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${roll_number}</td>
          </tr>` : ''}
          ${department ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Department:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${department}</td>
          </tr>` : ''}
          ${collegeName ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">College:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${collegeName}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Assigned Role:</td>
            <td style="padding: 10px 0;">
              <span style="background-color: #3b82f6; color: #ffffff; padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                STUDENT
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Quick Steps -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">Getting Started:</div>
        <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 13.5px; line-height: 1.6;">
          <li>Click the <strong>Log In to Portal</strong> button below.</li>
          <li>Enter your <strong>Login Email</strong> and default password: <strong>${password}</strong>.</li>
          <li>We recommend updating your password after logging in from your <strong>Profile Settings</strong>.</li>
        </ol>
      </div>

      <!-- Login CTA Button -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${loginUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
          Log In to Portal &rarr;
        </a>
      </div>
    `;

    const htmlContent = renderBaseTemplate({
      title: 'Welcome to Campus Training Portal',
      subtitle: 'Your Account Credentials & Portal Access',
      contentHtml,
      footerNote: 'This email contains your login credentials. Keep them safe and change your password after initial login.',
    });

    const subject = `Welcome to Campus Training Portal - Your Login Credentials`;
    const textContent = `Hello ${name},\n\nWelcome to Campus Training Portal!\n\nYour student account has been created. You can log in directly using the credentials below:\n\nPortal URL: ${loginUrl}\nEmail: ${to}\nDefault Password: ${password}\n${roll_number ? `Roll No: ${roll_number}\n` : ''}${department ? `Department: ${department}\n` : ''}\n\nLog in now at ${loginUrl}\n\nBest regards,\nCampus Training Portal Team`;

    return await sendEmail({
      to,
      toName: name,
      subject,
      htmlContent,
      textContent,
    });
  } catch (error) {
    console.error(`[Email Service Error] sendStudentCredentialsEmail failed for ${to}:`, error.message);
    return null;
  }
};


/**
 * Send Secure Access Code & Registration Invitation Email to College Admin
 * When Super Admin generates a code for that college.
 */
export const sendAdminRegistrationCodeEmail = async ({
  to,
  name = 'Administrator',
  secure_code,
  college_name = '',
}) => {
  try {
    const frontendBase = (process.env.FRONTEND_URL || 'https://trainingportal.getflytechnologies.com').replace(/\/+$/, '');
    const regUrl = `${frontendBase}/setup-institution?token=${encodeURIComponent(secure_code)}&email=${encodeURIComponent(to)}`;

    const contentHtml = `
      <div style="font-size: 20px; color: #0f172a; font-weight: 700; margin-bottom: 12px;">
        Complete Your Registration 🔑
      </div>
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Hello <strong>${name}</strong>, your Super Administrator has generated a Secure Authorization Code for <strong>${college_name || 'your institution'}</strong> on the <strong>Campus Training Portal</strong>.
      </p>

      <div style="background-color: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 18px; margin: 20px 0; color: #166534; font-size: 14.5px; line-height: 1.5;">
        <strong>Notice:</strong> Please complete your registration with this secure code and email.
      </div>

      <!-- Secure Code Hero Box -->
      <div style="background-color: #f1f5f9; border: 2px dashed #4f46e5; border-radius: 14px; padding: 22px; text-align: center; margin: 24px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
          🔑 Your Secure Access Code
        </div>
        <div style="font-family: monospace; font-size: 30px; font-weight: 800; color: #1e1b4b; letter-spacing: 4px; margin: 10px 0;">
          ${secure_code}
        </div>
        <div style="font-size: 13.5px; color: #64748b; margin-top: 6px;">
          Registered Email ID: <strong style="color: #1e293b;">${to}</strong>
        </div>
      </div>

      <!-- Details Summary -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
          Registration Credentials
        </div>
        <div style="font-size: 14px; color: #334155; margin-bottom: 6px;">
          <strong>Registered Email:</strong> <span style="font-family: monospace; color: #4f46e5; font-weight: 700;">${to}</span>
        </div>
        <div style="font-size: 14px; color: #334155; margin-bottom: 6px;">
          <strong>Secure Code:</strong> <span style="font-family: monospace; color: #0f172a; font-weight: 700;">${secure_code}</span>
        </div>
        ${college_name ? `
        <div style="font-size: 14px; color: #334155; margin-bottom: 6px;">
          <strong>Institution / College:</strong> ${college_name}
        </div>` : ''}
        <div style="font-size: 14px; color: #334155;">
          <strong>Assigned Role:</strong> <span style="background: #4f46e5; color: #fff; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 700;">COLLEGE ADMINISTRATOR</span>
        </div>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">Registration Instructions:</div>
        <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 13.5px; line-height: 1.6;">
          <li>Click the <strong>Complete Your Registration</strong> button below.</li>
          <li>Your registered email and secure code will be pre-filled automatically.</li>
          <li>Create and confirm your secure password.</li>
          <li>Once submitted, your account will be active on the portal.</li>
        </ol>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${regUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
          Complete Your Registration &rarr;
        </a>
      </div>
    `;

    const htmlContent = renderBaseTemplate({
      title: 'Complete Your Registration',
      subtitle: `Secure Code for ${college_name || 'Institutional Administrator'}`,
      contentHtml,
      footerNote: 'Please keep this secure code confidential. Only use it with your registered email.',
    });

    const subject = `Action Required: Complete your registration with this secure code and email (${secure_code})`;
    const textContent = `Hello ${name},\n\nYour Super Administrator has generated a Secure Authorization Code for ${college_name || 'your college'} on the Campus Training Portal.\n\nPlease complete your registration with this secure code and email:\n\nEmail ID: ${to}\nSecure Access Code: ${secure_code}\n${college_name ? `College: ${college_name}\n` : ''}Role: College Administrator\n\nComplete Registration URL:\n${regUrl}\n\nBest regards,\nCampus Training Portal Team`;

    return await sendEmail({
      to,
      toName: name,
      subject,
      htmlContent,
      textContent,
    });
  } catch (error) {
    console.error(`[Email Service Error] sendAdminRegistrationCodeEmail failed for ${to}:`, error.message);
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
    console.error(`[Email Error] Failed to send generic email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send email to User confirming their registration is pending admin approval
 */
export const sendRegistrationPendingEmail = async ({ to, name, role = 'student', collegeName = '' }) => {
  try {
    const roleUpper = String(role).toUpperCase();
    const contentHtml = `
      <div style="font-size: 20px; color: #0f172a; font-weight: 700; margin-bottom: 12px;">
        Registration Submitted! ⏳
      </div>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Hello <strong>${name}</strong>, thank you for registering for the role of <strong>${roleUpper}</strong>${collegeName ? ` at <strong>${collegeName}</strong>` : ''}.
      </p>

      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <div style="font-weight: 700; color: #92400e; font-size: 14px; margin-bottom: 4px;">
          ⏳ Account Status: Pending Administrator Approval
        </div>
        <div style="color: #78350f; font-size: 13.5px; line-height: 1.5;">
          Your registration has been forwarded to the College Administrator for verification. You will receive an official approval confirmation email once your account has been reviewed and activated.
        </div>
      </div>

      <p style="margin: 16px 0 0 0; color: #64748b; font-size: 13.5px; line-height: 1.5;">
        No further action is required from you at this time. Once approved, you will be able to log in with your registered email and password.
      </p>
    `;

    const htmlContent = renderBaseTemplate({
      title: 'Campus Training Portal',
      subtitle: 'Registration Under Review',
      contentHtml,
      footerNote: 'Need urgent access? Reach out directly to your campus administrator.',
    });

    return await sendEmail({
      to,
      toName: name,
      subject: `⏳ Registration Received: Pending Administrator Approval`,
      htmlContent,
      textContent: `Hello ${name},\n\nYour registration as ${roleUpper} has been received and is pending approval from your College Administrator.\n\nYou will receive an email as soon as your account is approved and activated.\n\nBest regards,\nCampus Training Portal Team`,
    });
  } catch (error) {
    console.error(`[Email Error] sendRegistrationPendingEmail failed for ${to}:`, error.message);
    return null;
  }
};

/**
 * Send email to Admin notifying that a new user registration requires approval
 */
export const sendAdminNewPendingUserEmail = async ({ adminEmail, adminName = 'Administrator', userName, userEmail, userRole, collegeName = '' }) => {
  try {
    const roleUpper = String(userRole).toUpperCase();
    const reviewUrl = `${getPrimaryFrontendUrl()}/admin/approve-users`;

    const contentHtml = `
      <div style="font-size: 20px; color: #0f172a; font-weight: 700; margin-bottom: 12px;">
        New Registration Awaiting Your Approval 👤
      </div>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Hello <strong>${adminName}</strong>, a new applicant has registered and is waiting for your review on the portal.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;">
        <div style="font-size: 14px; color: #334155; margin-bottom: 8px;">
          <strong>Applicant Name:</strong> ${userName}
        </div>
        <div style="font-size: 14px; color: #334155; margin-bottom: 8px;">
          <strong>Email:</strong> <span style="color:#2563eb; font-weight:600;">${userEmail}</span>
        </div>
        <div style="font-size: 14px; color: #334155;">
          <strong>Requested Role:</strong> <span style="background:#ede9fe; color:#6d28d9; padding:2px 8px; border-radius:6px; font-weight:700; font-size:12px;">${roleUpper}</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 28px;">
        <a href="${reviewUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
          Review in Approve Users &rarr;
        </a>
      </div>
    `;

    const htmlContent = renderBaseTemplate({
      title: 'Campus Training Portal',
      subtitle: 'New User Registration Alert',
      contentHtml,
      footerNote: 'You received this notification because you are a registered administrator.',
    });

    return await sendEmail({
      to: adminEmail,
      toName: adminName,
      subject: `🔔 Action Required: New ${roleUpper} Registration (${userName}) Pending Approval`,
      htmlContent,
      textContent: `Hello ${adminName},\n\nA new user (${userName}, ${userEmail}) has registered as ${roleUpper} and is awaiting your approval.\n\nReview them at: ${reviewUrl}\n\nBest regards,\nCampus Training Portal`,
    });
  } catch (error) {
    console.error(`[Email Error] sendAdminNewPendingUserEmail failed for ${adminEmail}:`, error.message);
    return null;
  }
};

/**
 * Send Account Activation Email for newly provisioned Admin, Mentor, Coordinator, Trainer
 * Dispatches activation token link to allow the user to set their password.
 */
export const sendStaffActivationEmail = async ({ to, name, role = 'Staff', rawToken }) => {
  try {
    const frontendUrl = getPrimaryFrontendUrl();
    const activationLink = `${frontendUrl}/activate-account?token=${rawToken}&email=${encodeURIComponent(to)}`;
    const subject = 'Welcome to Career Gateway – Activate Your Account';

    const contentHtml = `
      <div style="font-size: 20px; color: #0f172a; font-weight: 700; margin-bottom: 12px;">
        Welcome to Career Gateway! 🎉
      </div>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Welcome to Career Gateway!
      </p>
      <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Your account has been successfully created by the administrator.
      </p>
      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        To get started, please activate your account and set your password by clicking the button below.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${activationLink}" style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
          Activate My Account
        </a>
      </div>

      <p style="margin: 24px 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;">
        After successfully setting your password, you can log in to Career Gateway using your registered email address and newly created password.
      </p>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; font-weight: 600;">DIRECT ACTIVATION LINK:</p>
        <p style="margin: 0; word-break: break-all; font-size: 12px; color: #4f46e5;">
          <a href="${activationLink}" style="color: #4f46e5; text-decoration: underline;">${activationLink}</a>
        </p>
      </div>

      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.6;">
        Best Regards,<br/>
        <strong>Career Gateway Team</strong>
      </p>
    `;

    const htmlContent = renderBaseTemplate({
      title: 'Activate Your Account',
      subtitle: 'Career Gateway Staff & Administrator Onboarding',
      contentHtml,
      footerNote: 'This activation link is valid for 72 hours and can only be used once. For security reasons, do not share this link.',
    });

    const textContent = `Hello ${name},\n\nWelcome to Career Gateway!\n\nYour account has been successfully created by the administrator.\n\nTo get started, please activate your account and set your password by visiting:\n${activationLink}\n\nAfter successfully setting your password, you can log in to Career Gateway using your registered email address and newly created password.\n\nBest Regards,\nCareer Gateway Team`;

    return await sendEmail({
      to,
      toName: name,
      subject,
      htmlContent,
      textContent,
    });
  } catch (error) {
    console.error(`[Email Service Error] sendStaffActivationEmail failed for ${to}:`, error.message);
    return null;
  }
};
