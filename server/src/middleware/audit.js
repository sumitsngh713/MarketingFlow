import prisma from '../utils/db.js';

/**
 * Log an audit trail entry in the database
 */
export async function logActivity({
  userId = null,
  userName = null,
  role = null,
  action,
  module,
  description,
  req = null,
}) {
  try {
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || null;
      userAgent = req.headers['user-agent'] || null;
      if (!userId && req.user) {
        userId = req.user.id;
        userName = `${req.user.firstName} ${req.user.lastName}`.trim();
        role = req.user.role;
      }
    }

    await prisma.activityLog.create({
      data: {
        userId,
        userName: userName || (userId ? 'User' : 'System'),
        role: role || 'SYSTEM',
        action,
        module,
        description,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.slice(0, 100) : null,
        userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 255) : null,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error.message);
  }
}
