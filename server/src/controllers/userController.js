import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../utils/db.js';
import { logActivity } from '../middleware/audit.js';

/**
 * List employees / users
 */
export async function getUsers(req, res) {
  try {
    const { search, role, status, department } = req.query;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        designation: true,
        department: true,
        role: true,
        joiningDate: true,
        status: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            assignedLeads: true,
            attendances: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get user by ID
 */
export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        designation: true,
        department: true,
        role: true,
        joiningDate: true,
        status: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Create Employee
 */
export async function createUser(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      employeeId,
      designation,
      department,
      role = 'EMPLOYEE',
      joiningDate,
      password,
      status = 'ACTIVE',
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name, and email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          employeeId ? { employeeId: employeeId.trim() } : undefined,
        ].filter(Boolean),
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.email === cleanEmail ? 'Email is already registered.' : 'Employee ID is already in use.',
      });
    }

    // Auto-generate employeeId if omitted
    let finalEmpId = employeeId?.trim();
    if (!finalEmpId) {
      const count = await prisma.user.count();
      finalEmpId = `EMP-${String(count + 1).padStart(3, '0')}`;
    }

    // Generate random secure initial password if not provided
    const tempPassword = password || crypto.randomBytes(4).toString('hex') + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        phone: phone?.trim(),
        employeeId: finalEmpId,
        designation: designation?.trim(),
        department: department?.trim(),
        role: role.toUpperCase(),
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        passwordHash,
        status,
        mustChangePassword: true, // Force password change on first login
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        designation: true,
        department: true,
        role: true,
        joiningDate: true,
        status: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'USER_CREATED',
      module: 'EMPLOYEES',
      description: `Created new ${role} ${newUser.email} (${newUser.employeeId})`,
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      user: newUser,
      temporaryPassword: tempPassword, // Provided so Admin can copy login credentials immediately
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Update User
 */
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      employeeId,
      designation,
      department,
      role,
      joiningDate,
      status,
    } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'User not found.' });

    // Check unique email/employeeId if changed
    if (email && email.toLowerCase() !== existing.email) {
      const emailDup = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (emailDup) return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName !== undefined ? firstName.trim() : existing.firstName,
        lastName: lastName !== undefined ? lastName.trim() : existing.lastName,
        email: email !== undefined ? email.trim().toLowerCase() : existing.email,
        phone: phone !== undefined ? phone?.trim() : existing.phone,
        employeeId: employeeId !== undefined ? employeeId?.trim() : existing.employeeId,
        designation: designation !== undefined ? designation?.trim() : existing.designation,
        department: department !== undefined ? department?.trim() : existing.department,
        role: role !== undefined ? role : existing.role,
        joiningDate: joiningDate ? new Date(joiningDate) : existing.joiningDate,
        status: status !== undefined ? status : existing.status,
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        designation: true,
        department: true,
        role: true,
        joiningDate: true,
        status: true,
        lastLoginAt: true,
      },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'USER_UPDATED',
      module: 'EMPLOYEES',
      description: `Updated profile for user ${updated.email}`,
      req,
    });

    return res.json({ success: true, message: 'User updated successfully.', user: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Toggle User Status (Enable/Disable)
 */
export async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot disable your own account.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: status === 'DISABLED' ? 'DISABLED' : 'ACTIVE' },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: status === 'DISABLED' ? 'USER_DISABLED' : 'USER_ENABLED',
      module: 'EMPLOYEES',
      description: `User ${updated.email} was ${status === 'DISABLED' ? 'disabled' : 'enabled'}.`,
      req,
    });

    return res.json({ success: true, message: `User account ${status === 'DISABLED' ? 'disabled' : 'enabled'}.`, status: updated.status });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Reset User Password (Admin action)
 */
export async function resetUserPassword(req, res) {
  try {
    const { id } = req.params;
    const newPassword = crypto.randomBytes(4).toString('hex') + 'A1!';
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'PASSWORD_RESET',
      module: 'EMPLOYEES',
      description: `Admin reset password for user ${user.email}.`,
      req,
    });

    return res.json({
      success: true,
      message: 'Password reset successfully.',
      temporaryPassword: newPassword,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Delete User
 */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await prisma.user.delete({ where: { id } });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'USER_DELETED',
      module: 'EMPLOYEES',
      description: `Deleted employee user ${user.email} (${user.employeeId})`,
      req,
    });

    return res.json({ success: true, message: 'Employee deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
