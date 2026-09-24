import prisma from '../utils/db.js';
import { interpolateVariables } from './emailService.js';

/**
 * Prepares LinkedIn Outreach Queue Items for Employee or Campaign
 */
export async function queueLinkedInOutreach({ campaignId, leadId, employeeId, templateText }) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error('Lead not found.');

  const employee = employeeId ? await prisma.user.findUnique({ where: { id: employeeId } }) : null;
  const personalizedText = interpolateVariables(templateText, lead, employee || {});

  const message = await prisma.linkedInMessage.create({
    data: {
      campaignId,
      leadId,
      employeeId,
      messageText: personalizedText,
      status: 'NOT_CONTACTED',
    },
  });

  return message;
}

/**
 * Updates status of LinkedIn outreach
 */
export async function updateLinkedInStatus(messageId, status, notes = null) {
  const message = await prisma.linkedInMessage.update({
    where: { id: messageId },
    data: {
      status,
      notes,
      ...(status === 'MESSAGE_SENT' || status === 'CONNECTION_REQUESTED' ? { sentAt: new Date() } : {}),
      ...(status === 'REPLIED' || status === 'INTERESTED' ? { repliedAt: new Date() } : {}),
    },
    include: { lead: true },
  });

  // If lead is interested or converted, update lead status
  if (status === 'INTERESTED') {
    await prisma.lead.update({
      where: { id: message.leadId },
      data: { status: 'INTERESTED' },
    });
  } else if (status === 'NOT_INTERESTED') {
    await prisma.lead.update({
      where: { id: message.leadId },
      data: { status: 'NOT_INTERESTED' },
    });
  }

  return message;
}
