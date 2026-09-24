import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider, useNotification } from './context/NotificationContext.jsx';

import Sidebar from './components/common/Sidebar.jsx';
import Header from './components/common/Header.jsx';
import Modal from './components/common/Modal.jsx';
import api from './api/client.js';

import Login from './pages/Login.jsx';
import SetupAdmin from './pages/SetupAdmin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Attendance from './pages/Attendance.jsx';
import Leads from './pages/Leads.jsx';
import Campaigns from './pages/Campaigns.jsx';
import EmailOutreach from './pages/EmailOutreach.jsx';
import LinkedInOutreach from './pages/LinkedInOutreach.jsx';
import WhatsAppOutreach from './pages/WhatsAppOutreach.jsx';
import Followups from './pages/Followups.jsx';
import Reports from './pages/Reports.jsx';
import ActivityLogs from './pages/ActivityLogs.jsx';
import Settings from './pages/Settings.jsx';

function ProtectedLayout() {
  const { user, token, loading, refreshUser } = useAuth();
  const { success, error } = useNotification();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Forced Password Change state on first login (Section 5)
  const [forcedPassword, setForcedPassword] = useState({ newPassword: '', confirmPassword: '' });
  const [forcingPassword, setForcingPassword] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleForcedPasswordSubmit = async (e) => {
    e.preventDefault();
    if (forcedPassword.newPassword !== forcedPassword.confirmPassword) {
      error('New passwords do not match.');
      return;
    }
    if (forcedPassword.newPassword.length < 8) {
      error('New password must be at least 8 characters long.');
      return;
    }

    setForcingPassword(true);
    try {
      const res = await api.post('/auth/change-password', {
        newPassword: forcedPassword.newPassword,
      });
      if (res.success) {
        success('Password created successfully! Welcome to your workspace.');
        refreshUser();
      }
    } catch (err) {
      error(err.message || 'Failed to update password.');
    } finally {
      setForcingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<AdminOnly><Employees /></AdminOnly>} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/email-outreach" element={<EmailOutreach />} />
            <Route path="/linkedin-outreach" element={<LinkedInOutreach />} />
            <Route path="/whatsapp-outreach" element={<WhatsAppOutreach />} />
            <Route path="/followups" element={<Followups />} />
            <Route path="/reports" element={<AdminOnly><Reports /></AdminOnly>} />
            <Route path="/activity-logs" element={<AdminOnly><ActivityLogs /></AdminOnly>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Non-dismissible First-Time Login Password Change Modal */}
      {user.mustChangePassword && (
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Account Security: Set Your New Password"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleForcedPasswordSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              This is your first time logging in with a temporary password. For account security, you must choose a new permanent password to continue.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password (minimum 8 characters) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={forcedPassword.newPassword}
                onChange={(e) => setForcedPassword({ ...forcedPassword, newPassword: e.target.value })}
                placeholder="Enter a secure password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={forcedPassword.confirmPassword}
                onChange={(e) => setForcedPassword({ ...forcedPassword, confirmPassword: e.target.value })}
                placeholder="Re-type new password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={forcingPassword}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
              >
                {forcingPassword ? 'Setting Password...' : 'Save Password & Enter Workspace'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<SetupAdmin />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}
