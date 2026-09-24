import prisma from '../utils/db.js';
import { getTodayDateString } from '../services/attendanceService.js';
import { logActivity } from '../middleware/audit.js';

export async function getFollowups(req, res) {
  try {
    const { timeframe, channel, employeeId, completed } = req.query;
    const today = getTodayDateString();

    const where = {};

    // Role check: Employee sees only their own follow-ups
    if (req.user.role === 'EMPLOYEE') {
      where.assignedEmployeeId = req.user.id;
    } else if (employeeId) {
      where.assignedEmployeeId = employeeId;
    }

    if (channel) where.channel = channel;
    if (completed !== undefined) where.completed = completed === 'true';

    // Timeframe filters: today, tomorrow, overdue, this_week
    const d = new Date();
    if (timeframe === 'today') {
      where.dueDate = today;
    } else if (timeframe === 'tomorrow') {
      const tomorrow = new Date(d);
      tomorrow.setDate(d.getDate() + 1);
      where.dueDate = tomorrow.toISOString().split('T')[0];
    } else if (timeframe === 'overdue') {
      where.dueDate = { lt: today };
      where.completed = false;
    } else if (timeframe === 'this_week') {
      const nextWeek = new Date(d);
      nextWeek.setDate(d.getDate() + 7);
      where.dueDate = {
        gte: today,
        lte: nextWeek.toISOString().split('T')[0],
      };
    }

    const followups = await prisma.followup.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            leadNumber: true,
            name: true,
            company: true,
            designation: true,
            phone: true,
            email: true,
            whatsappNumber: true,
            linkedinUrl: true,
            lastContactedAt: true,
            status: true,
          },
        },
        assignedEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return res.json({ success: true, followups });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createFollowup(req, res) {
  try {
    const { leadId, title, dueDate, channel = 'EMAIL', remarks, assignedEmployeeId } = req.body;

    if (!leadId || !title || !dueDate) {
      return res.status(400).json({ success: false, message: 'Lead ID, title, and due date are required.' });
    }

    const assigned = req.user.role === 'EMPLOYEE' ? req.user.id : (assignedEmployeeId || req.user.id);

    const followup = await prisma.followup.create({
      data: {
        leadId,
        title: title.trim(),
        dueDate,
        channel,
        remarks: remarks?.trim(),
        assignedEmployeeId: assigned,
      },
      include: { lead: true },
    });

    // Update lead's nextFollowupDate
    await prisma.lead.update({
      where: { id: leadId },
      data: { nextFollowupDate: dueDate },
    });

    return res.status(201).json({ success: true, message: 'Follow-up created.', followup });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function completeFollowup(req, res) {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const updated = await prisma.followup.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date(),
        remarks: remarks !== undefined ? remarks : undefined,
      },
      include: { lead: true },
    });

    return res.json({ success: true, message: 'Follow-up marked as completed.', followup: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
