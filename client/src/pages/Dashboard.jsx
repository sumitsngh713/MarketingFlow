import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import api from '../api/client.js';
import StatCard from '../components/common/StatCard.jsx';
import Badge from '../components/common/Badge.jsx';
import {
  Users,
  Clock,
  Target,
  Send,
  Mail,
  Linkedin,
  MessageSquare,
  CheckSquare,
  TrendingUp,
  UserCheck,
  UserX,
  Sparkles,
  ArrowRight,
  Play,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleTriggerQueue = async () => {
    setProcessingQueue(true);
    try {
      const res = await api.post('/campaigns/process-queue');
      if (res.success) {
        success(`Queue cycle complete! Dispatched ${res.summary.emailsDispatched} emails, ${res.summary.whatsAppDispatched} WhatsApp messages.`);
        fetchDashboard();
      }
    } catch (err) {
      error(err.message || 'Queue trigger failed.');
    } finally {
      setProcessingQueue(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingAttendance(true);
    try {
      const res = await api.post('/attendance/check-in');
      if (res.success) {
        success('Check-in marked successfully!');
        fetchDashboard();
      }
    } catch (err) {
      error(err.message || 'Check-in failed');
    } finally {
      setCheckingAttendance(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingAttendance(true);
    try {
      const res = await api.post('/attendance/check-out');
      if (res.success) {
        success('Check-out marked successfully!');
        fetchDashboard();
      }
    } catch (err) {
      error(err.message || 'Check-out failed');
    } finally {
      setCheckingAttendance(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const myAttendance = data?.myAttendance;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Workspace Overview</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Hello, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
            {isAdmin
              ? 'Complete organization pulse, workforce attendance, and unified marketing automation pipeline.'
              : 'Here is your daily attendance, assigned outreach tasks, and campaign follow-ups.'}
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {isAdmin ? (
            <>
              <button
                onClick={handleTriggerQueue}
                disabled={processingQueue}
                className="px-3.5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${processingQueue ? 'animate-spin' : ''}`} />
                <span>{processingQueue ? 'Dispatching...' : 'Dispatch Queue'}</span>
              </button>
              <button
                onClick={() => navigate('/campaigns')}
                className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Campaign</span>
              </button>
              <button
                onClick={() => navigate('/employees')}
                className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage Users</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/leads')}
                className="px-3.5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Lead</span>
              </button>
              <button
                onClick={() => navigate('/followups')}
                className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>View Follow-ups</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Employee Personal Attendance Widget (Prominent on Employee Dashboard) */}
      {!isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Today's Attendance
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-900">
                  Status: {myAttendance?.status || 'NOT CHECKED IN'}
                </span>
                {myAttendance?.status && (
                  <Badge status={myAttendance.status} size="md" />
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                <span>
                  Check In:{' '}
                  <strong>
                    {myAttendance?.checkInTime
                      ? new Date(myAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--'}
                  </strong>
                </span>
                <span>
                  Check Out:{' '}
                  <strong>
                    {myAttendance?.checkOutTime
                      ? new Date(myAttendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--'}
                  </strong>
                </span>
                <span>
                  Working Hours:{' '}
                  <strong>{myAttendance?.formattedWorkingHours || '0h 0m'}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!myAttendance || !myAttendance.checkInTime ? (
                <button
                  onClick={handleCheckIn}
                  disabled={checkingAttendance}
                  className="px-5 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>CHECK IN NOW</span>
                </button>
              ) : !myAttendance.checkOutTime ? (
                <button
                  onClick={handleCheckOut}
                  disabled={checkingAttendance}
                  className="px-5 py-2.5 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>CHECK OUT</span>
                </button>
              ) : (
                <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                  ✓ Attendance completed for today
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Key Performance Indicators
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {isAdmin ? (
            <>
              <StatCard
                title="Total Employees"
                value={kpis.totalEmployees}
                subtitle="Active Staff"
                icon={Users}
                color="indigo"
                onClick={() => navigate('/employees')}
              />
              <StatCard
                title="Present Today"
                value={kpis.presentToday}
                subtitle={`${kpis.attendancePercentage}% Attendance`}
                icon={UserCheck}
                color="emerald"
                onClick={() => navigate('/attendance')}
              />
              <StatCard
                title="Absent Today"
                value={kpis.absentToday}
                subtitle="Unreported / Leave"
                icon={UserX}
                color="rose"
                onClick={() => navigate('/attendance')}
              />
              <StatCard
                title="Attendance %"
                value={`${kpis.attendancePercentage}%`}
                subtitle="Daily Target 90%"
                icon={TrendingUp}
                color="blue"
                onClick={() => navigate('/attendance')}
              />
              <StatCard
                title="Total Leads"
                value={kpis.totalLeads}
                subtitle="CRM Database"
                icon={Target}
                color="sky"
                onClick={() => navigate('/leads')}
              />
              <StatCard
                title="Active Campaigns"
                value={kpis.activeCampaigns}
                subtitle="Email / WA / LI"
                icon={Send}
                color="purple"
                onClick={() => navigate('/campaigns')}
              />
              <StatCard
                title="Emails Sent"
                value={kpis.emailsSent}
                subtitle={`${kpis.emailReplies} Replies`}
                icon={Mail}
                color="sky"
                onClick={() => navigate('/email-outreach')}
              />
              <StatCard
                title="LinkedIn Sent"
                value={kpis.linkedInMessagesSent}
                subtitle={`${kpis.linkedInReplies} Replies`}
                icon={Linkedin}
                color="blue"
                onClick={() => navigate('/linkedin-outreach')}
              />
              <StatCard
                title="WhatsApp Sent"
                value={kpis.whatsAppMessagesSent}
                subtitle={`${kpis.whatsAppReplies} Replies`}
                icon={MessageSquare}
                color="emerald"
                onClick={() => navigate('/whatsapp-outreach')}
              />
              <StatCard
                title="Follow-ups Due"
                value={kpis.followupsDue}
                subtitle="Action Required"
                icon={CheckSquare}
                color="amber"
                onClick={() => navigate('/followups')}
              />
              <StatCard
                title="Replies Received"
                value={kpis.repliesReceived}
                subtitle="All Channels"
                icon={TrendingUp}
                color="emerald"
              />
              <StatCard
                title="Interested Leads"
                value={kpis.interestedLeads}
                subtitle="High Intent"
                icon={Sparkles}
                color="indigo"
                onClick={() => navigate('/leads?status=INTERESTED')}
              />
            </>
          ) : (
            <>
              <StatCard
                title="My Leads"
                value={kpis.totalLeads}
                subtitle="Assigned to me"
                icon={Target}
                color="sky"
                onClick={() => navigate('/leads')}
              />
              <StatCard
                title="Follow-ups Due"
                value={kpis.followupsDue}
                subtitle="Scheduled today"
                icon={CheckSquare}
                color="amber"
                onClick={() => navigate('/followups')}
              />
              <StatCard
                title="Active Campaigns"
                value={kpis.activeCampaigns}
                subtitle="Assigned runs"
                icon={Send}
                color="purple"
                onClick={() => navigate('/campaigns')}
              />
              <StatCard
                title="LinkedIn Sent"
                value={kpis.linkedInMessagesSent}
                subtitle="My outreach"
                icon={Linkedin}
                color="blue"
                onClick={() => navigate('/linkedin-outreach')}
              />
              <StatCard
                title="WhatsApp Sent"
                value={kpis.whatsAppMessagesSent}
                subtitle="My outreach"
                icon={MessageSquare}
                color="emerald"
                onClick={() => navigate('/whatsapp-outreach')}
              />
              <StatCard
                title="Interested Leads"
                value={kpis.interestedLeads}
                subtitle="Qualified"
                icon={Sparkles}
                color="indigo"
                onClick={() => navigate('/leads?status=INTERESTED')}
              />
            </>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Overview</h3>
              <p className="text-xs text-slate-500">Daily attendance trends for the past 7 days</p>
            </div>
            <button
              onClick={() => navigate('/attendance')}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              <span>Details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.attendance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Marketing Outreach Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Outreach & Response by Channel</h3>
              <p className="text-xs text-slate-500">Sent messages vs Replies across Email, LinkedIn, and WhatsApp</p>
            </div>
            <button
              onClick={() => navigate('/campaigns')}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              <span>Campaigns</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.outreach || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="sent" name="Messages Sent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="replies" name="Replies Received" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Log Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Workspace Activity</h3>
            <p className="text-xs text-slate-500">Real-time audit log of team actions and automation triggers</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/activity-logs')}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              <span>View Full Audit Log</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {(data?.recentActivities || []).length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No recent activity recorded
            </div>
          ) : (
            (data?.recentActivities || []).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Badge status={log.module} size="xs" />
                  <span className="font-semibold text-slate-800 truncate">
                    {log.userName || 'System'}
                  </span>
                  <span className="text-slate-500 truncate hidden sm:inline">
                    {log.description}
                  </span>
                </div>
                <div className="text-slate-400 whitespace-nowrap text-[11px]">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
