import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Badge from '../components/common/Badge.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmationModal from '../components/common/ConfirmationModal.jsx';
import {
  Target,
  Plus,
  Search,
  Upload,
  Download,
  Linkedin,
  MessageSquare,
  Mail,
  Phone,
  UserCheck,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  Building,
  ExternalLink,
} from 'lucide-react';

export default function Leads() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  // Add / Edit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [leadForm, setLeadForm] = useState({
    name: '',
    designation: '',
    company: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    whatsappNumber: '',
    website: '',
    industry: '',
    location: '',
    source: 'Manual',
    assignedEmployeeId: '',
    status: 'NEW',
    notes: '',
    nextFollowupDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // CSV Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, lead: null });

  const fetchLeads = async () => {
    try {
      const params = {
        search,
        status: statusFilter,
        industry: industryFilter,
      };
      if (isAdmin && assignedFilter) {
        params.assignedEmployeeId = assignedFilter;
      }

      const res = await api.get('/leads', { params });
      if (res.success) {
        setLeads(res.leads);
      }
    } catch (err) {
      error('Failed to load leads.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/users', { params: { role: 'EMPLOYEE' } });
      if (res.success) {
        setEmployees(res.users);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, assignedFilter, industryFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [isAdmin]);

  // Check duplicate on blur
  const checkDuplicateLead = async () => {
    if (!leadForm.email && !leadForm.phone && (!leadForm.company || !leadForm.name)) return;
    try {
      const res = await api.post('/leads/check-duplicates', {
        email: leadForm.email,
        phone: leadForm.phone,
        company: leadForm.company,
        name: leadForm.name,
      });
      if (res.success && res.hasDuplicate) {
        const d = res.duplicates[0];
        setDuplicateWarning(`Potential duplicate found: ${d.name} from ${d.company || 'Unknown'} (${d.leadNumber})`);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/leads', leadForm);
      if (res.success) {
        success(`Lead ${res.lead.leadNumber} created successfully!`);
        setIsAddModalOpen(false);
        setDuplicateWarning(null);
        resetForm();
        fetchLeads();
      }
    } catch (err) {
      error(err.message || 'Failed to create lead.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingLead) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/leads/${editingLead.id}`, leadForm);
      if (res.success) {
        success('Lead updated successfully!');
        setIsEditModalOpen(false);
        setEditingLead(null);
        fetchLeads();
      }
    } catch (err) {
      error(err.message || 'Failed to update lead.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setLeadForm({
      name: lead.name,
      designation: lead.designation || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      linkedinUrl: lead.linkedinUrl || '',
      whatsappNumber: lead.whatsappNumber || '',
      website: lead.website || '',
      industry: lead.industry || '',
      location: lead.location || '',
      source: lead.source || 'Manual',
      assignedEmployeeId: lead.assignedEmployeeId || '',
      status: lead.status,
      notes: lead.notes || '',
      nextFollowupDate: lead.nextFollowupDate || '',
    });
    setDuplicateWarning(null);
    setIsEditModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const { lead } = deleteModal;
    if (!lead) return;
    try {
      const res = await api.delete(`/leads/${lead.id}`);
      if (res.success) {
        success('Lead deleted successfully.');
        setDeleteModal({ isOpen: false, lead: null });
        fetchLeads();
      }
    } catch (err) {
      error(err.message || 'Failed to delete lead.');
    }
  };

  const resetForm = () => {
    setLeadForm({
      name: '',
      designation: '',
      company: '',
      email: '',
      phone: '',
      linkedinUrl: '',
      whatsappNumber: '',
      website: '',
      industry: '',
      location: '',
      source: 'Manual',
      assignedEmployeeId: '',
      status: 'NEW',
      notes: '',
      nextFollowupDate: '',
    });
  };

  // CSV Import Parser
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importText.trim()) return;

    setImporting(true);
    try {
      const lines = importText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('Please include at least a header row and one lead row.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const parsedLeads = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // Simple CSV splitter
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const leadObj = {};

        headers.forEach((h, idx) => {
          const val = cols[idx] || '';
          if (h.includes('name')) leadObj.name = val;
          else if (h.includes('desig') || h.includes('title')) leadObj.designation = val;
          else if (h.includes('comp')) leadObj.company = val;
          else if (h.includes('email')) leadObj.email = val;
          else if (h.includes('phone')) leadObj.phone = val;
          else if (h.includes('link')) leadObj.linkedinUrl = val;
          else if (h.includes('what') || h.includes('wa')) leadObj.whatsappNumber = val;
          else if (h.includes('loc') || h.includes('city')) leadObj.location = val;
          else if (h.includes('ind')) leadObj.industry = val;
        });

        if (leadObj.name) parsedLeads.push(leadObj);
      }

      const res = await api.post('/leads/import', { leads: parsedLeads });
      if (res.success) {
        setImportSummary(res);
        success(`Import completed! ${res.imported} imported, ${res.skippedDuplicates} duplicates skipped.`);
        fetchLeads();
      }
    } catch (err) {
      error(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const loadSampleCSV = () => {
    const sample = `Name,Designation,Company,Email,Phone,LinkedIn URL,WhatsApp Number,Location,Industry
Robert Taylor,VP Technology,Apex Robotics,robert.t@apexrobotics.io,+15554321098,https://linkedin.com/in/rtaylor,+15554321098,Austin TX,Robotics
Samantha Vance,Chief Marketing Officer,NovaRetail Global,samantha@novaretail.io,+15559876543,https://linkedin.com/in/svance,+15559876543,New York NY,E-Commerce`;
    setImportText(sample);
  };

  const exportLeadsCSV = () => {
    const headers = ['Lead Number', 'Name', 'Company', 'Designation', 'Email', 'Phone', 'Industry', 'Location', 'Status', 'Assigned Rep'];
    const rows = leads.map((l) => [
      l.leadNumber || '',
      l.name,
      l.company || '',
      l.designation || '',
      l.email || '',
      l.phone || '',
      l.industry || '',
      l.location || '',
      l.status,
      l.assignedEmployee ? `${l.assignedEmployee.firstName} ${l.assignedEmployee.lastName}` : 'Unassigned',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${val}"`).join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `MarketingFlow_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Leads CSV exported!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Lead Management & CRM
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? 'Complete multi-rep pipeline, duplicate detection, and outreach qualification.'
              : 'Your assigned sales leads, follow-ups, and customer touchpoints.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setImportSummary(null);
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={exportLeadsCSV}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setDuplicateWarning(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, email, title..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="INTERESTED">Interested</option>
            <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
            <option value="PROPOSAL_SENT">Proposal Sent</option>
            <option value="CONVERTED">Converted</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="DO_NOT_CONTACT">Do Not Contact</option>
          </select>

          {isAdmin && (
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="">All Assigned Reps</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          )}

          {(search || statusFilter || assignedFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setAssignedFilter('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-semibold text-sm text-slate-900 flex items-center justify-between">
          <span>{leads.length} Leads Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Lead ID</th>
                <th className="px-5 py-3">Lead / Company</th>
                <th className="px-5 py-3">Direct Contact</th>
                <th className="px-5 py-3">Channels</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assigned Rep</th>
                <th className="px-5 py-3">Next Follow-Up</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 text-sm">
                    No leads found matching current filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {lead.leadNumber || '--'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">{lead.name}</div>
                      <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{lead.company || 'Private'}</span>
                        {lead.designation && <span className="text-slate-400">&bull; {lead.designation}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {lead.email ? (
                        <div className="text-slate-800 font-medium">{lead.email}</div>
                      ) : (
                        <div className="text-slate-400">No email</div>
                      )}
                      {lead.phone && <div className="text-slate-500 text-[11px] mt-0.5">{lead.phone}</div>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {lead.linkedinUrl ? (
                          <a
                            href={lead.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            title="LinkedIn Profile"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        ) : null}
                        {lead.whatsappNumber ? (
                          <a
                            href={`https://wa.me/${lead.whatsappNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            title="WhatsApp Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={lead.status} size="xs" />
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-700 whitespace-nowrap">
                      {lead.assignedEmployee ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                            {lead.assignedEmployee.firstName[0]}
                          </div>
                          <span>
                            {lead.assignedEmployee.firstName} {lead.assignedEmployee.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {lead.nextFollowupDate ? (
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lead.nextFollowupDate}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">None set</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(lead)}
                          title="Edit Lead"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, lead })}
                            title="Delete Lead"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Lead"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>{duplicateWarning}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Name *</label>
              <input
                type="text"
                required
                value={leadForm.name}
                onBlur={checkDuplicateLead}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                placeholder="David Miller"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company *</label>
              <input
                type="text"
                value={leadForm.company}
                onBlur={checkDuplicateLead}
                onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                placeholder="Apex Cloud Systems"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Title</label>
              <input
                type="text"
                value={leadForm.designation}
                onChange={(e) => setLeadForm({ ...leadForm, designation: e.target.value })}
                placeholder="Chief Technology Officer"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                value={leadForm.email}
                onBlur={checkDuplicateLead}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                placeholder="david@apex.io"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={leadForm.phone}
                onBlur={checkDuplicateLead}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                placeholder="+1 555 300 1000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number</label>
              <input
                type="tel"
                value={leadForm.whatsappNumber}
                onChange={(e) => setLeadForm({ ...leadForm, whatsappNumber: e.target.value })}
                placeholder="+15553001000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                value={leadForm.linkedinUrl}
                onChange={(e) => setLeadForm({ ...leadForm, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/david-miller"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={leadForm.website}
                onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
                placeholder="https://apex.io"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                value={leadForm.industry}
                onChange={(e) => setLeadForm({ ...leadForm, industry: e.target.value })}
                placeholder="Cloud Infrastructure"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={leadForm.location}
                onChange={(e) => setLeadForm({ ...leadForm, location: e.target.value })}
                placeholder="Austin, TX"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={leadForm.status}
                onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="INTERESTED">Interested</option>
                <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="CONVERTED">Converted</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="DO_NOT_CONTACT">Do Not Contact</option>
              </select>
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Employee</label>
              <select
                value={leadForm.assignedEmployeeId}
                onChange={(e) => setLeadForm({ ...leadForm, assignedEmployeeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">Leave Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Next Follow-Up Date</label>
            <input
              type="date"
              value={leadForm.nextFollowupDate}
              onChange={(e) => setLeadForm({ ...leadForm, nextFollowupDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Background</label>
            <textarea
              rows={2}
              value={leadForm.notes}
              onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
              placeholder="Key pain points, conversation notes, tech stack..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
            >
              {submitting ? 'Saving...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Lead Information"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Name *</label>
              <input
                type="text"
                required
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
              <input
                type="text"
                value={leadForm.company}
                onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={leadForm.designation}
                onChange={(e) => setLeadForm({ ...leadForm, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={leadForm.status}
                onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="INTERESTED">Interested</option>
                <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="CONVERTED">Converted</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="DO_NOT_CONTACT">Do Not Contact</option>
              </select>
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Employee</label>
              <select
                value={leadForm.assignedEmployeeId}
                onChange={(e) => setLeadForm({ ...leadForm, assignedEmployeeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Next Follow-Up Date</label>
            <input
              type="date"
              value={leadForm.nextFollowupDate}
              onChange={(e) => setLeadForm({ ...leadForm, nextFollowupDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={leadForm.notes}
              onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
            >
              {submitting ? 'Saving...' : 'Save Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Leads via CSV Data"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Paste comma-separated data below. Columns supported: <code>Name, Designation, Company, Email, Phone, LinkedIn URL, WhatsApp Number, Location, Industry</code>.
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">CSV Text</span>
            <button
              type="button"
              onClick={loadSampleCSV}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
            >
              Paste Sample Template
            </button>
          </div>

          <textarea
            rows={7}
            required
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`Name,Designation,Company,Email,Phone,LinkedIn URL,WhatsApp Number,Location,Industry\nJohn Doe,CEO,Acme Inc,john@acme.com,+15551234567,https://linkedin.com/in/johndoe,+15551234567,Chicago IL,Manufacturing`}
            className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            🔍 <strong>Automatic Duplicate Detection:</strong> Rows matching existing leads by Email, Phone, or Company + Name will be automatically skipped and recorded.
          </div>

          {importSummary && (
            <div className="text-xs p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              ✓ Successfully imported {importSummary.imported} leads! {importSummary.skippedDuplicates} duplicates were safely skipped.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={importing}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
            >
              {importing ? 'Processing Import...' : 'Import Leads'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Lead Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, lead: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Lead"
        message={`Are you sure you want to permanently delete lead ${deleteModal.lead?.name} (${deleteModal.lead?.leadNumber})? This will also remove associated campaign history.`}
        confirmText="Delete Lead"
        isDanger={true}
      />
    </div>
  );
}
