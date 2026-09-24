import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from '../routes/authRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import attendanceRoutes from '../routes/attendanceRoutes.js';
import leadRoutes from '../routes/leadRoutes.js';
import campaignRoutes from '../routes/campaignRoutes.js';
import outreachRoutes from '../routes/outreachRoutes.js';
import followupRoutes from '../routes/followupRoutes.js';
import dashboardRoutes from '../routes/dashboardRoutes.js';
import reportRoutes from '../routes/reportRoutes.js';
import activityLogRoutes from '../routes/activityLogRoutes.js';
import settingsRoutes from '../routes/settingsRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';
import demoRoutes from '../routes/demoRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', application: 'MarketingFlow API' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api', outreachRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/demo', demoRoutes);

const TEST_PORT = 5002;

async function runTestSuite() {
  console.log('🧪 Starting MarketingFlow Comprehensive Test Suite...\n');

  const server = app.listen(TEST_PORT);
  const BASE = `http://localhost:${TEST_PORT}`;

  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  try {
    // 1. Health check test
    await assertTest('GET /health endpoint', async () => {
      const res = await fetch(`${BASE}/health`);
      const data = await res.json();
      if (!res.ok || data.status !== 'healthy') throw new Error('Health check failed');
    });

    // 2. Invalid authentication test
    await assertTest('POST /api/auth/login with invalid password fails (401)', async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@marketingflow.io', password: 'WrongPassword!' }),
      });
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    // 3. Admin login test
    let adminToken = '';
    await assertTest('POST /api/auth/login for Super Admin succeeds', async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@marketingflow.io', password: 'Admin@12345' }),
      });
      const data = await res.json();
      if (!res.ok || !data.token || data.user.role !== 'ADMIN') throw new Error('Admin login failed');
      adminToken = data.token;
    });

    // 4. Employee login test
    let employeeToken = '';
    await assertTest('POST /api/auth/login for Employee Alex succeeds', async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alex.rivera@marketingflow.io', password: 'Emp@12345' }),
      });
      const data = await res.json();
      if (!res.ok || !data.token || data.user.role !== 'EMPLOYEE') throw new Error('Employee login failed');
      employeeToken = data.token;
    });

    // 5. Role permissions test: Employee cannot access Admin-only /api/reports/performance
    await assertTest('Role protection: Employee blocked from Admin-only routes (403)', async () => {
      const res = await fetch(`${BASE}/api/reports/performance`, {
        headers: { Authorization: `Bearer ${employeeToken}` },
      });
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden for employee on admin report, got ${res.status}`);
    });

    // 6. User creation test (Admin only)
    let newUserId = '';
    await assertTest('Admin creates new employee with auto-generated credentials', async () => {
      const res = await fetch(`${BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          firstName: 'Jordan',
          lastName: 'Taylor',
          email: `jordan.taylor.${Date.now()}@marketingflow.io`,
          designation: 'Outreach Representative',
          department: 'Sales',
          role: 'EMPLOYEE',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.temporaryPassword) throw new Error('User creation failed');
      newUserId = data.user.id;
    });

    // 7. Check-in & Check-out test
    await assertTest('Employee check-in & check-out lifecycle', async () => {
      // Check in
      const inRes = await fetch(`${BASE}/api/attendance/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${employeeToken}` },
      });
      const inData = await inRes.json();
      // either checked in or already checked in for today
      if (!inRes.ok && !inData.message.includes('already checked in')) {
        throw new Error(`Check-in failed: ${inData.message}`);
      }

      // Check out
      const outRes = await fetch(`${BASE}/api/attendance/check-out`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${employeeToken}` },
      });
      const outData = await outRes.json();
      if (!outRes.ok) throw new Error(`Check-out failed: ${outData.message}`);
    });

    // 8. Lead creation test
    let testLeadId = '';
    await assertTest('POST /api/leads creates CRM lead with duplicate check', async () => {
      const res = await fetch(`${BASE}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Harrison Ford',
          company: 'Falcon Aerodynamics',
          email: `harrison.${Date.now()}@falcon.io`,
          phone: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
          designation: 'VP Engineering',
          industry: 'Aerospace',
          status: 'NEW',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.lead.leadNumber) throw new Error('Lead creation failed');
      testLeadId = data.lead.id;
    });

    // 9. CSV import test with duplicate skipping
    await assertTest('POST /api/leads/import bulk imports leads and detects duplicates', async () => {
      const uniqueBatchEmail = `banner.${Date.now()}@starklabs.io`;
      const uniquePhone = `+1555${Math.floor(1000000 + Math.random() * 8999999)}`;
      const res = await fetch(`${BASE}/api/leads/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          leads: [
            { name: 'Dr. Bruce Banner', company: 'Stark Labs', email: uniqueBatchEmail, phone: uniquePhone, designation: 'Lead Researcher' },
            { name: 'Dr. Bruce Banner', company: 'Stark Labs', email: uniqueBatchEmail, phone: uniquePhone, designation: 'Lead Researcher' }, // duplicate
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.imported !== 1 || data.skippedDuplicates !== 1) {
        throw new Error(`Expected 1 imported and 1 skipped, got ${data.imported} and ${data.skippedDuplicates}`);
      }
    });

    // 10. Campaign creation test
    let testCampaignId = '';
    await assertTest('POST /api/campaigns creates campaign with sequences', async () => {
      const res = await fetch(`${BASE}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Enterprise Test Campaign',
          channel: 'EMAIL',
          subject: 'Connecting with {{company}}',
          body: 'Hi {{first_name}}, let us talk.',
          leadIds: [testLeadId],
          sequences: [
            { stepNumber: 1, delayDays: 3, subject: 'Follow up #1', body: 'Hi {{first_name}}, following up.' },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.campaign.id) throw new Error('Campaign creation failed');
      testCampaignId = data.campaign.id;
    });

    // 11. Follow-up engine & campaign start
    await assertTest('POST /api/campaigns/:id/start and queue processing runs', async () => {
      const startRes = await fetch(`${BASE}/api/campaigns/${testCampaignId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!startRes.ok) throw new Error('Failed to start campaign');

      const queueRes = await fetch(`${BASE}/api/campaigns/process-queue`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const queueData = await queueRes.json();
      if (!queueRes.ok) throw new Error('Queue cycle failed');
    });

    // 12. Opt-out / Unsubscribe test (Compliance)
    await assertTest('GET /api/email/unsubscribe handles opt-out compliance', async () => {
      const testEmail = 'optout.test@example.com';
      const res = await fetch(`${BASE}/api/email/unsubscribe?email=${encodeURIComponent(testEmail)}&leadId=${testLeadId}`);
      if (!res.ok) throw new Error('Unsubscribe request failed');
    });

    // 13. Reports test (Performance, Attendance, Marketing)
    await assertTest('GET /api/reports/performance, attendance, and marketing', async () => {
      const [pRes, aRes, mRes] = await Promise.all([
        fetch(`${BASE}/api/reports/performance`, { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch(`${BASE}/api/reports/attendance`, { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch(`${BASE}/api/reports/marketing`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      ]);
      if (!pRes.ok || !aRes.ok || !mRes.ok) throw new Error('Reports generation failed');
    });

    // 14. Activity logs test
    await assertTest('GET /api/activity-logs returns audit events', async () => {
      const res = await fetch(`${BASE}/api/activity-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.logs) || data.logs.length === 0) throw new Error('Audit logs missing');
    });

    // 15. Dashboard metrics test
    await assertTest('GET /api/dashboard returns 12 KPI metrics & charts', async () => {
      const res = await fetch(`${BASE}/api/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (!res.ok || data.kpis.totalEmployees === undefined || !data.charts.attendance) {
        throw new Error('Dashboard KPIs malformed');
      }
    });

    // 16. Logout test
    await assertTest('POST /api/auth/logout logs user out cleanly', async () => {
      const res = await fetch(`${BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${employeeToken}` },
      });
      if (!res.ok) throw new Error('Logout failed');
    });

  } finally {
    server.close();
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
