import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import api from '../api/client.js';
import { Zap, Lock, Mail, ArrowRight, Shield, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Check if system requires initial setup
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await api.get('/auth/setup-status');
        if (res.success && res.setupNeeded) {
          navigate('/setup');
          return;
        }
      } catch (e) {
        // ignore
      } finally {
        setCheckingSetup(false);
      }
    }
    checkSetup();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      error('Your session has expired. Please log in again.');
    }
  }, [location, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      success(`Welcome back, ${res.user.firstName}!`);
      navigate('/');
    } catch (err) {
      error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for demo environment
  const fillCredentials = (eMail, pass) => {
    setEmail(eMail);
    setPassword(pass);
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Initializing MarketingFlow...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/25 mb-4">
          <Zap className="w-8 h-8 fill-current" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          MarketingFlow
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Organization Management & Intelligent Outreach Automation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email or Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@marketingflow.io or EMP-001"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Pill Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Quick Demo Logins
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin@marketingflow.io', 'Admin@12345')}
                className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-900 hover:bg-indigo-100 transition text-left"
              >
                <div className="flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Super Admin</span>
                </div>
                <span className="font-mono text-[10px] text-indigo-700 bg-white px-2 py-0.5 rounded shadow-xs">
                  admin@marketingflow.io
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('alex.rivera@marketingflow.io', 'Emp@12345')}
                className="flex items-center justify-between p-2 rounded-lg bg-sky-50/70 border border-sky-100 text-sky-900 hover:bg-sky-100 transition text-left"
              >
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>Employee: Alex (SDR)</span>
                </div>
                <span className="font-mono text-[10px] text-sky-700 bg-white px-2 py-0.5 rounded shadow-xs">
                  alex.rivera@marketingflow.io
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          MarketingFlow &copy; 2026. Enterprise Automation Suite.
        </div>
      </div>
    </div>
  );
}
