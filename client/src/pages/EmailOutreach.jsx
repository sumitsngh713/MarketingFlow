import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Badge from '../components/common/Badge.jsx';
import Modal from '../components/common/Modal.jsx';
import {
  Mail,
  Plus,
  Shield,
  Trash2,
  Send,
  Lock,
  Server,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function EmailOutreach() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Account Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({
    accountName: '',
    senderName: '',
    senderEmail: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    encryption: 'TLS',
    dailySendingLimit: 200,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/email/accounts');
      if (res.success) {
        setAccounts(res.accounts);
      }
    } catch (err) {
      error('Failed to load email accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchAccounts();
    else setLoading(false);
  }, [isAdmin]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/email/accounts', accountForm);
      if (res.success) {
        success('SMTP sender account saved securely.');
        setIsAddModalOpen(false);
        setAccountForm({
          accountName: '',
          senderName: '',
          senderEmail: '',
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          encryption: 'TLS',
          dailySendingLimit: 200,
        });
        fetchAccounts();
      }
    } catch (err) {
      error(err.message || 'Failed to save SMTP account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!confirm('Are you sure you want to remove this SMTP account?')) return;
    try {
      const res = await api.delete(`/email/accounts/${id}`);
      if (res.success) {
        success('Account removed.');
        fetchAccounts();
      }
    } catch (err) {
      error(err.message || 'Failed to delete account.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Email Cold Outreach Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure SMTP sender credentials, suppression lists, and multi-step automated sequences.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Connect SMTP Account</span>
          </button>
        )}
      </div>

      {/* Compliance / Suppression Notice Card */}
      <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-xs text-sky-900 flex items-start gap-3">
        <Shield className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sky-950">Compliance & Suppression Safeguards Active</div>
          <p className="leading-relaxed">
            All outgoing cold emails automatically include instant 1-click unsubscribe links, open tracking pixels, and suppression checks against the global Do-Not-Contact registry. If any contact replies or requests removal, all scheduled follow-ups are halted automatically.
          </p>
        </div>
      </div>

      {/* Accounts List (Admin) */}
      {isAdmin ? (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Connected SMTP Sender Accounts ({accounts.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
                No SMTP accounts configured yet.
              </div>
            ) : (
              accounts.map((acc) => (
                <div key={acc.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{acc.accountName}</h3>
                      <div className="text-xs text-slate-500">{acc.senderEmail}</div>
                    </div>
                    <Badge status={acc.status} size="xs" />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Host:</span>
                      <span className="font-mono text-slate-800">{acc.smtpHost}:{acc.smtpPort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">User:</span>
                      <span className="font-mono text-slate-800">{acc.smtpUser}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Encryption:</span>
                      <span className="font-semibold text-slate-700">{acc.encryption}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Password:</span>
                      <span className="font-mono text-slate-400">•••••••••••• (Encrypted)</span>
                    </div>
                  </div>

                  {/* Daily limit gauge */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Sent Today</span>
                      <span className="font-bold text-slate-800">{acc.sentToday} / {acc.dailySendingLimit}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full"
                        style={{ width: `${Math.min(100, (acc.sentToday / acc.dailySendingLimit) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Account</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          🔒 Global SMTP credentials are configured and administered securely by your organization administrator. Employees can dispatch emails through campaigns assigned to them.
        </div>
      )}

      {/* Add Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Connect SMTP Outreach Account"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Friendly Account Name *</label>
            <input
              type="text"
              required
              value={accountForm.accountName}
              onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
              placeholder="Primary Outreach Sender"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Display Name</label>
              <input
                type="text"
                value={accountForm.senderName}
                onChange={(e) => setAccountForm({ ...accountForm, senderName: e.target.value })}
                placeholder="MarketingFlow Growth Team"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Email Address *</label>
              <input
                type="email"
                required
                value={accountForm.senderEmail}
                onChange={(e) => setAccountForm({ ...accountForm, senderEmail: e.target.value })}
                placeholder="outreach@marketingflow.io"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Server Host *</label>
              <input
                type="text"
                required
                value={accountForm.smtpHost}
                onChange={(e) => setAccountForm({ ...accountForm, smtpHost: e.target.value })}
                placeholder="smtp.sendgrid.net / smtp.gmail.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
              <input
                type="number"
                value={accountForm.smtpPort}
                onChange={(e) => setAccountForm({ ...accountForm, smtpPort: e.target.value })}
                placeholder="587"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Username *</label>
              <input
                type="text"
                required
                value={accountForm.smtpUser}
                onChange={(e) => setAccountForm({ ...accountForm, smtpUser: e.target.value })}
                placeholder="apikey / user@marketingflow.io"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Password / API Key *</label>
              <input
                type="password"
                required
                value={accountForm.smtpPassword}
                onChange={(e) => setAccountForm({ ...accountForm, smtpPassword: e.target.value })}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Encryption</label>
              <select
                value={accountForm.encryption}
                onChange={(e) => setAccountForm({ ...accountForm, encryption: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="TLS">TLS (Recommended)</option>
                <option value="SSL">SSL</option>
                <option value="NONE">None</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Sending Limit</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={accountForm.dailySendingLimit}
                onChange={(e) => setAccountForm({ ...accountForm, dailySendingLimit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Credentials are encrypted via AES-256 before storage and will never be shown to employees.</span>
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
              {submitting ? 'Saving...' : 'Save & Verify Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
