import nodemailer from 'nodemailer';
import prisma from '../utils/db.js';
import { decrypt } from '../utils/crypto.js';

/**
 * Interpolate lead and employee variables into email text/html
 */
export function interpolateVariables(templateText, lead = {}, employee = {}) {
  if (!templateText) return '';
  const fullName = lead.name || '';
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const empName = employee.firstName ? `${employee.firstName} ${employee.lastName || ''}`.trim() : 'The Team';

  return templateText
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*last_name\s*\}\}/gi, lastName)
    .replace(/\{\{\s*name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*company\s*\}\}/gi, lead.company || 'your company')
    .replace(/\{\{\s*designation\s*\}\}/gi, lead.designation || 'decision maker')
    .replace(/\{\{\s*industry\s*\}\}/gi, lead.industry || 'your industry')
    .replace(/\{\{\s*employee_name\s*\}\}/gi, empName)
    .replace(/\{\{\s*location\s*\}\}/gi, lead.location || 'your area');
}

/**
 * Check if an email address or domain is in the suppression list
 */
export async function isSuppressed(email) {
  if (!email) return true;
  const cleanEmail = email.trim().toLowerCase();
  const domain = cleanEmail.split('@')[1];

  const suppressed = await prisma.suppressionList.findFirst({
    where: {
      OR: [
        { type: 'EMAIL', value: cleanEmail },
        domain ? { type: 'DOMAIN', value: domain } : undefined,
      ].filter(Boolean),
    },
  });

  return !!suppressed;
}

/**
 * Send an email using configured SMTP account
 */
export async function sendEmail({
  accountId,
  to,
  subject,
  htmlContent,
  textContent,
  campaignLeadId = null,
  leadId = null,
  campaignId = null,
}) {
  // 1. Verify suppression
  if (await isSuppressed(to)) {
    throw new Error(`Email address ${to} is suppressed on the Do-Not-Contact list.`);
  }

  // 2. Load email account
  let account = null;
  if (accountId) {
    account = await prisma.emailAccount.findUnique({ where: { id: accountId } });
  } else {
    // pick first active account
    account = await prisma.emailAccount.findFirst({ where: { status: 'ACTIVE' } });
  }

  if (!account) {
    throw new Error('No active SMTP email account configured.');
  }

  if (account.sentToday >= account.dailySendingLimit) {
    throw new Error(`Email account ${account.senderEmail} has reached its daily limit of ${account.dailySendingLimit}.`);
  }

  // 3. Prepare tracking & unsubscribe
  const trackingId = `trk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const backendBaseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const unsubscribeUrl = `${backendBaseUrl}/api/email/unsubscribe?leadId=${leadId || ''}&campaignId=${campaignId || ''}&email=${encodeURIComponent(to)}`;
  const trackingPixel = `<img src="${backendBaseUrl}/api/email/track/open/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;

  const finalHtml = `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333333; line-height: 1.6;">
      ${htmlContent}
      ${trackingPixel}
      <br/><br/>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 15px;" />
      <p style="font-size: 11px; color: #94a3b8;">
        If you prefer not to receive further emails, you can 
        <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">unsubscribe here</a>.
      </p>
    </div>
  `;

  // 4. Try real SMTP or graceful test fallback
  let messageId = `msg_${Date.now()}`;
  let isSimulated = false;

  const decryptedPassword = decrypt(account.smtpPasswordEncrypted);

  if (
    account.smtpHost === 'smtp.mock.com' ||
    account.smtpHost === 'localhost' ||
    account.smtpHost.includes('example.com') ||
    !decryptedPassword
  ) {
    // Demo / Simulated mode for testing without real credentials
    isSimulated = true;
    console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject} via ${account.senderEmail}`);
  } else {
    try {
      const transporter = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.encryption === 'SSL' || account.smtpPort === 465,
        auth: {
          user: account.smtpUser,
          pass: decryptedPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const info = await transporter.sendMail({
        from: `"${account.senderName}" <${account.senderEmail}>`,
        to,
        subject,
        text: textContent || htmlContent.replace(/<[^>]+>/g, ''),
        html: finalHtml,
      });

      messageId = info.messageId;
    } catch (err) {
      console.warn(`SMTP send failed (${err.message}). Logging and fallback recorded.`);
      // Update account status if connection failed
      await prisma.emailAccount.update({
        where: { id: account.id },
        data: { lastError: err.message },
      });
      throw err;
    }
  }

  // 5. Update sent counts and record email event
  await prisma.emailAccount.update({
    where: { id: account.id },
    data: { sentToday: { increment: 1 } },
  });

  if (campaignLeadId) {
    await prisma.emailEvent.create({
      data: {
        campaignLeadId,
        eventType: 'SENT',
        trackingId,
        metadata: JSON.stringify({ messageId, isSimulated, to, subject }),
      },
    });

    await prisma.campaignLead.update({
      where: { id: campaignLeadId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        lastActionAt: new Date(),
      },
    });
  }

  return { success: true, messageId, trackingId, isSimulated };
}
