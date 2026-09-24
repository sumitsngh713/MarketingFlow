import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useNotification } from '../context/NotificationContext.jsx';
import Badge from '../components/common/Badge.jsx';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Users,
  Clock,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export default function Reports() {
  const { success, error } = useNotification();

  // Active Report Tab: 'performance' | 'attendance' | 'marketing'
  const [activeTab, setActiveTab] = useState('performance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [performanceData, setPerformanceData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [marketingData, setMarketingData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      if (activeTab === 'performance') {
        const res = await api.get('/reports/performance');
        if (res.success) setPerformanceData(res.report);
      } else if (activeTab === 'attendance') {
        const res = await api.get('/reports/attendance', { params: { startDate, endDate } });
        if (res.success) setAttendanceData(res.report);
      } else if (activeTab === 'marketing') {
        const res = await api.get('/reports/marketing');
        if (res.success) setMarketingData(res.report);
      }
    } catch (err) {
      error('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, startDate, endDate]);

  const exportCurrentReportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (activeTab === 'performance') {
      filename = `Employee_Performance_${new Date().toISOString().split('T')[0]}.csv`;
      headers = [
        'Employee ID',
        'Employee Name',
        'Department',
        'Leads Assigned',
        'Emails Sent',
        'Emails Replied',
        'LinkedIn Outreach',
        'LinkedIn Replies',
        'WhatsApp Messages',
        'WhatsApp Replies',
        'Interested Leads',
        'Converted Leads',
      ];
      rows = performanceData.map((d) => [
        d.employeeId,
        d.name,
        d.department,
        d.leadsAssigned,
        d.emailsSent,
        d.emailsReplied,
        d.linkedInOutreach,
        d.linkedInReplies,
        d.whatsAppMessages,
        d.whatsAppReplies,
        d.interestedLeads,
        d.convertedLeads,
      ]);
    } else if (activeTab === 'attendance') {
      filename = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Employee ID', 'Name', 'Department', 'Working Days', 'Present', 'Absent', 'Leave', 'Late', 'Attendance %'];
      rows = attendanceData.map((d) => [
        d.employeeId,
        d.name,
        d.department,
        d.workingDays,
        d.present,
        d.absent,
        d.leave,
        d.late,
        `${d.attendancePercent}%`,
      ]);
    } else if (activeTab === 'marketing') {
      filename = `Marketing_Campaign_Report_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Campaign Name', 'Channel', 'Status', 'Total Leads', 'Messages Sent', 'Delivered', 'Replies', 'Interested', 'Converted', 'Reply %', 'Conversion %'];
      rows = marketingData.map((d) => [
        d.campaign,
        d.channel,
        d.status,
        d.leads,
        d.sent,
        d.delivered,
        d.replies,
        d.interested,
        d.converted,
        `${d.replyPercent}%`,
        `${d.conversionPercent}%`,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${val}"`).join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Report exported to CSV successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Executive Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Factual performance metrics, workforce attendance trends, and campaign conversions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCurrentReportCSV}
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

      {/* Report Selection Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('performance')}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'performance'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Productivity</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Attendance & Punctuality</span>
        </button>

        <button
          onClick={() => setActiveTab('marketing')}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'marketing'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Marketing Attribution</span>
        </button>
      </div>

      {/* Date Filter Bar for Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 flex-wrap">
          <div className="text-xs font-semibold text-slate-700">Date Range Filter:</div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-700"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-700"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-brand-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* REPORT CONTENT TABLES */}

      {/* 1. Employee Performance Report */}
      {activeTab === 'performance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3 text-center">Leads Assigned</th>
                  <th className="px-5 py-3 text-center">Emails Sent</th>
                  <th className="px-5 py-3 text-center">Email Replies</th>
                  <th className="px-5 py-3 text-center">LinkedIn Outreach</th>
                  <th className="px-5 py-3 text-center">LinkedIn Replies</th>
                  <th className="px-5 py-3 text-center">WhatsApp Sent</th>
                  <th className="px-5 py-3 text-center">WhatsApp Replies</th>
                  <th className="px-5 py-3 text-center">Interested</th>
                  <th className="px-5 py-3 text-center">Converted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {performanceData.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      <div>{emp.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {emp.employeeId} &bull; {emp.department}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-slate-800">
                      {emp.leadsAssigned}
                    </td>
                    <td className="px-5 py-3 text-center font-medium text-sky-600">
                      {emp.emailsSent}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-emerald-600">
                      {emp.emailsReplied}
                    </td>
                    <td className="px-5 py-3 text-center font-medium text-blue-600">
                      {emp.linkedInOutreach}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-emerald-600">
                      {emp.linkedInReplies}
                    </td>
                    <td className="px-5 py-3 text-center font-medium text-emerald-600">
                      {emp.whatsAppMessages}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-emerald-600">
                      {emp.whatsAppReplies}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-indigo-600 bg-indigo-50/30">
                      {emp.interestedLeads}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-emerald-700 bg-emerald-50/30">
                      {emp.convertedLeads}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Attendance Report */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3 text-center">Working Days</th>
                  <th className="px-5 py-3 text-center">Present</th>
                  <th className="px-5 py-3 text-center">Late</th>
                  <th className="px-5 py-3 text-center">Leave</th>
                  <th className="px-5 py-3 text-center">Absent</th>
                  <th className="px-5 py-3 text-center">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceData.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      <div>{emp.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {emp.employeeId} &bull; {emp.department}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-slate-800">
                      {emp.workingDays}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-emerald-600">
                      {emp.present}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-amber-600">
                      {emp.late}
                    </td>
                    <td className="px-5 py-3 text-center font-medium text-purple-600">
                      {emp.leave}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-rose-600">
                      {emp.absent}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          emp.attendancePercent >= 90
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.attendancePercent >= 80
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {emp.attendancePercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Marketing Report */}
      {activeTab === 'marketing' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3 text-center">Target Leads</th>
                  <th className="px-5 py-3 text-center">Sent</th>
                  <th className="px-5 py-3 text-center">Delivered</th>
                  <th className="px-5 py-3 text-center">Replies</th>
                  <th className="px-5 py-3 text-center">Interested</th>
                  <th className="px-5 py-3 text-center">Reply %</th>
                  <th className="px-5 py-3 text-center">Conversion %</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marketingData.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-semibold text-slate-900">{c.campaign}</td>
                    <td className="px-5 py-3 font-medium text-xs text-slate-700">{c.channel}</td>
                    <td className="px-5 py-3 text-center font-bold text-slate-800">{c.leads}</td>
                    <td className="px-5 py-3 text-center font-medium text-sky-600">{c.sent}</td>
                    <td className="px-5 py-3 text-center font-medium text-teal-600">{c.delivered}</td>
                    <td className="px-5 py-3 text-center font-bold text-emerald-600">{c.replies}</td>
                    <td className="px-5 py-3 text-center font-bold text-indigo-600">{c.interested}</td>
                    <td className="px-5 py-3 text-center font-bold text-slate-800">{c.replyPercent}%</td>
                    <td className="px-5 py-3 text-center font-bold text-brand-600">{c.conversionPercent}%</td>
                    <td className="px-5 py-3">
                      <Badge status={c.status} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
