import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Badge from '../components/common/Badge.jsx';
import Modal from '../components/common/Modal.jsx';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Edit2,
  Filter,
  Users,
} from 'lucide-react';

export default function Attendance() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Admin Manual Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    checkInTime: '',
    checkOutTime: '',
    status: 'PRESENT',
    remarks: '',
  });

  const fetchData = async () => {
    try {
      // 1. Fetch current user's today attendance
      const todayRes = await api.get('/attendance/today');
      if (todayRes.success) {
        setTodayAttendance(todayRes.attendance);
      }

      // 2. If Admin, fetch all records with filters and employee list
      if (isAdmin) {
        const [allRes, empRes] = await Promise.all([
          api.get('/attendance', {
            params: {
              date: dateFilter,
              employeeId: employeeFilter,
              department: departmentFilter,
              status: statusFilter,
            },
          }),
          api.get('/users', { params: { role: 'EMPLOYEE' } }),
        ]);

        if (allRes.success) setRecords(allRes.records);
        if (empRes.success) setEmployees(empRes.users);
      } else {
        // Employee attendance history
        const myRes = await api.get('/attendance/my');
        if (myRes.success) setRecords(myRes.records);
      }
    } catch (err) {
      error('Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, employeeFilter, departmentFilter, statusFilter, isAdmin]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/check-in');
      if (res.success) {
        success(res.message);
        setTodayAttendance(res.attendance);
        fetchData();
      }
    } catch (err) {
      error(err.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/check-out');
      if (res.success) {
        success(res.message);
        setTodayAttendance(res.attendance);
        fetchData();
      }
    } catch (err) {
      error(err.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const openAdminEdit = (rec) => {
    setEditingRecord(rec);
    setEditForm({
      checkInTime: rec.checkInTime ? rec.checkInTime.slice(0, 16) : '',
      checkOutTime: rec.checkOutTime ? rec.checkOutTime.slice(0, 16) : '',
      status: rec.status,
      remarks: rec.remarks || '',
    });
    setIsEditModalOpen(true);
  };

  const handleAdminEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      const res = await api.put(`/attendance/${editingRecord.id}`, editForm);
      if (res.success) {
        success('Attendance manually updated by Admin.');
        setIsEditModalOpen(false);
        setEditingRecord(null);
        fetchData();
      }
    } catch (err) {
      error(err.message || 'Failed to update attendance.');
    }
  };

  // Export functions (CSV, Printable format)
  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Remarks'];
    const rows = records.map((r) => [
      r.user?.employeeId || user?.employeeId || '--',
      r.user ? `${r.user.firstName} ${r.user.lastName}` : `${user?.firstName} ${user?.lastName}`,
      r.user?.department || user?.department || '--',
      r.date,
      r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '--',
      r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : '--',
      r.formattedWorkingHours || '0h 0m',
      r.status,
      r.remarks || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Attendance CSV exported successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Attendance Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? 'Real-time daily workforce check-ins, working hours verification, and attendance audit.'
              : 'Record your daily check-in, track working hours, and review attendance history.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Today's Check-in / Check-out Punch Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              <span>Today's Time Card ({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xl font-bold text-slate-900">
                {todayAttendance?.checkInTime ? 'Checked In' : 'Not Checked In Yet'}
              </span>
              {todayAttendance && <Badge status={todayAttendance.status} size="md" />}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 text-xs text-slate-600">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Check-In Time</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {todayAttendance?.checkInTime
                    ? new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Check-Out Time</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {todayAttendance?.checkOutTime
                    ? new Date(todayAttendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Working Hours</div>
                <div className="text-sm font-bold text-brand-600 mt-0.5">
                  {todayAttendance?.formattedWorkingHours || '0h 0m'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!todayAttendance || !todayAttendance.checkInTime ? (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <Clock className="w-5 h-5" />
                <span>CHECK IN NOW</span>
              </button>
            ) : !todayAttendance.checkOutTime ? (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md shadow-amber-600/20 transition flex items-center gap-2"
              >
                <Clock className="w-5 h-5" />
                <span>CHECK OUT</span>
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Day Completed ({todayAttendance.formattedWorkingHours})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Filters Bar */}
      {isAdmin && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
            />

            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeId})
                </option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Executive">Executive</option>
              <option value="Support">Support</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>

          {(dateFilter || employeeFilter || departmentFilter || statusFilter) && (
            <button
              onClick={() => {
                setDateFilter('');
                setEmployeeFilter('');
                setDepartmentFilter('');
                setStatusFilter('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Attendance History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-semibold text-sm text-slate-900 flex items-center justify-between">
          <span>{isAdmin ? 'Organization Attendance Records' : 'My Attendance History'}</span>
          <span className="text-xs text-slate-400 font-normal">{records.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                {isAdmin && <th className="px-5 py-3">Employee</th>}
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Check In</th>
                <th className="px-5 py-3">Check Out</th>
                <th className="px-5 py-3">Working Hours</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Remarks</th>
                {isAdmin && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="py-12 text-center text-slate-400 text-sm">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">
                          {r.user?.firstName} {r.user?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.user?.employeeId} &bull; {r.user?.department}
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {r.checkInTime
                        ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {r.checkOutTime
                        ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {r.formattedWorkingHours || '0h 0m'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={r.status} size="xs" />
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {r.remarks || (r.manualOverride ? `Overridden by ${r.overriddenBy}` : '--')}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => openAdminEdit(r)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition flex items-center gap-1 ml-auto"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Manual Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Admin Manual Attendance Adjustment"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdminEditSubmit} className="space-y-4">
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Modifying record for <strong>{editingRecord?.user?.firstName} {editingRecord?.user?.lastName}</strong> on <strong>{editingRecord?.date}</strong>.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Check In Time</label>
            <input
              type="datetime-local"
              value={editForm.checkInTime}
              onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Check Out Time</label>
            <input
              type="datetime-local"
              value={editForm.checkOutTime}
              onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Reason</label>
            <textarea
              rows={2}
              value={editForm.remarks}
              onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
              placeholder="e.g. Approved leave / late due to transit emergency"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
            >
              Save Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
