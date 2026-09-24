import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useNotification } from '../context/NotificationContext.jsx';
import Badge from '../components/common/Badge.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmationModal from '../components/common/ConfirmationModal.jsx';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  KeyRound,
  UserCheck,
  UserX,
  Trash2,
  Copy,
  Check,
  Edit,
  Shield,
  Briefcase,
  Calendar,
} from 'lucide-react';

export default function Employees() {
  const { success, error } = useNotification();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Add / Edit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    designation: '',
    department: 'Sales',
    role: 'EMPLOYEE',
    joiningDate: new Date().toISOString().split('T')[0],
    password: '',
    status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);

  // Credentials Created / Reset Modal (shows temporary password to copy)
  const [credentialsModal, setCredentialsModal] = useState({
    isOpen: false,
    email: '',
    tempPassword: '',
    employeeId: '',
    name: '',
  });
  const [copied, setCopied] = useState(false);

  // Confirmation Modals
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [statusToggleModal, setStatusToggleModal] = useState({ isOpen: false, user: null, targetStatus: '' });

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users', {
        params: {
          search,
          role: roleFilter,
          status: statusFilter,
          department: deptFilter,
        },
      });
      if (res.success) {
        setEmployees(res.users);
      }
    } catch (err) {
      error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, roleFilter, statusFilter, deptFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/users', form);
      if (res.success) {
        setIsAddModalOpen(false);
        success('Employee created successfully!');
        // Open credentials display dialog
        setCredentialsModal({
          isOpen: true,
          email: res.user.email,
          tempPassword: res.temporaryPassword,
          employeeId: res.user.employeeId,
          name: `${res.user.firstName} ${res.user.lastName}`,
        });
        // Reset form
        setForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          employeeId: '',
          designation: '',
          department: 'Sales',
          role: 'EMPLOYEE',
          joiningDate: new Date().toISOString().split('T')[0],
          password: '',
          status: 'ACTIVE',
        });
        fetchEmployees();
      }
    } catch (err) {
      error(err.message || 'Failed to create employee.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/users/${editingUser.id}`, form);
      if (res.success) {
        success('Employee updated successfully!');
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchEmployees();
      }
    } catch (err) {
      error(err.message || 'Failed to update employee.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (emp) => {
    setEditingUser(emp);
    setForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      employeeId: emp.employeeId || '',
      designation: emp.designation || '',
      department: emp.department || 'Sales',
      role: emp.role,
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      status: emp.status,
    });
    setIsEditModalOpen(true);
  };

  const handleResetPassword = async (emp) => {
    try {
      const res = await api.post(`/users/${emp.id}/reset-password`);
      if (res.success) {
        success(`Password reset for ${emp.firstName}!`);
        setCredentialsModal({
          isOpen: true,
          email: emp.email,
          tempPassword: res.temporaryPassword,
          employeeId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
        });
      }
    } catch (err) {
      error(err.message || 'Failed to reset password.');
    }
  };

  const handleToggleStatusConfirm = async () => {
    const { user, targetStatus } = statusToggleModal;
    if (!user) return;
    try {
      const res = await api.patch(`/users/${user.id}/status`, { status: targetStatus });
      if (res.success) {
        success(res.message);
        setStatusToggleModal({ isOpen: false, user: null, targetStatus: '' });
        fetchEmployees();
      }
    } catch (err) {
      error(err.message || 'Failed to update user status.');
    }
  };

  const handleDeleteConfirm = async () => {
    const { user } = deleteModal;
    if (!user) return;
    try {
      const res = await api.delete(`/users/${user.id}`);
      if (res.success) {
        success('Employee account deleted successfully.');
        setDeleteModal({ isOpen: false, user: null });
        fetchEmployees();
      }
    } catch (err) {
      error(err.message || 'Failed to delete employee.');
    }
  };

  const copyCredentialsToClipboard = () => {
    const text = `MarketingFlow Login Credentials\nURL: ${window.location.origin}/login\nEmail: ${credentialsModal.email}\nTemporary Password: ${credentialsModal.tempPassword}\n\nPlease note you will be required to choose a new password upon first sign in.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Employee Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Administer team members, roles, designations, and account access.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              employeeId: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
              designation: '',
              department: 'Sales',
              role: 'EMPLOYEE',
              joiningDate: new Date().toISOString().split('T')[0],
              password: '',
              status: 'ACTIVE',
            });
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, ID..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Executive">Executive</option>
            <option value="Support">Support</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Employee ID</th>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Designation</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Last Login</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 text-sm">
                    No employees found matching the criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-mono font-medium text-slate-700">
                      {emp.employeeId || '--'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-slate-400 text-xs">{emp.email}</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {emp.phone || '--'}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {emp.designation || 'Staff'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {emp.department || '--'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={emp.role} size="xs" />
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={emp.status} size="xs" />
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {emp.lastLoginAt
                        ? new Date(emp.lastLoginAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Never'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(emp)}
                          title="Edit Employee"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(emp)}
                          title="Reset Password"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {emp.status === 'ACTIVE' ? (
                          <button
                            onClick={() => setStatusToggleModal({ isOpen: true, user: emp, targetStatus: 'DISABLED' })}
                            title="Disable Account"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setStatusToggleModal({ isOpen: true, user: emp, targetStatus: 'ACTIVE' })}
                            title="Enable Account"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, user: emp })}
                          title="Delete Employee"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Employee"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Alex"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Rivera"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="alex@organization.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 234-5678"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                placeholder="EMP-011"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Executive">Executive</option>
                <option value="Support">Support</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="Senior SDR / Account Executive"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Joining Date
              </label>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
            💡 <strong>Security Note:</strong> Initial login credentials will be securely generated and displayed for you to copy. The user will be required to change their password on first login.
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
              {submitting ? 'Creating...' : 'Create Employee Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Details"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID</label>
              <input
                type="text"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Executive">Executive</option>
                <option value="Support">Support</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Generated Credentials Dialog (Section 5: allow Admin to copy initial login credentials) */}
      <Modal
        isOpen={credentialsModal.isOpen}
        onClose={() => setCredentialsModal({ ...credentialsModal, isOpen: false })}
        title="Employee Login Credentials Generated"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Credentials for <strong>{credentialsModal.name}</strong> ({credentialsModal.employeeId}) have been generated. Copy and provide these to the employee:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 font-mono text-xs">
            <div>
              <span className="text-slate-400 select-none">Login URL: </span>
              <span className="text-slate-800 font-medium">{window.location.origin}/login</span>
            </div>
            <div>
              <span className="text-slate-400 select-none">Email: </span>
              <span className="text-slate-800 font-medium">{credentialsModal.email}</span>
            </div>
            <div>
              <span className="text-slate-400 select-none">Temp Password: </span>
              <span className="text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                {credentialsModal.tempPassword}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            ⚠️ The employee will be prompted to choose their own personal password upon their first login.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={copyCredentialsToClipboard}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCredentialsModal({ ...credentialsModal, isOpen: false })}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Toggle Modal */}
      <ConfirmationModal
        isOpen={statusToggleModal.isOpen}
        onClose={() => setStatusToggleModal({ isOpen: false, user: null, targetStatus: '' })}
        onConfirm={handleToggleStatusConfirm}
        title={`${statusToggleModal.targetStatus === 'DISABLED' ? 'Disable' : 'Enable'} Employee Account`}
        message={`Are you sure you want to ${statusToggleModal.targetStatus === 'DISABLED' ? 'disable' : 'enable'} the account for ${statusToggleModal.user?.firstName} ${statusToggleModal.user?.lastName}? ${statusToggleModal.targetStatus === 'DISABLED' ? 'They will no longer be able to log in.' : 'They will regain access to their account.'}`}
        confirmText={statusToggleModal.targetStatus === 'DISABLED' ? 'Disable Account' : 'Enable Account'}
        isDanger={statusToggleModal.targetStatus === 'DISABLED'}
      />

      {/* Delete User Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee Account"
        message={`Are you sure you want to permanently delete the account for ${deleteModal.user?.firstName} ${deleteModal.user?.lastName}? This action cannot be undone.`}
        confirmText="Delete Account"
        isDanger={true}
      />
    </div>
  );
}
