import prisma from '../utils/db.js';

export async function getPerformanceReport(req, res) {
  try {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        designation: true,
      },
    });

    const report = [];

    for (const emp of employees) {
      const leadsAssigned = await prisma.lead.count({ where: { assignedEmployeeId: emp.id } });
      const interestedLeads = await prisma.lead.count({ where: { assignedEmployeeId: emp.id, status: 'INTERESTED' } });
      const convertedLeads = await prisma.lead.count({ where: { assignedEmployeeId: emp.id, status: 'CONVERTED' } });

      const linkedInOutreach = await prisma.linkedInMessage.count({
        where: { employeeId: emp.id, status: { in: ['MESSAGE_SENT', 'CONNECTION_REQUESTED', 'CONNECTED', 'REPLIED', 'INTERESTED'] } },
      });
      const linkedInReplies = await prisma.linkedInMessage.count({
        where: { employeeId: emp.id, status: { in: ['REPLIED', 'INTERESTED'] } },
      });

      const whatsAppMessages = await prisma.whatsAppMessage.count({
        where: { employeeId: emp.id, status: { in: ['SENT', 'DELIVERED', 'READ', 'REPLIED'] } },
      });
      const whatsAppReplies = await prisma.whatsAppMessage.count({
        where: { employeeId: emp.id, status: 'REPLIED' },
      });

      // Employee campaigns emails
      const empCampaigns = await prisma.campaign.findMany({
        where: { ownerId: emp.id },
        select: { id: true },
      });
      const empCampIds = empCampaigns.map(c => c.id);

      const emailsSent = await prisma.campaignLead.count({
        where: {
          campaignId: { in: empCampIds },
          status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'INTERESTED'] },
        },
      });
      const emailsReplied = await prisma.campaignLead.count({
        where: {
          campaignId: { in: empCampIds },
          status: { in: ['REPLIED', 'INTERESTED'] },
        },
      });

      report.push({
        id: emp.id,
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department || 'Marketing',
        leadsAssigned,
        emailsSent,
        emailsReplied,
        linkedInOutreach,
        linkedInReplies,
        whatsAppMessages,
        whatsAppReplies,
        interestedLeads,
        convertedLeads,
      });
    }

    return res.json({ success: true, report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAttendanceReport(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: { id: true, employeeId: true, firstName: true, lastName: true, department: true },
    });

    const whereDate = {};
    if (startDate && endDate) {
      whereDate.date = { gte: startDate, lte: endDate };
    }

    const report = [];

    for (const emp of employees) {
      const records = await prisma.attendance.findMany({
        where: { userId: emp.id, ...whereDate },
      });

      const totalRecordedDays = records.length;
      const present = records.filter(r => ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.status)).length;
      const late = records.filter(r => r.status === 'LATE').length;
      const leave = records.filter(r => r.status === 'LEAVE').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;

      const workingDays = Math.max(totalRecordedDays, 22); // standard monthly baseline
      const attendancePercent = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;

      report.push({
        id: emp.id,
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department || 'Operations',
        workingDays,
        present,
        absent,
        leave,
        late,
        attendancePercent: Math.min(100, attendancePercent),
      });
    }

    return res.json({ success: true, report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMarketingReport(req, res) {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        campaignLeads: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const report = campaigns.map(c => {
      const leads = c.campaignLeads || [];
      const totalLeads = leads.length;
      const sent = leads.filter(l => ['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'INTERESTED'].includes(l.status)).length;
      const delivered = leads.filter(l => ['DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'INTERESTED'].includes(l.status)).length || sent;
      const replies = leads.filter(l => ['REPLIED', 'INTERESTED'].includes(l.status)).length;
      const interested = leads.filter(l => l.status === 'INTERESTED').length;
      const converted = leads.filter(l => l.status === 'CONVERTED').length;

      const replyPercent = sent > 0 ? Math.round((replies / sent) * 100) : 0;
      const conversionPercent = totalLeads > 0 ? Math.round((interested / totalLeads) * 100) : 0;

      return {
        id: c.id,
        campaign: c.name,
        channel: c.channel,
        status: c.status,
        leads: totalLeads,
        sent,
        delivered,
        replies,
        interested,
        converted,
        replyPercent,
        conversionPercent,
      };
    });

    return res.json({ success: true, report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
