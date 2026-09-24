import prisma from '../utils/db.js';

export async function getActivityLogs(req, res) {
  try {
    const { employeeId, module: mod, action, startDate, endDate } = req.query;

    const where = {};
    if (employeeId) where.userId = employeeId;
    if (mod) where.module = mod;
    if (action) where.action = action;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
