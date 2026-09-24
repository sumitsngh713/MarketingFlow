import React from 'react';

const STATUS_STYLES = {
  // General & User
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DISABLED: 'bg-rose-50 text-rose-700 border-rose-200',
  ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  EMPLOYEE: 'bg-sky-50 text-sky-700 border-sky-200',

  // Attendance
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  HALF_DAY: 'bg-orange-50 text-orange-700 border-orange-200',
  ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
  LEAVE: 'bg-purple-50 text-purple-700 border-purple-200',

  // Leads
  NEW: 'bg-blue-50 text-blue-700 border-blue-200',
  CONTACTED: 'bg-sky-50 text-sky-700 border-sky-200',
  FOLLOW_UP: 'bg-amber-50 text-amber-700 border-amber-200',
  INTERESTED: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
  MEETING_SCHEDULED: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
  PROPOSAL_SENT: 'bg-violet-50 text-violet-700 border-violet-200',
  CONVERTED: 'bg-teal-50 text-teal-800 border-teal-300 font-bold',
  NOT_INTERESTED: 'bg-slate-100 text-slate-700 border-slate-200',
  UNRESPONSIVE: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  DO_NOT_CONTACT: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',

  // Campaign & Outreach
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
  SCHEDULED: 'bg-amber-50 text-amber-700 border-amber-200',
  RUNNING: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',

  SENT: 'bg-sky-50 text-sky-700 border-sky-200',
  DELIVERED: 'bg-teal-50 text-teal-700 border-teal-200',
  OPENED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CLICKED: 'bg-blue-50 text-blue-700 border-blue-200',
  REPLIED: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
  READ: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  BOUNCED: 'bg-rose-50 text-rose-700 border-rose-200',
  UNSUBSCRIBED: 'bg-zinc-100 text-zinc-700 border-zinc-300',

  // Channels
  EMAIL: 'bg-sky-50 text-sky-700 border-sky-200',
  LINKEDIN: 'bg-blue-50 text-blue-800 border-blue-200',
  WHATSAPP: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CALL: 'bg-amber-50 text-amber-800 border-amber-200',
};

export default function Badge({ status, text, size = 'sm', className = '' }) {
  const normStatus = (status || '').toUpperCase().replace(/[\s-]/g, '_');
  const style = STATUS_STYLES[normStatus] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = text || (status || '').replace(/_/g, ' ');

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-xs'
    : size === 'md'
    ? 'px-3 py-1 text-sm'
    : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center capitalize tracking-wide rounded-full border font-medium ${sizeClasses} ${style} ${className}`}
    >
      {label}
    </span>
  );
}
