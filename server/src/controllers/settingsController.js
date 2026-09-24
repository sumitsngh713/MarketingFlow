import prisma from '../utils/db.js';
import { logActivity } from '../middleware/audit.js';

export async function getSettings(req, res) {
  try {
    let settings = await prisma.organisationSetting.findFirst();

    if (!settings) {
      settings = await prisma.organisationSetting.create({
        data: {
          id: 'default-org',
          orgName: 'MarketingFlow',
          address: '100 Innovation Blvd, Tech Park, Suite 400',
          timezone: 'UTC',
          workStartTime: '09:00',
          workEndTime: '18:00',
          lateThresholdMinutes: 15,
          workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
          defaultEmailDailyLimit: 200,
          defaultFollowupDelayDays: 3,
        },
      });
    }

    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateSettings(req, res) {
  try {
    const {
      orgName,
      logoUrl,
      address,
      timezone,
      workStartTime,
      workEndTime,
      lateThresholdMinutes,
      workingDays,
      defaultEmailDailyLimit,
      defaultFollowupDelayDays,
    } = req.body;

    const updated = await prisma.organisationSetting.upsert({
      where: { id: 'default-org' },
      update: {
        ...(orgName !== undefined && { orgName: orgName.trim() }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(address !== undefined && { address: address?.trim() }),
        ...(timezone !== undefined && { timezone }),
        ...(workStartTime !== undefined && { workStartTime }),
        ...(workEndTime !== undefined && { workEndTime }),
        ...(lateThresholdMinutes !== undefined && { lateThresholdMinutes: Number(lateThresholdMinutes) }),
        ...(workingDays !== undefined && { workingDays }),
        ...(defaultEmailDailyLimit !== undefined && { defaultEmailDailyLimit: Number(defaultEmailDailyLimit) }),
        ...(defaultFollowupDelayDays !== undefined && { defaultFollowupDelayDays: Number(defaultFollowupDelayDays) }),
      },
      create: {
        id: 'default-org',
        orgName: orgName?.trim() || 'MarketingFlow',
        address: address?.trim() || '',
        timezone: timezone || 'UTC',
        workStartTime: workStartTime || '09:00',
        workEndTime: workEndTime || '18:00',
        lateThresholdMinutes: Number(lateThresholdMinutes) || 15,
        workingDays: workingDays || 'Monday,Tuesday,Wednesday,Thursday,Friday',
        defaultEmailDailyLimit: Number(defaultEmailDailyLimit) || 200,
        defaultFollowupDelayDays: Number(defaultFollowupDelayDays) || 3,
      },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'SETTINGS_UPDATED',
      module: 'SETTINGS',
      description: `Organisation settings updated by ${req.user.firstName}.`,
      req,
    });

    return res.json({ success: true, message: 'Settings saved successfully.', settings: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
