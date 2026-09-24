import prisma from '../utils/db.js';
import { decrypt } from '../utils/crypto.js';
import { interpolateVariables } from './emailService.js';

/**
 * Send a WhatsApp Message via Meta Cloud API or simulation mode
 */
export async function sendWhatsAppMessage({
  accountId = null,
  leadId,
  campaignId = null,
  employeeId = null,
  templateText,
}) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error('Lead not found.');

  const recipientPhone = lead.whatsappNumber || lead.phone;
  if (!recipientPhone) throw new Error('Lead does not have a valid WhatsApp phone number.');

  // Check suppression
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
  const suppressed = await prisma.suppressionList.findFirst({
    where: { type: 'PHONE', value: cleanPhone },
  });
  if (suppressed || lead.status === 'DO_NOT_CONTACT') {
    throw new Error(`Phone number ${recipientPhone} is on the Opt-Out / Do-Not-Contact list.`);
  }

  // Load account
  let account = null;
  if (accountId) {
    account = await prisma.whatsAppAccount.findUnique({ where: { id: accountId } });
  } else {
    account = await prisma.whatsAppAccount.findFirst({ where: { status: 'ACTIVE' } });
  }

  let employee = null;
  if (employeeId) {
    employee = await prisma.user.findUnique({ where: { id: employeeId } });
  }

  const messageText = interpolateVariables(templateText, lead, employee || {});

  let isSimulated = true;
  let whatsappMessageId = `wa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (account && account.phoneNumberId && account.accessTokenEncrypted) {
    const token = decrypt(account.accessTokenEncrypted);
    if (token && !account.phoneNumberId.includes('demo') && !account.phoneNumberId.includes('mock')) {
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${account.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: false, body: messageText },
          }),
        });

        const data = await response.json();
        if (response.ok && data.messages?.[0]?.id) {
          whatsappMessageId = data.messages[0].id;
          isSimulated = false;
        } else {
          console.warn('WhatsApp API returned error, falling back to simulated:', data);
        }
      } catch (err) {
        console.warn('WhatsApp API network error, falling back to simulated:', err.message);
      }
    }
  }

  // Record WhatsApp message in DB
  const record = await prisma.whatsAppMessage.create({
    data: {
      campaignId,
      leadId,
      employeeId,
      messageText,
      status: 'SENT',
      whatsappMessageId,
      sentAt: new Date(),
    },
  });

  // Update lead lastContactedAt
  await prisma.lead.update({
    where: { id: leadId },
    data: { lastContactedAt: new Date(), status: lead.status === 'NEW' ? 'CONTACTED' : lead.status },
  });

  return { success: true, message: record, isSimulated };
}

/**
 * Handle incoming opt-out / STOP keyword
 */
export async function handleWhatsAppOptOut(phoneNumber, reason = 'User requested STOP') {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

  await prisma.suppressionList.upsert({
    where: {
      type_value: {
        type: 'PHONE',
        value: cleanPhone,
      },
    },
    update: { reason: 'OPT_OUT' },
    create: {
      type: 'PHONE',
      value: cleanPhone,
      reason: 'OPT_OUT',
    },
  });

  // Mark all matching leads as DO_NOT_CONTACT
  await prisma.lead.updateMany({
    where: {
      OR: [
        { phone: { contains: cleanPhone } },
        { whatsappNumber: { contains: cleanPhone } },
      ],
    },
    data: { status: 'DO_NOT_CONTACT' },
  });

  console.log(`[OPT-OUT] Phone ${phoneNumber} successfully added to suppression list.`);
}
