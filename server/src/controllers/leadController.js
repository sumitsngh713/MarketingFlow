import prisma from '../utils/db.js';
import { logActivity } from '../middleware/audit.js';

/**
 * List leads (filtered by role: Employee sees only their assigned leads, Admin sees all)
 */
export async function getLeads(req, res) {
  try {
    const { status, assignedEmployeeId, search, industry, source } = req.query;

    const where = {};

    // Role-based visibility
    if (req.user.role === 'EMPLOYEE') {
      where.assignedEmployeeId = req.user.id;
    } else if (assignedEmployeeId) {
      where.assignedEmployeeId = assignedEmployeeId;
    }

    if (status) where.status = status;
    if (industry) where.industry = industry;
    if (source) where.source = source;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { designation: { contains: search } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        _count: {
          select: {
            campaignLeads: true,
            followups: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, leads });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Check for duplicate leads (by email, phone, or company + name)
 */
export async function checkDuplicates(req, res) {
  try {
    const { email, phone, company, name } = req.body;
    const conditions = [];

    if (email) conditions.push({ email: email.trim().toLowerCase() });
    if (phone) conditions.push({ phone: phone.trim() });
    if (company && name) {
      conditions.push({
        AND: [
          { company: { contains: company.trim() } },
          { name: { contains: name.trim() } },
        ],
      });
    }

    if (conditions.length === 0) {
      return res.json({ success: true, duplicates: [] });
    }

    const duplicates = await prisma.lead.findMany({
      where: { OR: conditions },
      select: {
        id: true,
        leadNumber: true,
        name: true,
        company: true,
        email: true,
        phone: true,
        status: true,
      },
    });

    return res.json({ success: true, duplicates, hasDuplicate: duplicates.length > 0 });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Create Lead
 */
export async function createLead(req, res) {
  try {
    const {
      name,
      designation,
      company,
      email,
      phone,
      linkedinUrl,
      whatsappNumber,
      website,
      industry,
      location,
      source = 'Manual',
      assignedEmployeeId,
      status = 'NEW',
      tags,
      notes,
      nextFollowupDate,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Lead name is required.' });
    }

    // Auto-generate leadNumber
    const count = await prisma.lead.count();
    const leadNumber = `LD-${String(count + 1).padStart(4, '0')}`;

    // Assignment: If employee creates, auto-assign to them unless admin
    let finalAssigned = assignedEmployeeId;
    if (req.user.role === 'EMPLOYEE') {
      finalAssigned = req.user.id;
    }

    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        name: name.trim(),
        designation: designation?.trim(),
        company: company?.trim(),
        email: email ? email.trim().toLowerCase() : null,
        phone: phone?.trim(),
        linkedinUrl: linkedinUrl?.trim(),
        whatsappNumber: whatsappNumber?.trim() || phone?.trim(),
        website: website?.trim(),
        industry: industry?.trim(),
        location: location?.trim(),
        source: source?.trim(),
        assignedEmployeeId: finalAssigned || null,
        status,
        tags: tags ? (Array.isArray(tags) ? tags.join(',') : tags) : null,
        notes: notes?.trim(),
        nextFollowupDate: nextFollowupDate || null,
      },
      include: {
        assignedEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'LEAD_CREATED',
      module: 'LEADS',
      description: `Created lead ${lead.name} (${lead.company || 'No Company'}) - ${lead.leadNumber}`,
      req,
    });

    return res.status(201).json({ success: true, message: 'Lead created successfully.', lead });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Bulk Import Leads (CSV / JSON data)
 */
export async function importLeads(req, res) {
  try {
    const { leads: incomingLeads, assignedEmployeeId, source = 'CSV Import' } = req.body;

    if (!Array.isArray(incomingLeads) || incomingLeads.length === 0) {
      return res.status(400).json({ success: false, message: 'No leads provided for import.' });
    }

    let imported = 0;
    let skippedDuplicates = 0;
    const errors = [];

    const existingCount = await prisma.lead.count();

    for (let i = 0; i < incomingLeads.length; i++) {
      const item = incomingLeads[i];
      if (!item.name) {
        errors.push({ row: i + 1, error: 'Name is required' });
        continue;
      }

      const email = item.email ? item.email.trim().toLowerCase() : null;
      const phone = item.phone ? item.phone.trim() : null;

      // Duplicate check
      if (email || phone) {
        const dup = await prisma.lead.findFirst({
          where: {
            OR: [
              email ? { email } : undefined,
              phone ? { phone } : undefined,
            ].filter(Boolean),
          },
        });

        if (dup) {
          skippedDuplicates++;
          continue;
        }
      }

      const leadNumber = `LD-${String(existingCount + imported + 1).padStart(4, '0')}`;
      const finalAssigned = req.user.role === 'EMPLOYEE' ? req.user.id : (assignedEmployeeId || null);

      await prisma.lead.create({
        data: {
          leadNumber,
          name: item.name.trim(),
          designation: item.designation?.trim(),
          company: item.company?.trim(),
          email,
          phone,
          linkedinUrl: item.linkedinUrl?.trim(),
          whatsappNumber: item.whatsappNumber?.trim() || phone,
          website: item.website?.trim(),
          industry: item.industry?.trim(),
          location: item.location?.trim(),
          source: item.source || source,
          assignedEmployeeId: finalAssigned,
          status: 'NEW',
          notes: item.notes?.trim(),
        },
      });

      imported++;
    }

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'LEADS_IMPORTED',
      module: 'LEADS',
      description: `Imported ${imported} leads. Skipped ${skippedDuplicates} duplicate records.`,
      req,
    });

    return res.json({
      success: true,
      message: `Successfully imported ${imported} leads. ${skippedDuplicates} duplicates were skipped.`,
      imported,
      skippedDuplicates,
      errors,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Update Lead
 */
export async function updateLead(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Lead not found.' });

    // Permission check: Employee can only edit their assigned lead
    if (req.user.role === 'EMPLOYEE' && existing.assignedEmployeeId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update leads assigned to you.' });
    }

    const {
      name,
      designation,
      company,
      email,
      phone,
      linkedinUrl,
      whatsappNumber,
      website,
      industry,
      location,
      source,
      assignedEmployeeId,
      status,
      tags,
      notes,
      nextFollowupDate,
    } = req.body;

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        designation: designation !== undefined ? designation?.trim() : existing.designation,
        company: company !== undefined ? company?.trim() : existing.company,
        email: email !== undefined ? (email ? email.trim().toLowerCase() : null) : existing.email,
        phone: phone !== undefined ? phone?.trim() : existing.phone,
        linkedinUrl: linkedinUrl !== undefined ? linkedinUrl?.trim() : existing.linkedinUrl,
        whatsappNumber: whatsappNumber !== undefined ? whatsappNumber?.trim() : existing.whatsappNumber,
        website: website !== undefined ? website?.trim() : existing.website,
        industry: industry !== undefined ? industry?.trim() : existing.industry,
        location: location !== undefined ? location?.trim() : existing.location,
        source: source !== undefined ? source?.trim() : existing.source,
        // Only Admin can reassign leads
        assignedEmployeeId: req.user.role === 'ADMIN' && assignedEmployeeId !== undefined
          ? assignedEmployeeId || null
          : existing.assignedEmployeeId,
        status: status !== undefined ? status : existing.status,
        tags: tags !== undefined ? (Array.isArray(tags) ? tags.join(',') : tags) : existing.tags,
        notes: notes !== undefined ? notes?.trim() : existing.notes,
        nextFollowupDate: nextFollowupDate !== undefined ? nextFollowupDate : existing.nextFollowupDate,
      },
      include: {
        assignedEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'LEAD_UPDATED',
      module: 'LEADS',
      description: `Updated lead ${updated.name} (Status: ${updated.status}).`,
      req,
    });

    return res.json({ success: true, message: 'Lead updated successfully.', lead: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Delete Lead
 */
export async function deleteLead(req, res) {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    // Only Admin can delete leads
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only administrators can delete leads.' });
    }

    await prisma.lead.delete({ where: { id } });

    await logActivity({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      action: 'LEAD_DELETED',
      module: 'LEADS',
      description: `Deleted lead ${lead.name} (${lead.leadNumber})`,
      req,
    });

    return res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
