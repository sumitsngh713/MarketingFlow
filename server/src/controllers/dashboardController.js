import prisma from '../utils/db.js';
import { getTodayDateString, formatWorkingHours } from '../services/attendanceService.js';

export async function getDashboardData(req, res) {
  try {
    const today = getTodayDateString();
    const isAdmin = req.user.role === 'ADMIN';

    // 1. Employee stats
    const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE', status: 'ACTIVE' } });

    // Today's attendance for all active employees
    const todayAttendances = await prisma.attendance.findMany({
      where: { date: today },
    });
    const presentToday = todayAttendances.filter(a => ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)).length;
    const absentToday = Math.max(0, totalEmployees - presentToday);
    const attendancePercentage = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    // 2. Leads stats
    const leadWhere = isAdmin ? {} : { assignedEmployeeId: req.user.id };
    const totalLeads = await prisma.lead.count({ where: leadWhere });
    const interestedLeads = await prisma.lead.count({
      where: { ...leadWhere, status: 'INTERESTED' },
    });

    // 3. Campaigns stats
    const campaignWhere = isAdmin ? {} : { ownerId: req.user.id };
    const activeCampaigns = await prisma.campaign.count({
      where: { ...campaignWhere, status: 'RUNNING' },
    });

    // 4. Outreach stats
    const emailEventsCount = await prisma.emailEvent.count({
      where: { eventType: 'SENT' },
    });
    const emailRepliesCount = await prisma.emailEvent.count({
      where: { eventType: 'REPLIED' },
    });

    const linkedInSent = await prisma.linkedInMessage.count({
      where: isAdmin
        ? { status: { in: ['MESSAGE_SENT', 'CONNECTION_REQUESTED', 'CONNECTED', 'REPLIED', 'INTERESTED'] } }
        : { employeeId: req.user.id, status: { in: ['MESSAGE_SENT', 'CONNECTION_REQUESTED', 'CONNECTED', 'REPLIED', 'INTERESTED'] } },
    });
    const linkedInReplies = await prisma.linkedInMessage.count({
      where: isAdmin ? { status: { in: ['REPLIED', 'INTERESTED'] } } : { employeeId: req.user.id, status: { in: ['REPLIED', 'INTERESTED'] } },
    });

    const whatsAppSent = await prisma.whatsAppMessage.count({
      where: isAdmin ? { status: { in: ['SENT', 'DELIVERED', 'READ', 'REPLIED'] } } : { employeeId: req.user.id, status: { in: ['SENT', 'DELIVERED', 'READ', 'REPLIED'] } },
    });
    const whatsAppReplies = await prisma.whatsAppMessage.count({
      where: isAdmin ? { status: 'REPLIED' } : { employeeId: req.user.id, status: 'REPLIED' },
    });

    // 5. Follow-ups Due
    const followupWhere = isAdmin
      ? { dueDate: today, completed: false }
      : { dueDate: today, completed: false, assignedEmployeeId: req.user.id };
    const followupsDue = await prisma.followup.count({ where: followupWhere });

    // 6. User's personal attendance (especially for Employee)
    const myTodayAttendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId: req.user.id, date: today } },
    });

    // 7. Attendance Chart Data (Past 7 days)
    const attendanceChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayRecords = await prisma.attendance.findMany({ where: { date: dateStr } });
      const present = dayRecords.filter(r => ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.status)).length;
      const late = dayRecords.filter(r => r.status === 'LATE').length;
      const absent = Math.max(0, totalEmployees - present);

      attendanceChart.push({
        date: dateStr,
        day: dayName,
        present,
        late,
        absent,
      });
    }

    // 8. Marketing Outreach Chart Data (By channel)
    const outreachChart = [
      { channel: 'Email', sent: emailEventsCount, replies: emailRepliesCount },
      { channel: 'LinkedIn', sent: linkedInSent, replies: linkedInReplies },
      { channel: 'WhatsApp', sent: whatsAppSent, replies: whatsAppReplies },
    ];

    // 9. Recent Activity Logs
    const recentActivities = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return res.json({
      success: true,
      kpis: {
        totalEmployees,
        presentToday,
        absentToday,
        attendancePercentage,
        totalLeads,
        activeCampaigns,
        emailsSent: emailEventsCount,
        emailReplies: emailRepliesCount,
        linkedInMessagesSent: linkedInSent,
        linkedInReplies,
        whatsAppMessagesSent: whatsAppSent,
        whatsAppReplies,
        followupsDue,
        repliesReceived: emailRepliesCount + linkedInReplies + whatsAppReplies,
        interestedLeads,
      },
      charts: {
        attendance: attendanceChart,
        outreach: outreachChart,
      },
      myAttendance: myTodayAttendance ? {
        ...myTodayAttendance,
        formattedWorkingHours: formatWorkingHours(myTodayAttendance.workingHoursMinutes),
      } : null,
      recentActivities,
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
