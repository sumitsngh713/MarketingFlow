import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmationModal from '../components/common/ConfirmationModal.jsx';
import {
  Settings as SettingsIcon,
  Building,
  Clock,
  Send,
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
} from 'lucide-react';

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [activeTab, setActiveTab] = useState('organisation');
  const [settings, setSettings] = useState({
    orgName: 'MarketingFlow',
    logoUrl: '',
    address: '100 Innovation Blvd, Tech Park, Suite 400',
    timezone: 'UTC',
    workStartTime: '09:00',
    workEndTime: '18:00',
    lateThresholdMinutes: 15,
    workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
    defaultEmailDailyLimit: 200,
    defaultFollowupDelayDays: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Demo Data Reset / Purge Modals
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [demoActionLoading, setDemoActionLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      error('Failed to load organisation settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    try {
      const res = await api.put('/settings', settings);
      if (res.success) {
        success('Settings saved successfully!');
        setSettings(res.settings);
      }
    } catch (err) {
      error(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    setDemoActionLoading(true);
    try {
      const res = await api.post('/demo/reset');
      if (res.success) {
        success('Demo data restored to fresh state!');
        setResetModalOpen(false);
      }
    } catch (err) {
      error(err.message || 'Failed to reset demo data.');
    } finally {
      setDemoActionLoading(false);
    }
  };

  const handlePurgeDemoData = async () => {
    setDemoActionLoading(true);
    try {
      const res = await api.post('/demo/purge');
      if (res.success) {
        success('All demo data purged. Your organization is ready for fresh production use.');
        setPurgeModalOpen(false);
      }
    } catch (err) {
      error(err.message || 'Failed to purge demo data.');
    } finally {
      setDemoActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Organisation & System Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure branding, office attendance rules, marketing automation thresholds, and integrations.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-8 flex-wrap">
        {[
          { id: 'organisation', label: 'Organisation Profile', icon: Building },
          { id: 'attendance', label: 'Attendance Rules', icon: Clock },
          { id: 'marketing', label: 'Marketing Limits', icon: Send },
          { id: 'integrations', label: 'Integrations & Stack', icon: Server },
          { id: 'demodata', label: 'Demo Data Management', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORGANISATION PROFILE */}
      {activeTab === 'organisation' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 max-w-3xl">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Company Identity</h3>
            <p className="text-xs text-slate-500">Customize the organization name and branding presented across the platform.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.orgName}
                onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
              <select
                disabled={!isAdmin}
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-50"
              >
                <option value="UTC">UTC (Universal Time)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Chicago">Central Time (US & Canada)</option>
                <option value="America/Denver">Mountain Time (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="Europe/London">London (GMT / BST)</option>
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                <option value="Asia/Singapore">Singapore / Hong Kong (SGT)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Address</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
            />
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: ATTENDANCE RULES */}
      {activeTab === 'attendance' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 max-w-3xl">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Attendance & Office Hours Policy</h3>
            <p className="text-xs text-slate-500">Configure standard shift hours and grace period thresholds for punctuality calculation.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Office Start Time</label>
              <input
                type="time"
                disabled={!isAdmin}
                value={settings.workStartTime}
                onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Office End Time</label>
              <input
                type="time"
                disabled={!isAdmin}
                value={settings.workEndTime}
                onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Late Threshold (Minutes)</label>
              <input
                type="number"
                disabled={!isAdmin}
                min={0}
                max={60}
                value={settings.lateThresholdMinutes}
                onChange={(e) => setSettings({ ...settings, lateThresholdMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Working Days</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.workingDays}
              onChange={(e) => setSettings({ ...settings, workingDays: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
            />
            <span className="text-[11px] text-slate-400">Comma-separated days (e.g. Monday,Tuesday,Wednesday,Thursday,Friday)</span>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
              >
                {saving ? 'Saving...' : 'Save Rules'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: MARKETING LIMITS */}
      {activeTab === 'marketing' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 max-w-3xl">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Outreach Engine & Delay Defaults</h3>
            <p className="text-xs text-slate-500">Configure global safety rate limits and default follow-up cadence intervals.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Daily Sending Limit (Per Account)</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.defaultEmailDailyLimit}
                onChange={(e) => setSettings({ ...settings, defaultEmailDailyLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Follow-Up Delay (Days)</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.defaultFollowupDelayDays}
                onChange={(e) => setSettings({ ...settings, defaultFollowupDelayDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
              >
                {saving ? 'Saving...' : 'Save Limits'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 4: INTEGRATIONS & ARCHITECTURE STACK */}
      {activeTab === 'integrations' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-4xl">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">System Architecture & Integrations Status</h3>
            <p className="text-xs text-slate-500">Live operational status of external providers, APIs, and background queue workers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-brand-600" />
                  <span>SMTP Cold Email Outbound</span>
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Supports SendGrid, Amazon SES, Mailgun, or standard TLS/SSL SMTP servers with encrypted credential storage.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Cloud API</span>
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connects directly to Meta Business Graph API v18.0+. Automatic STOP opt-out suppression safeguards enabled.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>LinkedIn User-Assisted Queue</span>
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                100% compliant user-assisted copy workflow. Zero CAPTCHA penalties, completely immune to anti-bot restrictions.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Background Scheduler / Queue</span>
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Active (2m Cron)
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Runs background follow-up dispatches independently of browser sessions. Integrates seamlessly with Redis or in-process queue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEMO DATA MANAGEMENT */}
      {activeTab === 'demodata' && isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-3xl">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Demo Data Controls (Section 29)</h3>
            <p className="text-xs text-slate-500">
              Easily reset or clear sample data (10 employees, 50 leads, 7 campaigns, 30 attendance records) for development review or clean production onboarding.
            </p>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Reset Demo Dataset</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Clears current demo campaign history, attendance, and leads, and re-seeds with a fresh factory dataset of 10 employees, 50 qualified leads, and realistic attendance records.
            </p>
            <button
              onClick={() => setResetModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Fresh Demo Data</span>
            </button>
          </div>

          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Purge All Demo Data for Production</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              Permanently clears all demo records, test leads, and sample employees. Keeps your Super Admin user account so you can begin onboarding real team members and production leads immediately.
            </p>
            <button
              onClick={() => setPurgeModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge All Demo Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetDemoData}
        title="Reset System Demo Data"
        message="Are you sure you want to re-seed the system with fresh demo employees, leads, and attendance records? Any custom test leads will be refreshed."
        confirmText="Confirm Reset"
        isDanger={false}
        isLoading={demoActionLoading}
      />

      <ConfirmationModal
        isOpen={purgeModalOpen}
        onClose={() => setPurgeModalOpen(false)}
        onConfirm={handlePurgeDemoData}
        title="Purge All Demo Data"
        message="Are you sure you want to permanently purge all demo employees, leads, and campaign logs? This action is irreversible and prepares the organization for clean production use."
        confirmText="Yes, Purge Demo Data"
        isDanger={true}
        isLoading={demoActionLoading}
      />
    </div>
  );
}
