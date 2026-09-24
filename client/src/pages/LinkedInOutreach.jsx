import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Badge from '../components/common/Badge.jsx';
import {
  Linkedin,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Send,
  UserCheck,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';

export default function LinkedInOutreach() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/linkedin/queue', {
        params: { status: statusFilter },
      });
      if (res.success) {
        setQueue(res.items);
      }
    } catch (err) {
      error('Failed to load LinkedIn outreach items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const copyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Personalized message copied to clipboard!');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/linkedin/queue/${id}`, { status });
      if (res.success) {
        success(`Status updated to ${status.replace(/_/g, ' ')}!`);
        fetchQueue();
      }
    } catch (err) {
      error(err.message || 'Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            LinkedIn User-Assisted Outreach
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Safe, platform-compliant LinkedIn messaging queue. Protects account integrity without brittle bots.
          </p>
        </div>
      </div>

      {/* Compliance Information Card */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-blue-950">Compliant Integration Architecture</div>
          <p className="leading-relaxed">
            In adherence to LinkedIn terms of service and account safety rules, this module operates in a <strong>User-Assisted Workflow mode</strong>. Click <strong>Open LinkedIn Profile</strong> to open the target prospect in a new tab, then click <strong>Copy Message</strong> to copy the personalized template with 1 click, and mark your progress. No CAPTCHAs, no risk of account restriction.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="NOT_CONTACTED">Not Contacted</option>
            <option value="CONNECTION_REQUESTED">Connection Requested</option>
            <option value="CONNECTED">Connected</option>
            <option value="MESSAGE_SENT">Message Sent</option>
            <option value="FOLLOW_UP_DUE">Follow-up Due</option>
            <option value="REPLIED">Replied</option>
            <option value="INTERESTED">Interested</option>
            <option value="NOT_INTERESTED">Not Interested</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {queue.length} Queue Items
        </div>
      </div>

      {/* LinkedIn Outreach Queue Cards */}
      <div className="space-y-3">
        {queue.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400 text-sm">
            No LinkedIn outreach items in queue.
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{item.lead?.name}</h3>
                    <Badge status={item.status} size="xs" />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.lead?.designation || 'Executive'} &bull; <strong>{item.lead?.company || 'Company'}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.lead?.linkedinUrl ? (
                    <a
                      href={item.lead.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>Open LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No LinkedIn URL</span>
                  )}
                </div>
              </div>

              {/* Message Box */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 relative group">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Personalized Outreach Message</span>
                  <button
                    onClick={() => copyMessage(item.id, item.messageText)}
                    className="text-brand-600 hover:text-brand-800 font-semibold text-xs flex items-center gap-1"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === item.id ? 'Copied!' : 'Copy Message'}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
                  {item.messageText}
                </div>
              </div>

              {/* Status Update Quick Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs">
                <span className="text-slate-400 font-medium">Update Status:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => updateStatus(item.id, 'CONNECTION_REQUESTED')}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  >
                    Connection Sent
                  </button>
                  <button
                    onClick={() => updateStatus(item.id, 'CONNECTED')}
                    className="px-2.5 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 font-medium border border-sky-200"
                  >
                    Connected
                  </button>
                  <button
                    onClick={() => updateStatus(item.id, 'MESSAGE_SENT')}
                    className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium border border-blue-200"
                  >
                    Message Sent
                  </button>
                  <button
                    onClick={() => updateStatus(item.id, 'REPLIED')}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium border border-emerald-200"
                  >
                    Replied
                  </button>
                  <button
                    onClick={() => updateStatus(item.id, 'INTERESTED')}
                    className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold border border-indigo-200"
                  >
                    Interested ★
                  </button>
                  <button
                    onClick={() => updateStatus(item.id, 'NOT_INTERESTED')}
                    className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium"
                  >
                    Not Interested
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
