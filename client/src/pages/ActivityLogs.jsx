import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useNotification } from '../context/NotificationContext.jsx';
import Badge from '../components/common/Badge.jsx';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
} from 'lucide-react';

export default function ActivityLogs() {
  const { error } = useNotification();

  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.get('/activity-logs', {
        params: {
          module: moduleFilter,
          action: actionFilter,
          employeeId: employeeFilter,
          startDate,
          endDate,
        },
      });
      if (res.success) {
        setLogs(res.logs);
      }
    } catch (err) {
      error('Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/users');
      if (res.success) setEmployees(res.users);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, actionFilter, employeeFilter, startDate, endDate]);

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          System Activity & Audit Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Immutable event log tracking all authentication, user modifications, campaign executions, and attendance actions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Modules</option>
            <option value="AUTH">Auth</option>
            <option value="EMPLOYEES">Employees</option>
            <option value="ATTENDANCE">Attendance</option>
            <option value="LEADS">Leads & CRM</option>
            <option value="CAMPAIGNS">Campaigns</option>
            <option value="OUTREACH">Outreach</option>
            <option value="SETTINGS">Settings</option>
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Users</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-700"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-700"
            />
          </div>
        </div>

        {(moduleFilter || actionFilter || employeeFilter || startDate || endDate) && (
          <button
            onClick={() => {
              setModuleFilter('');
              setActionFilter('');
              setEmployeeFilter('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-brand-600 hover:underline font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-semibold text-sm text-slate-900 flex items-center justify-between">
          <span>{logs.length} Recorded Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Module</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                    No activity logs found for the selected period.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {log.userName || 'System'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Badge status={log.role || 'SYSTEM'} size="xs" />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-semibold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600 max-w-md">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
