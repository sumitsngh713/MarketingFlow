import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Badge from '../components/common/Badge.jsx';
import Modal from '../components/common/Modal.jsx';
import {
  Send,
  Plus,
  Play,
  Pause,
  Copy,
  BarChart2,
  RefreshCw,
  Mail,
  Linkedin,
  MessageSquare,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function Campaigns() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processingQueue, setProcessingQueue] = useState(false);

  // Create Campaign Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [form, setForm] = useState({
    name: '',
    channel: 'EMAIL',
    senderAccountId: '',
    subject: '',
    body: '',
    intervalMinutes: 5,
    dailyLimit: 50,
    sequences: [
      { stepNumber: 1, delayDays: 3, subject: 'Re: Follow-up regarding {{company}}', body: 'Hi {{first_name}},\n\nWanted to quickly follow up on my previous message. Are you available for a brief discussion this week?\n\nBest,\n{{employee_name}}' },
      { stepNumber: 2, delayDays: 7, subject: '{{company}} growth initiative', body: 'Hi {{first_name}},\n\nSharing a quick update on how teams in {{industry}} are scaling their operations.\n\nRegards,\n{{employee_name}}' },
    ],
  });
  const [submitting, setSubmitting] = useState(false);

  // Analytics Modal
  const [analyticsModal, setAnalyticsModal] = useState({
    isOpen: false,
    campaign: null,
    analytics: null,
    loading: false,
  });

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns', {
        params: { channel: channelFilter, status: statusFilter },
      });
      if (res.success) {
        setCampaigns(res.campaigns);
      }
    } catch (err) {
      error('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [channelFilter, statusFilter]);

  const loadDependenciesForCreate = async () => {
    try {
      const [leadsRes, emailRes] = await Promise.all([
        api.get('/leads'),
        api.get('/email/accounts').catch(() => ({ accounts: [] })),
      ]);

      if (leadsRes.success) setLeads(leadsRes.leads);
      if (emailRes.accounts) setEmailAccounts(emailRes.accounts);
      if (emailRes.accounts?.[0]) {
        setForm((prev) => ({ ...prev, senderAccountId: emailRes.accounts[0].id }));
      }
    } catch (e) {
      // ignore
    }
  };

  const handleStart = async (campaign) => {
    try {
      const res = await api.post(`/campaigns/${campaign.id}/start`);
      if (res.success) {
        success(`Campaign "${campaign.name}" started!`);
        fetchCampaigns();
      }
    } catch (err) {
      error(err.message || 'Failed to start campaign.');
    }
  };

  const handlePause = async (campaign) => {
    try {
      const res = await api.post(`/campaigns/${campaign.id}/pause`);
      if (res.success) {
        success(`Campaign "${campaign.name}" paused.`);
        fetchCampaigns();
      }
    } catch (err) {
      error(err.message || 'Failed to pause campaign.');
    }
  };

  const handleDuplicate = async (campaign) => {
    try {
      const res = await api.post(`/campaigns/${campaign.id}/duplicate`);
      if (res.success) {
        success('Campaign duplicated as Draft!');
        fetchCampaigns();
      }
    } catch (err) {
      error(err.message || 'Failed to duplicate campaign.');
    }
  };

  const openAnalytics = async (campaign) => {
    setAnalyticsModal({ isOpen: true, campaign, analytics: null, loading: true });
    try {
      const res = await api.get(`/campaigns/${campaign.id}`);
      if (res.success) {
        setAnalyticsModal({
          isOpen: true,
          campaign: res.campaign,
          analytics: res.analytics,
          loading: false,
        });
      }
    } catch (err) {
      error('Failed to load campaign analytics.');
      setAnalyticsModal({ isOpen: false, campaign: null, analytics: null, loading: false });
    }
  };

  const handleTriggerQueue = async () => {
    setProcessingQueue(true);
    try {
      const res = await api.post('/campaigns/process-queue');
      if (res.success) {
        success(`Queue cycle complete! Emails sent: ${res.summary.emailsDispatched}, WhatsApp: ${res.summary.whatsAppDispatched}.`);
        fetchCampaigns();
      }
    } catch (err) {
      error(err.message || 'Queue trigger failed.');
    } finally {
      setProcessingQueue(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      const res = await api.post('/campaigns', {
        ...form,
        leadIds: selectedLeadIds,
      });
      if (res.success) {
        success('Campaign created successfully!');
        setIsCreateModalOpen(false);
        fetchCampaigns();
      }
    } catch (err) {
      error(err.message || 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  const insertVariable = (variable) => {
    setForm((prev) => ({
      ...prev,
      body: prev.body + ` {{${variable}}}`,
    }));
  };

  const toggleSelectAllLeads = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const toggleLeadSelect = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Unified Campaign Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, schedule, automate, and analyze multi-channel outreach across Email, LinkedIn, and WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTriggerQueue}
            disabled={processingQueue}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processingQueue ? 'animate-spin' : ''}`} />
            <span>Process Queue Now</span>
          </button>

          <button
            onClick={() => {
              loadDependenciesForCreate();
              setSelectedLeadIds([]);
              setForm({
                name: '',
                channel: 'EMAIL',
                senderAccountId: '',
                subject: 'Connecting with {{company}} regarding operations',
                body: 'Hi {{first_name}},\n\nI noticed your role as {{designation}} at {{company}}. We help teams in {{industry}} automate their pipeline.\n\nWould you be open to connecting?\n\nBest,\n{{employee_name}}',
                intervalMinutes: 5,
                dailyLimit: 50,
                sequences: [
                  { stepNumber: 1, delayDays: 3, subject: 'Re: Connecting with {{company}}', body: 'Hi {{first_name}},\n\nFloating this back to the top of your inbox.\n\nBest,\n{{employee_name}}' },
                  { stepNumber: 2, delayDays: 7, subject: 'Quick question for {{company}}', body: 'Hi {{first_name}},\n\nChecking if you had a moment to review this.\n\nRegards,\n{{employee_name}}' },
                ],
              });
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Channels</option>
            <option value="EMAIL">Email</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="RUNNING">Running</option>
            <option value="PAUSED">Paused</option>
            <option value="DRAFT">Draft</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Campaign Name</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3 text-center">Leads</th>
                <th className="px-5 py-3 text-center">Sent</th>
                <th className="px-5 py-3 text-center">Replies</th>
                <th className="px-5 py-3 text-center">Interested</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 text-sm">
                    No campaigns found. Click "Create Campaign" to begin.
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{camp.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Limit: {camp.dailyLimit}/day &bull; Interval: {camp.intervalMinutes}m
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-xs text-slate-800">
                        {camp.channel === 'EMAIL' && <Mail className="w-4 h-4 text-sky-500" />}
                        {camp.channel === 'LINKEDIN' && <Linkedin className="w-4 h-4 text-blue-600" />}
                        {camp.channel === 'WHATSAPP' && <MessageSquare className="w-4 h-4 text-emerald-500" />}
                        <span>{camp.channel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 whitespace-nowrap">
                      {camp.owner}
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-slate-800">
                      {camp.totalLeads}
                    </td>
                    <td className="px-5 py-3.5 text-center font-medium text-sky-600">
                      {camp.sent}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-emerald-600">
                      {camp.replies}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-indigo-600">
                      {camp.interested}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge status={camp.status} size="xs" />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openAnalytics(camp)}
                          title="View Analytics"
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                        {camp.status === 'RUNNING' ? (
                          <button
                            onClick={() => handlePause(camp)}
                            title="Pause Campaign"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStart(camp)}
                            title="Start Campaign"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicate(camp)}
                          title="Duplicate Campaign"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Copy className="w-4 h-4" />
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

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Unified Outreach Campaign"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Q4 SaaS Executive Cold Sequence"
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
                <option value="EMAIL">Email (Cold Outreach)</option>
                <option value="LINKEDIN">LinkedIn (User-Assisted)</option>
                <option value="WHATSAPP">WhatsApp (Cloud API)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Sending Limit</label>
              <input
                type="number"
                min={1}
                max={500}
                value={form.dailyLimit}
                onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interval Between Messages (minutes)</label>
              <input
                type="number"
                min={1}
                value={form.intervalMinutes}
                onChange={(e) => setForm({ ...form, intervalMinutes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {form.channel === 'EMAIL' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject *</label>
              <input
                type="text"
                required={form.channel === 'EMAIL'}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Connecting with {{first_name}} regarding {{company}}"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Initial Message Body *</label>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span>Insert variable:</span>
                {['first_name', 'company', 'designation', 'employee_name'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={4}
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          {/* Follow-up Sequence Engine (Section 9) */}
          {form.channel === 'EMAIL' && (
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Automated Follow-up Sequences
                </span>
                <span className="text-[11px] text-slate-500">
                  ⚠️ Stops automatically if lead replies or is marked Interested / DNC
                </span>
              </div>

              {form.sequences.map((seq, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Follow-Up #{idx + 1} (after {seq.delayDays} days)</span>
                  </div>
                  <input
                    type="text"
                    value={seq.subject}
                    onChange={(e) => {
                      const newSeq = [...form.sequences];
                      newSeq[idx].subject = e.target.value;
                      setForm({ ...form, sequences: newSeq });
                    }}
                    placeholder="Follow-up Subject"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs"
                  />
                  <textarea
                    rows={2}
                    value={seq.body}
                    onChange={(e) => {
                      const newSeq = [...form.sequences];
                      newSeq[idx].body = e.target.value;
                      setForm({ ...form, sequences: newSeq });
                    }}
                    placeholder="Follow-up Body"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Lead Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Target Leads ({selectedLeadIds.length} of {leads.length} selected)
              </label>
              <button
                type="button"
                onClick={toggleSelectAllLeads}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
              >
                {selectedLeadIds.length === leads.length ? 'Deselect All' : 'Select All Leads'}
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {leads.map((l) => (
                <label
                  key={l.id}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.includes(l.id)}
                    onChange={() => toggleLeadSelect(l.id)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-semibold text-slate-800">{l.name}</span>
                  <span className="text-slate-400">&bull; {l.company || 'Private'}</span>
                  <span className="text-slate-400">&bull; {l.email || l.phone}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
            >
              {submitting ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Campaign Analytics Drawer / Modal */}
      <Modal
        isOpen={analyticsModal.isOpen}
        onClose={() => setAnalyticsModal({ ...analyticsModal, isOpen: false })}
        title={`Analytics: ${analyticsModal.campaign?.name || 'Campaign'}`}
        maxWidth="max-w-2xl"
      >
        {analyticsModal.loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading analytics...</div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Leads</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {analyticsModal.analytics?.totalLeads}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Messages Sent</div>
                <div className="text-2xl font-bold text-sky-600 mt-1">
                  {analyticsModal.analytics?.sent}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Replies</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  {analyticsModal.analytics?.replies}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Interested</div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">
                  {analyticsModal.analytics?.interested}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="text-xs text-blue-700 font-semibold">Open Rate</div>
                <div className="text-lg font-bold text-blue-900 mt-0.5">
                  {analyticsModal.analytics?.openRate}%
                </div>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <div className="text-xs text-emerald-700 font-semibold">Reply Rate</div>
                <div className="text-lg font-bold text-emerald-900 mt-0.5">
                  {analyticsModal.analytics?.replyRate}%
                </div>
              </div>
              <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                <div className="text-xs text-purple-700 font-semibold">Conversion Rate</div>
                <div className="text-lg font-bold text-purple-900 mt-0.5">
                  {analyticsModal.analytics?.conversionRate}%
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Channel: <strong>{analyticsModal.campaign?.channel}</strong></span>
              <span>Pending in Sequence: <strong>{analyticsModal.analytics?.pending} leads</strong></span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
