import prisma from '../utils/db.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { logActivity } from '../middleware/audit.js';
import { sendEmail } from '../services/emailService.js';
import { sendWhatsAppMessage, handleWhatsAppOptOut } from '../services/whatsappService.js';
import { queueLinkedInOutreach, updateLinkedInStatus } from '../services/linkedinService.js';

// ==========================================
// EMAIL ACCOUNTS (SMTP)
// ==========================================

export async function getEmailAccounts(req, res) {
  try {
    const accounts = await prisma.emailAccount.findMany({
      select: {
        id: true,
        accountName: true,
        senderName: true,
        senderEmail: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        encryption: true,
        dailySendingLimit: true,
        sentToday: true,
        status: true,
        lastError: true,
        createdAt: true,
      },
    });

    return res.json({ success: true, accounts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createEmailAccount(req, res) {
  try {
    const {
      accountName,
      senderName,
      senderEmail,
      smtpHost,
      smtpPort = 587,
      smtpUser,
      smtpPassword,
      encryption = 'TLS',
      dailySendingLimit = 200,
    } = req.body;

    if (!accountName || !senderEmail || !smtpHost || !smtpUser) {
      return res.status(400).json({ success: false, message: 'All SMTP connection details are required.' });
    }

    const encryptedPass = encrypt(smtpPassword || '');

    const account = await prisma.emailAccount.create({
      data: {
        accountName: accountName.trim(),
        senderName: senderName?.trim() || accountName.trim(),
        senderEmail: senderEmail.trim().toLowerCase(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
        smtpUser: smtpUser.trim(),
        smtpPasswordEncrypted: encryptedPass,
        encryption,
        dailySendingLimit: Number(dailySendingLimit),
        status: 'ACTIVE',
      },
      select: {
        id: true,
        accountName: true,
        senderName: true,
        senderEmail: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        encryption: true,
        dailySendingLimit: true,
        sentToday: true,
        status: true,
      },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'EMAIL_ACCOUNT_CREATED',
      module: 'OUTREACH',
      description: `Configured SMTP sender account ${account.senderEmail}`,
      req,
    });

    return res.status(201).json({ success: true, message: 'SMTP account saved securely.', account });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteEmailAccount(req, res) {
  try {
    const { id } = req.params;
    await prisma.emailAccount.delete({ where: { id } });
    return res.json({ success: true, message: 'Email account deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ==========================================
// WHATSAPP ACCOUNTS (Cloud API)
// ==========================================

export async function getWhatsAppAccounts(req, res) {
  try {
    const accounts = await prisma.whatsAppAccount.findMany({
      select: {
        id: true,
        accountName: true,
        phoneNumberId: true,
        businessAccountId: true,
        dailyLimit: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json({ success: true, accounts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createWhatsAppAccount(req, res) {
  try {
    const { accountName, phoneNumberId, businessAccountId, accessToken, dailyLimit = 500 } = req.body;

    if (!accountName || !phoneNumberId || !accessToken) {
      return res.status(400).json({ success: false, message: 'Account name, Phone Number ID, and Access Token are required.' });
    }

    const encryptedToken = encrypt(accessToken);

    const account = await prisma.whatsAppAccount.create({
      data: {
        accountName: accountName.trim(),
        phoneNumberId: phoneNumberId.trim(),
        businessAccountId: businessAccountId?.trim() || '',
        accessTokenEncrypted: encryptedToken,
        dailyLimit: Number(dailyLimit),
        status: 'ACTIVE',
      },
      select: {
        id: true,
        accountName: true,
        phoneNumberId: true,
        businessAccountId: true,
        dailyLimit: true,
        status: true,
      },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'WHATSAPP_ACCOUNT_CREATED',
      module: 'OUTREACH',
      description: `Configured WhatsApp Cloud API account ${account.accountName}`,
      req,
    });

    return res.status(201).json({ success: true, message: 'WhatsApp account saved securely.', account });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ==========================================
// LINKEDIN OUTREACH QUEUE (User-Assisted)
// ==========================================

export async function getLinkedInQueue(req, res) {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    if (req.user.role === 'EMPLOYEE') {
      where.OR = [
        { employeeId: req.user.id },
        { lead: { assignedEmployeeId: req.user.id } },
      ];
    }

    const items = await prisma.linkedInMessage.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
            designation: true,
            linkedinUrl: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function handleUpdateLinkedInStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updated = await updateLinkedInStatus(id, status, notes);

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'LINKEDIN_ACTIVITY',
      module: 'OUTREACH',
      description: `Updated LinkedIn outreach for lead ${updated.lead?.name || id} to ${status}.`,
      req,
    });

    return res.json({ success: true, message: 'LinkedIn status updated.', item: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ==========================================
// PUBLIC TRACKING & UNSUBSCRIBE ENDPOINTS
// ==========================================

export async function handleUnsubscribe(req, res) {
  try {
    const { leadId, campaignId, email } = req.query;

    if (email) {
      await prisma.suppressionList.upsert({
        where: { type_value: { type: 'EMAIL', value: email.trim().toLowerCase() } },
        update: { reason: 'UNSUBSCRIBED' },
        create: { type: 'EMAIL', value: email.trim().toLowerCase(), reason: 'UNSUBSCRIBED' },
      });
    }

    if (leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: 'DO_NOT_CONTACT' },
      });
    }

    if (leadId && campaignId) {
      await prisma.campaignLead.updateMany({
        where: { leadId, campaignId },
        data: { status: 'UNSUBSCRIBED' },
      });
    }

    // Render clean, modern unsubscribe confirmation HTML page
    res.setHeader('Content-Type', 'text/html');
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed Successfully</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #1e293b; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 440px; text-align: center; }
            h2 { color: #0f172a; margin-top: 0; }
            p { color: #64748b; line-height: 1.5; }
            .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Unsubscribed</span>
            <h2>You Have Been Removed</h2>
            <p>You have successfully unsubscribed from this outreach sequence and your email address has been added to our Do-Not-Contact list.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    return res.status(500).send('An error occurred during unsubscribe.');
  }
}

export async function handleTrackOpen(req, res) {
  try {
    const { trackingId } = req.params;

    if (trackingId) {
      const event = await prisma.emailEvent.findUnique({
        where: { trackingId },
        include: { campaignLead: true },
      });

      if (event && event.campaignLead) {
        await prisma.campaignLead.update({
          where: { id: event.campaignLeadId },
          data: {
            status: event.campaignLead.status === 'SENT' ? 'OPENED' : event.campaignLead.status,
            openedAt: new Date(),
          },
        });
      }
    }
  } catch (e) {
    // Ignore tracking errors
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  });
  return res.end(pixel);
}
