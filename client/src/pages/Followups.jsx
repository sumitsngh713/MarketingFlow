import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Badge from '../components/common/Badge.jsx';
import Modal from '../components/common/Modal.jsx';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  Mail,
  Linkedin,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  Building,
  User,
  AlertCircle,
} from 'lucide-react';

export default function Followups() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timeframe filter tabs: today, tomorrow, overdue, this_week, all
  const [timeframe, setTimeframe] = useState('today');
  const [channelFilter, setChannelFilter] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Add Follow-up Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({
    leadId: '',
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    channel: 'EMAIL',
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchFollowups = async () => {
    try {
      const res = await api.get('/followups', {
        params: {
          timeframe: timeframe === 'all' ? undefined : timeframe,
          channel: channelFilter || undefined,
          completed: showCompleted ? undefined : false,
        },
      });
      if (res.success) {
        setFollowups(res.followups);
      }
    } catch (err) {
      error('Failed to load follow-ups.');
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const res = await api.get('/leads');
      if (res.success) {
        setLeads(res.leads);
        if (res.leads[0]) {
          setForm((prev) => ({ ...prev, leadId: res.leads[0].id }));
        }
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [timeframe, channelFilter, showCompleted]);

  const handleComplete = async (id) => {
    try {
      const res = await api.patch(`/followups/${id}/complete`, { remarks: 'Marked complete from dashboard' });
      if (res.success) {
        success('Follow-up marked as completed!');
        fetchFollowups();
      }
    } catch (err) {
      error(err.message || 'Failed to complete follow-up.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.leadId || !form.title) return;
    setSubmitting(true);
    try {
      const res = await api.post('/followups', form);
      if (res.success) {
        success('Follow-up scheduled successfully!');
        setIsAddModalOpen(false);
        setForm({
          leadId: leads[0]?.id || '',
          title: '',
          dueDate: new Date().toISOString().split('T')[0],
          channel: 'EMAIL',
          remarks: '',
        });
        fetchFollowups();
      }
    } catch (err) {
      error(err.message || 'Failed to create follow-up.');
    } finally {
      setSubmitting(false);
    }
  };

  const getChannelIcon = (ch) => {
    switch (ch) {
      case 'EMAIL': return <Mail className="w-4 h-4 text-sky-500" />;
      case 'LINKEDIN': return <Linkedin className="w-4 h-4 text-blue-600" />;
      case 'WHATSAPP': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'CALL': return <PhoneCall className="w-4 h-4 text-amber-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Follow-Up & Task Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Prioritize daily touchpoints, prospect reviews, and pipeline progression.
          </p>
        </div>

        <button
          onClick={() => {
            loadLeads();
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Follow-Up</span>
        </button>
      </div>

      {/* Filter Tabs & Channels */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Timeframe Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'today', label: 'Today' },
            { id: 'tomorrow', label: 'Tomorrow' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'this_week', label: 'This Week' },
            { id: 'all', label: 'All Upcoming' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeframe(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Channels</option>
            <option value="EMAIL">Email</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="CALL">Phone Call</option>
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span>Include Completed</span>
          </label>
        </div>
      </div>

      {/* Follow-up Items List */}
      <div className="space-y-3">
        {followups.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400 text-sm">
            No follow-ups due for the selected filter. Great job staying ahead of schedule!
          </div>
        ) : (
          followups.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                item.completed ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <button
                  onClick={() => !item.completed && handleComplete(item.id)}
                  disabled={item.completed}
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition flex-shrink-0 ${
                    item.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 hover:border-brand-600 hover:bg-brand-50'
                  }`}
                  title={item.completed ? 'Completed' : 'Click to complete'}
                >
                  {item.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold text-slate-900 truncate ${item.completed ? 'line-through text-slate-400' : ''}`}>
                      {item.title}
                    </span>
                    <Badge status={item.channel} size="xs" />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.lead?.name}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.lead?.company || 'Company'}</span>
                    </span>
                    {isAdmin && item.assignedEmployee && (
                      <span className="text-brand-600 font-medium">
                        &bull; Rep: {item.assignedEmployee.firstName} {item.assignedEmployee.lastName}
                      </span>
                    )}
                  </div>

                  {item.remarks && (
                    <div className="text-xs text-slate-400 italic">
                      "{item.remarks}"
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date & Action */}
              <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.dueDate}</span>
                  </div>
                  {item.completed && (
                    <div className="text-[10px] text-emerald-600 font-medium">Completed</div>
                  )}
                </div>

                {!item.completed && (
                  <button
                    onClick={() => handleComplete(item.id)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>Mark Done</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Prospect Follow-Up"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Lead *</label>
            <select
              value={form.leadId}
              required
              onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} &bull; {l.company || 'Private'} ({l.leadNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-Up Task Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Call regarding revised proposal & security questions"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="EMAIL">Email</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="CALL">Phone Call</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Context</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Context or talking points..."
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
              {submitting ? 'Scheduling...' : 'Save Follow-Up'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
