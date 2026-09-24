import bcrypt from 'bcryptjs';
import prisma from '../utils/db.js';
import { signToken } from '../utils/jwt.js';
import { logActivity } from '../middleware/audit.js';

/**
 * Check if initial setup is needed (i.e. zero users in DB)
 */
export async function checkSetupStatus(req, res) {
  try {
    const userCount = await prisma.user.count();
    return res.json({
      success: true,
      setupNeeded: userCount === 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Super Admin initial setup wizard
 */
export async function setupSuperAdmin(req, res) {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'System has already been initialized. Please log in.',
      });
    }

    const { email, password, firstName, lastName, phone, orgName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name and last name are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        role: 'ADMIN',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim(),
        employeeId: 'ADM-001',
        designation: 'Super Administrator',
        department: 'Executive',
        status: 'ACTIVE',
        mustChangePassword: false,
      },
    });

    // Initialize Organisation Setting
    if (orgName) {
      await prisma.organisationSetting.upsert({
        where: { id: 'default-org' },
        update: { orgName: orgName.trim() },
        create: { id: 'default-org', orgName: orgName.trim() },
      });
    }

    await logActivity({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      role: 'ADMIN',
      action: 'SYSTEM_SETUP',
      module: 'AUTH',
      description: 'Super Admin initialized the system and created initial admin account.',
      req,
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return res.status(201).json({
      success: true,
      message: 'Super Admin account created successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        designation: user.designation,
        department: user.department,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Setup Super Admin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { employeeId: email.trim().toUpperCase() },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'Your account is disabled. Please contact the administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logActivity({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      action: 'LOGIN',
      module: 'AUTH',
      description: `User ${user.email} logged in successfully.`,
      req,
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        designation: user.designation,
        department: user.department,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
}

/**
 * Logout
 */
export async function logout(req, res) {
  try {
    if (req.user) {
      await logActivity({
        userId: req.user.id,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.role,
        action: 'LOGOUT',
        module: 'AUTH',
        description: `User ${req.user.email} logged out.`,
        req,
      });
    }
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get current profile
 */
export async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        employeeId: true,
        designation: true,
        department: true,
        joiningDate: true,
        status: true,
        mustChangePassword: true,
        avatarUrl: true,
        lastLoginAt: true,
      },
    });

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Change Password
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // If not forced change, require current password
    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password.' });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    await logActivity({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      action: 'PASSWORD_CHANGED',
      module: 'AUTH',
      description: 'User changed their password.',
      req,
    });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
