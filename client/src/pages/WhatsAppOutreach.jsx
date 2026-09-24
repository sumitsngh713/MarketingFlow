import React, { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Badge from '../components/common/Badge.jsx';
import Modal from '../components/common/Modal.jsx';
import {
  MessageSquare,
  Plus,
  ShieldCheck,
  Send,
  Lock,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function WhatsAppOutreach() {
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Account Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({
    accountName: '',
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    dailyLimit: 500,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/whatsapp/accounts');
      if (res.success) {
        setAccounts(res.accounts);
      }
    } catch (err) {
      error('Failed to load WhatsApp accounts.');
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
      const res = await api.post('/whatsapp/accounts', accountForm);
      if (res.success) {
        success('WhatsApp Cloud API account saved securely!');
        setIsAddModalOpen(false);
        setAccountForm({
          accountName: '',
          phoneNumberId: '',
          businessAccountId: '',
          accessToken: '',
          dailyLimit: 500,
        });
        fetchAccounts();
      }
    } catch (err) {
      error(err.message || 'Failed to save WhatsApp account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            WhatsApp Business Outreach
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Meta Cloud API architecture for high-delivery customer engagement and opt-out compliance.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Connect WhatsApp Account</span>
          </button>
        )}
      </div>

      {/* Compliance / Opt-out Safeguards */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-emerald-950">Official WhatsApp Cloud API & Opt-Out Handling</div>
          <p className="leading-relaxed">
            This module integrates strictly with the official Meta WhatsApp Cloud API. No unofficial QR-code scrapers or browser sessions are used. Contacts who reply <strong>STOP</strong> or <strong>UNSUBSCRIBE</strong> are instantly suppressed from all future outreach campaigns automatically.
          </p>
        </div>
      </div>

      {/* Configured Accounts (Admin) */}
      {isAdmin ? (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Connected WhatsApp Cloud API Endpoints ({accounts.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
                No WhatsApp Cloud API accounts configured. Click "Connect WhatsApp Account" to link one.
              </div>
            ) : (
              accounts.map((acc) => (
                <div key={acc.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{acc.accountName}</h3>
                      <div className="text-xs text-emerald-600 font-medium">Meta Verified Endpoint</div>
                    </div>
                    <Badge status={acc.status} size="xs" />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone Number ID:</span>
                      <span className="font-mono text-slate-800">{acc.phoneNumberId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Business Account ID:</span>
                      <span className="font-mono text-slate-800">{acc.businessAccountId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Daily Limit:</span>
                      <span className="font-bold text-slate-700">{acc.dailyLimit} messages</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Access Token:</span>
                      <span className="font-mono text-slate-400">•••••••••••• (Encrypted)</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          🔒 WhatsApp Cloud API credentials are encrypted and managed centrally by organization administrators. Employees can execute WhatsApp campaigns assigned to them.
        </div>
      )}

      {/* Add Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Connect Meta WhatsApp Cloud API"
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
              placeholder="MarketingFlow Official WhatsApp"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number ID *</label>
              <input
                type="text"
                required
                value={accountForm.phoneNumberId}
                onChange={(e) => setAccountForm({ ...accountForm, phoneNumberId: e.target.value })}
                placeholder="109823482390192"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Business Account ID</label>
              <input
                type="text"
                value={accountForm.businessAccountId}
                onChange={(e) => setAccountForm({ ...accountForm, businessAccountId: e.target.value })}
                placeholder="29837192837192"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">System User Access Token *</label>
            <input
              type="password"
              required
              value={accountForm.accessToken}
              onChange={(e) => setAccountForm({ ...accountForm, accessToken: e.target.value })}
              placeholder="EAABwz..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Limit (Messages)</label>
            <input
              type="number"
              min={1}
              max={10000}
              value={accountForm.dailyLimit}
              onChange={(e) => setAccountForm({ ...accountForm, dailyLimit: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Tokens are stored encrypted via AES-256 and never sent to clients.</span>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              {submitting ? 'Saving...' : 'Save WhatsApp Configuration'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
