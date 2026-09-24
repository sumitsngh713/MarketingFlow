import prisma from '../utils/db.js';
import { sendEmail, interpolateVariables } from './emailService.js';
import { sendWhatsAppMessage } from './whatsappService.js';

/**
 * Main automated campaign and follow-up engine
 */
export async function processCampaignQueues() {
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: 'RUNNING' },
    include: {
      sequences: { orderBy: { stepNumber: 'asc' } },
      owner: true,
    },
  });

  const summary = {
    campaignsProcessed: activeCampaigns.length,
    emailsDispatched: 0,
    whatsAppDispatched: 0,
    leadsHalted: 0,
    errors: [],
  };

  const now = new Date();

  for (const campaign of activeCampaigns) {
    try {
      // 1. Fetch pending or in-progress campaign leads
      const campaignLeads = await prisma.campaignLead.findMany({
        where: {
          campaignId: campaign.id,
          status: { in: ['PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED'] },
        },
        include: {
          lead: true,
        },
        take: campaign.dailyLimit || 50,
      });

      for (const item of campaignLeads) {
        const lead = item.lead;

        // RULE: If lead replied or marked Interested, Not Interested, or Do Not Contact: STOP
        if (
          item.status === 'REPLIED' ||
          item.status === 'INTERESTED' ||
          ['INTERESTED', 'NOT_INTERESTED', 'DO_NOT_CONTACT', 'CONVERTED'].includes(lead.status)
        ) {
          await prisma.campaignLead.update({
            where: { id: item.id },
            data: {
              status: lead.status === 'INTERESTED' ? 'INTERESTED' : 'FAILED',
              errorReason: `Halted due to lead status: ${lead.status}`,
            },
          });
          summary.leadsHalted++;
          continue;
        }

        // --- EMAIL CHANNEL ---
        if (campaign.channel === 'EMAIL') {
          // Check if initial email needs to be sent (currentStep === 0 and status === 'PENDING')
          if (item.currentStep === 0 && item.status === 'PENDING') {
            const subject = interpolateVariables(campaign.subject || 'Follow-up regarding your business', lead, campaign.owner || {});
            const body = interpolateVariables(campaign.body || 'Hi {{first_name}}, let us connect.', lead, campaign.owner || {});

            try {
              await sendEmail({
                accountId: campaign.senderAccountId,
                to: lead.email,
                subject,
                htmlContent: body,
                campaignLeadId: item.id,
                leadId: lead.id,
                campaignId: campaign.id,
              });
              summary.emailsDispatched++;
            } catch (err) {
              summary.errors.push({ leadId: lead.id, error: err.message });
              await prisma.campaignLead.update({
                where: { id: item.id },
                data: { status: 'FAILED', errorReason: err.message },
              });
            }
          }
          // Check for Follow-up sequences (currentStep >= 1)
          else if (item.lastActionAt && campaign.sequences && campaign.sequences.length > 0) {
            const nextStepIndex = item.currentStep + 1;
            const sequenceStep = campaign.sequences.find(s => s.stepNumber === nextStepIndex);

            if (sequenceStep) {
              const lastActionTime = new Date(item.lastActionAt).getTime();
              const daysSinceLastAction = (now.getTime() - lastActionTime) / (1000 * 60 * 60 * 24);

              if (daysSinceLastAction >= sequenceStep.delayDays) {
                const subject = interpolateVariables(sequenceStep.subject, lead, campaign.owner || {});
                const body = interpolateVariables(sequenceStep.body, lead, campaign.owner || {});

                try {
                  await sendEmail({
                    accountId: campaign.senderAccountId,
                    to: lead.email,
                    subject,
                    htmlContent: body,
                    campaignLeadId: item.id,
                    leadId: lead.id,
                    campaignId: campaign.id,
                  });

                  await prisma.campaignLead.update({
                    where: { id: item.id },
                    data: {
                      currentStep: nextStepIndex,
                      status: 'SENT',
                      lastActionAt: now,
                    },
                  });
                  summary.emailsDispatched++;
                } catch (err) {
                  summary.errors.push({ leadId: lead.id, step: nextStepIndex, error: err.message });
                }
              }
            } else if (item.currentStep >= campaign.sequences.length) {
              // Reached end of sequence without reply
              // Mark complete for this lead
            }
          }
        }

        // --- WHATSAPP CHANNEL ---
        else if (campaign.channel === 'WHATSAPP') {
          if (item.status === 'PENDING') {
            try {
              await sendWhatsAppMessage({
                accountId: campaign.senderAccountId,
                leadId: lead.id,
                campaignId: campaign.id,
                employeeId: campaign.ownerId,
                templateText: campaign.body || 'Hi {{first_name}}, following up on WhatsApp.',
              });

              await prisma.campaignLead.update({
                where: { id: item.id },
                data: {
                  status: 'SENT',
                  sentAt: now,
                  lastActionAt: now,
                },
              });
              summary.whatsAppDispatched++;
            } catch (err) {
              summary.errors.push({ leadId: lead.id, channel: 'WHATSAPP', error: err.message });
              await prisma.campaignLead.update({
                where: { id: item.id },
                data: { status: 'FAILED', errorReason: err.message },
              });
            }
          }
        }
      }
    } catch (campaignErr) {
      console.error(`Error processing campaign ${campaign.id}:`, campaignErr);
      summary.errors.push({ campaignId: campaign.id, error: campaignErr.message });
    }
  }

  return summary;
}
