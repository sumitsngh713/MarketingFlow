import prisma from '../utils/db.js';
import {
  employeeCheckIn,
  employeeCheckOut,
  getTodayDateString,
  formatWorkingHours,
} from '../services/attendanceService.js';
import { logActivity } from '../middleware/audit.js';

/**
 * Employee Check In
 */
export async function handleCheckIn(req, res) {
  try {
    const attendance = await employeeCheckIn(req.user.id);

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'CHECK_IN',
      module: 'ATTENDANCE',
      description: `Checked in at ${attendance.checkInTime.toLocaleTimeString()} (${attendance.status}).`,
      req,
    });

    return res.json({
      success: true,
      message: 'Check-in successful!',
      attendance: {
        ...attendance,
        formattedWorkingHours: formatWorkingHours(attendance.workingHoursMinutes),
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * Employee Check Out
 */
export async function handleCheckOut(req, res) {
  try {
    const attendance = await employeeCheckOut(req.user.id);

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'CHECK_OUT',
      module: 'ATTENDANCE',
      description: `Checked out at ${attendance.checkOutTime.toLocaleTimeString()}. Worked ${formatWorkingHours(attendance.workingHoursMinutes)}.`,
      req,
    });

    return res.json({
      success: true,
      message: 'Check-out successful!',
      attendance: {
        ...attendance,
        formattedWorkingHours: formatWorkingHours(attendance.workingHoursMinutes),
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * Today's attendance for current user
 */
export async function getTodayAttendance(req, res) {
  try {
    const today = getTodayDateString();
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: { userId: req.user.id, date: today },
      },
    });

    return res.json({
      success: true,
      date: today,
      attendance: attendance
        ? {
            ...attendance,
            formattedWorkingHours: formatWorkingHours(attendance.workingHoursMinutes),
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Attendance history for current user
 */
export async function getMyAttendance(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const where = { userId: req.user.id };

    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 60,
    });

    return res.json({
      success: true,
      records: records.map(r => ({
        ...r,
        formattedWorkingHours: formatWorkingHours(r.workingHoursMinutes),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin view: All attendance records with filters
 */
export async function getAllAttendance(req, res) {
  try {
    const { date, employeeId, department, status, startDate, endDate } = req.query;

    const where = {};
    if (date) where.date = date;
    if (startDate && endDate) where.date = { gte: startDate, lte: endDate };
    if (status) where.status = status;

    if (employeeId || department) {
      where.user = {};
      if (employeeId) where.user.id = employeeId;
      if (department) where.user.department = department;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            designation: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({
      success: true,
      records: records.map(r => ({
        ...r,
        formattedWorkingHours: formatWorkingHours(r.workingHoursMinutes),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin manual modification of attendance
 */
export async function modifyAttendance(req, res) {
  try {
    const { id } = req.params;
    const { checkInTime, checkOutTime, status, remarks, workingHoursMinutes } = req.body;

    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Attendance record not found.' });

    let finalWorkingMinutes = workingHoursMinutes !== undefined ? Number(workingHoursMinutes) : existing.workingHoursMinutes;

    if (checkInTime && checkOutTime && workingHoursMinutes === undefined) {
      const inD = new Date(checkInTime);
      const outD = new Date(checkOutTime);
      finalWorkingMinutes = Math.max(0, Math.floor((outD - inD) / (1000 * 60)));
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        checkInTime: checkInTime ? new Date(checkInTime) : existing.checkInTime,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : existing.checkOutTime,
        status: status || existing.status,
        remarks: remarks !== undefined ? remarks : existing.remarks,
        workingHoursMinutes: finalWorkingMinutes,
        manualOverride: true,
        overriddenBy: `${req.user.firstName} ${req.user.lastName} (Admin)`,
      },
      include: { user: true },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'ATTENDANCE_MODIFIED',
      module: 'ATTENDANCE',
      description: `Manually modified attendance for ${existing.user.firstName} ${existing.user.lastName} on ${existing.date}.`,
      req,
    });

    return res.json({
      success: true,
      message: 'Attendance record updated successfully.',
      attendance: {
        ...updated,
        formattedWorkingHours: formatWorkingHours(updated.workingHoursMinutes),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
