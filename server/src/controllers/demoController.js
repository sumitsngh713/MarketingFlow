import prisma from '../utils/db.js';
import { seedDemoData } from '../seeds/seed.js';
import { logActivity } from '../middleware/audit.js';

export async function resetDemoData(req, res) {
  try {
    // Purge records except the current user if admin
    await prisma.notification.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.followup.deleteMany();
    await prisma.task.deleteMany();
    await prisma.whatsAppMessage.deleteMany();
    await prisma.linkedInMessage.deleteMany();
    await prisma.emailEvent.deleteMany();
    await prisma.emailSequence.deleteMany();
    await prisma.campaignLead.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.emailAccount.deleteMany();
    await prisma.whatsAppAccount.deleteMany();
    await prisma.suppressionList.deleteMany();

    // Re-seed
    await seedDemoData();

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'DEMO_DATA_RESET',
      module: 'SETTINGS',
      description: 'Admin reset the system demo data to fresh factory state.',
      req,
    });

    return res.json({ success: true, message: 'Demo data reset to fresh state successfully!' });
  } catch (error) {
    console.error('Reset demo data error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function purgeDemoData(req, res) {
  try {
    await prisma.notification.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.followup.deleteMany();
    await prisma.task.deleteMany();
    await prisma.whatsAppMessage.deleteMany();
    await prisma.linkedInMessage.deleteMany();
    await prisma.emailEvent.deleteMany();
    await prisma.emailSequence.deleteMany();
    await prisma.campaignLead.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.emailAccount.deleteMany();
    await prisma.whatsAppAccount.deleteMany();
    await prisma.suppressionList.deleteMany();
    // Keep users but remove demo employees
    await prisma.user.deleteMany({
      where: {
        id: { not: req.user.id },
      },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'DEMO_DATA_PURGED',
      module: 'SETTINGS',
      description: 'Admin purged all demo data from the organization.',
      req,
    });

    return res.json({ success: true, message: 'All demo data purged. Ready for clean production use.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
