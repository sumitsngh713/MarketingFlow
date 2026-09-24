import prisma from '../utils/db.js';

/**
 * Format minutes into "Xh Ym"
 */
export function formatWorkingHours(minutes) {
  if (!minutes || minutes <= 0) return '0h 0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

/**
 * Get today's date in YYYY-MM-DD
 */
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Handle Employee Check-In
 */
export async function employeeCheckIn(userId) {
  const today = getTodayDateString();

  // Check if attendance already exists
  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: { userId, date: today },
    },
  });

  if (existing && existing.checkInTime) {
    throw new Error('You have already checked in for today.');
  }

  // Load org settings for late threshold
  const orgSettings = await prisma.organisationSetting.findFirst();
  const now = new Date();
  let status = 'PRESENT';

  if (orgSettings && orgSettings.workStartTime) {
    const [startHour, startMin] = orgSettings.workStartTime.split(':').map(Number);
    const thresholdMinutes = orgSettings.lateThresholdMinutes || 15;

    const scheduledStart = new Date(now);
    scheduledStart.setHours(startHour, startMin, 0, 0);

    const diffMinutes = Math.floor((now - scheduledStart) / (1000 * 60));
    if (diffMinutes > thresholdMinutes) {
      status = 'LATE';
    }
  }

  if (existing) {
    return await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkInTime: now,
        status: existing.status === 'ABSENT' ? status : existing.status,
      },
      include: { user: true },
    });
  }

  return await prisma.attendance.create({
    data: {
      userId,
      date: today,
      checkInTime: now,
      status,
    },
    include: { user: true },
  });
}

/**
 * Handle Employee Check-Out
 */
export async function employeeCheckOut(userId) {
  const today = getTodayDateString();

  const record = await prisma.attendance.findUnique({
    where: {
      userId_date: { userId, date: today },
    },
  });

  if (!record || !record.checkInTime) {
    throw new Error('You have not checked in today yet.');
  }

  const now = new Date();
  const checkIn = new Date(record.checkInTime);
  const workingMinutes = Math.max(0, Math.floor((now - checkIn) / (1000 * 60)));

  // Half day condition if < 4 hours (240 minutes)
  let status = record.status;
  if (workingMinutes < 240 && status !== 'LEAVE') {
    status = 'HALF_DAY';
  }

  return await prisma.attendance.update({
    where: { id: record.id },
    data: {
      checkOutTime: now,
      workingHoursMinutes: workingMinutes,
      status,
    },
    include: { user: true },
  });
}
