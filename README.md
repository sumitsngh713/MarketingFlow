# 🚀 MarketingFlow — Marketing Automation & Employee Management SaaS

> **A modern, high-performance, full-stack B2B SaaS web application engineered for small-to-midsize organizations (~10–50 employees) combining multi-channel cold outreach automation with operational workforce attendance and CRM.**

[![Node.js Version](https://img.shields.io/badge/node.js-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.3.1-blue.svg)](https://react.dev/)
[![Prisma ORM](https://img.shields.io/badge/prisma-6.4.1-1B222D.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-3.4.17-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests Passing](https://img.shields.io/badge/integration_tests-16%2F16_passed-success.svg)](#-automated-testing--verification)

---

## 📑 Table of Contents

- [Executive Overview](#-executive-overview)
- [System Architecture](#-system-architecture)
- [Complete Feature Inventory](#-complete-feature-inventory)
- [Security & Compliance Architecture](#-security--compliance-architecture)
- [Quick Start Guide (Local Development)](#-quick-start-guide-local-development)
- [Pre-Seeded Demo Credentials](#-pre-seeded-demo-credentials)
- [Production Deployment Guide](#-production-deployment-guide)
  - [Docker & Docker Compose (Recommended)](#1-docker--docker-compose-recommended)
  - [Cloud Platforms (Render, Supabase, Neon)](#2-cloud-platforms-render-supabase-neon)
- [Environment Variables Reference](#-environment-variables-reference)
- [REST API Reference](#-rest-api-reference)
- [Automated Testing & Verification](#-automated-testing--verification)
- [Database Schema (Prisma)](#-database-schema-prisma)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [License](#-license)

---

## 🌟 Executive Overview

**MarketingFlow** solves the operational friction faced by modern growth-driven companies: bridging the gap between **sales outreach automation** and **team operational oversight**.

Instead of paying for 4 separate disparate tools (HubSpot + Lemlist + Clockify + Meta Business Suite), MarketingFlow consolidates everything into a single, cohesive, self-hosted or cloud-deployable platform:

1. **Workforce & Attendance Control:** Live check-in/out, automated working hours tracking, late arrival flags, manual admin override, and one-click PDF/Excel/CSV exports.
2. **Lead CRM Pipeline:** Complete lead lifecycle management with duplicate prevention across Email, Phone, and Company.
3. **Multi-Channel Cold Outreach Engine:**
   - **Cold Email:** Multi-account SMTP rotation, AES-256 encrypted credentials, dynamic sequence dispatching, real-time open tracking pixels, and RFC-compliant unsubscribe handlers.
   - **LinkedIn Outreach:** 100% compliant user-assisted queue ("Open Profile" + "Copy Personalized Message") eliminating bot-detection and account suspension risks.
   - **WhatsApp Outreach:** Meta Cloud API architecture with automated `STOP` keyword opt-out handling and instant suppression.
4. **Autonomous Follow-up Dispatcher:** Background cron engine that sends staggered multi-touch sequences, strictly halting immediately when a prospect replies or is marked as *Interested*, *Not Interested*, or *Do Not Contact*.
5. **Executive Analytics & Audit Trail:** Real-time KPI dashboards, attendance heatmaps, sales rep leaderboards, and an immutable system activity log.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client (React 18 + Vite + Tailwind)"]
        UI[Responsive SPA UI]
        Router[React Router v6]
        AuthCtx[Auth Context & JWT Store]
        Toasts[Toast Notification Provider]
        Recharts[Recharts Data Visualizations]
    end

    subgraph API ["Backend API Server (Express.js)"]
        AuthMiddleware["JWT & RBAC Guards (Admin vs Employee)"]
        AuditLogger["Audit Middleware (IP, Actor, Action)"]
        
        subgraph Controllers ["Controllers & Business Logic"]
            AuthController[Auth & Password Controller]
            UserController[Employee CRUD Controller]
            AttController[Attendance Engine]
            CRMController[Lead CRM & CSV Engine]
            CampaignController[Campaign Sequences]
            EmailController[Email Engine & Tracking]
            WAController[WhatsApp Engine & Webhook]
            LIController[LinkedIn Queue Controller]
            ReportController[Analytics & Export Engine]
            SettingsController[Org Profile & Demo Engine]
        end

        subgraph Background ["Background Services"]
            Worker["Node-Cron Campaign Dispatcher (2-min interval)"]
            FollowupEngine["Strict Reply/Status Halt Engine"]
            CryptoUtil["AES-256-CBC Encryption Utility"]
        end
    end

    subgraph DataTier ["Data Persistence Tier"]
        PrismaORM["Prisma ORM (Schema & Client)"]
        SQLite[("SQLite dev.db (Dev / Testing)")]
        PostgreSQL[("PostgreSQL (Production Cloud / Docker)")]
    end

    subgraph External ["External Delivery Channels"]
        SMTP["SMTP Servers (Gmail, SendGrid, Amazon SES)"]
        MetaAPI["Meta WhatsApp Cloud API v19.0"]
        LinkedIn["LinkedIn Web (Compliant Rep Assisted)"]
    end

    UI --> Router
    Router --> AuthCtx
    AuthCtx --> Toasts
    UI -->|Axios REST / Bearer JWT| AuthMiddleware
    AuthMiddleware --> AuditLogger
    AuditLogger --> Controllers
    Controllers --> PrismaORM
    Worker --> FollowupEngine
    FollowupEngine --> PrismaORM
    EmailController --> CryptoUtil
    WAController --> CryptoUtil
    CryptoUtil --> SMTP
    CryptoUtil --> MetaAPI
    LIController --> LinkedIn
    PrismaORM --> SQLite
    PrismaORM --> PostgreSQL
```

### Folder Structure

```text
MarketingFlow/
├── Dockerfile                  # Multi-stage production container build
├── docker-compose.yml          # App + PostgreSQL 16 + Redis stack
├── package.json                # Root orchestration scripts
├── .env.example                # Root environment configuration template
├── .dockerignore               # Container build ignore rules
│
├── client/                     # Frontend Application (React 18 + Vite)
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── api/                # Axios instance & unified API clients
│   │   ├── components/         # Reusable UI widgets (Header, Sidebar, Modals, StatCards)
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── pages/              # 14 Full Page Views:
│   │   │   ├── Login.jsx       # Login screen with quick-fill demo pills
│   │   │   ├── SetupAdmin.jsx  # Zero-admin first-run initialization wizard
│   │   │   ├── Dashboard.jsx   # 12 KPI cards, charts, outreach funnel
│   │   │   ├── Employees.jsx   # Employee directory, credentials copy dialog
│   │   │   ├── Attendance.jsx  # Clock in/out, late flags, CSV/Excel/PDF export
│   │   │   ├── Leads.jsx       # CRM pipeline, duplicate prevention, CSV import
│   │   │   ├── Campaigns.jsx   # Sequence creator, multi-step builder
│   │   │   ├── EmailOutreach.jsx    # SMTP manager, email sequences, tracking
│   │   │   ├── LinkedInOutreach.jsx # Compliant manual queue & copy
│   │   │   ├── WhatsAppOutreach.jsx # WhatsApp Cloud API & message manager
│   │   │   ├── Followups.jsx   # Task command center (Today, Overdue, This Week)
│   │   │   ├── Reports.jsx     # Productivity, Attendance, Attribution reports
│   │   │   ├── ActivityLogs.jsx# Immutable system audit trail
│   │   │   └── Settings.jsx    # Org branding, rules, 1-click demo purge/reset
│   │   ├── App.jsx             # Route definitions & forced password modal
│   │   └── main.jsx            # Application entrypoint
│   └── package.json
│
└── server/                     # Backend Application (Express + Prisma)
    ├── entrypoint.js           # Multi-database container entrypoint
    ├── prisma/
    │   ├── schema.prisma       # SQLite schema definition
    │   └── schema.postgresql.prisma # PostgreSQL schema definition
    ├── src/
    │   ├── controllers/        # 13 REST API controllers
    │   ├── middleware/         # auth.js, roles.js, audit.js
    │   ├── routes/             # 13 Express route modules
    │   ├── seeds/              # seed.js (Admin, 10 employees, 50 leads, 7 campaigns)
    │   ├── services/           # emailService, whatsappService, linkedinService, queueService
    │   ├── tests/              # testAll.js (16 automated integration test suites)
    │   ├── utils/              # crypto.js (AES-256), jwt.js, db.js
    │   ├── workers/            # campaignWorker.js (cron sequence dispatcher)
    │   └── index.js            # Express server entrypoint & SPA static host
    └── package.json
```

---

## 📦 Complete Feature Inventory

### 1. Authentication & Role-Based Access Control (RBAC)
- **Two Distinct Roles:**
  - `ADMIN`: Complete system authority — employee provisioning, credential generation, attendance overrides, account settings, campaign management, and audit logs.
  - `EMPLOYEE`: Access restricted to assigned leads, personal check-in/out, assigned campaigns, outreach queue execution, and personal follow-up tasks.
- **Initial Setup Wizard:** If zero users exist in the database, the app automatically routes to `/setup-admin` to bootstrap the organization with the Super Admin account.
- **Forced Password Reset:** Any user flagged with `mustChangePassword: true` (e.g. newly created employees) is prompted with a mandatory modal to choose a custom secure password upon initial login.
- **Account Disablement Check:** Blocked/disabled users are immediately rejected by JWT middleware.

### 2. Live Employee Attendance Management
- **One-Click Check-In / Check-Out:** Direct quick-action widget in the top navigation header and dedicated Attendance view.
- **Automatic Duration Calculation:** Accurately records work duration in decimal hours (e.g., `8.25 hrs`).
- **Late Threshold Detection:** Evaluates check-in time against organisation settings (default 09:00 AM + 15 min threshold). Automatically marks records as `LATE` or `ON_TIME`.
- **Admin Override:** Admins can manually correct or insert employee attendance records with reason logging.
- **Tri-Format Exports:** Direct client-side and server-side exports to **CSV**, **Excel (.xlsx)**, and **Print/PDF**.

### 3. Lead CRM & Duplicate Prevention
- **6-Stage Status Pipeline:** `NEW` ➔ `CONTACTED` ➔ `INTERESTED` ➔ `IN_PROGRESS` ➔ `CLOSED_WON` ➔ `CLOSED_LOST` (plus `DO_NOT_CONTACT`).
- **Multi-Rep Assignment:** Assign leads to specific employees or reassign across teams.
- **Robust Duplicate Detection:** Automatically checks against existing records during manual addition and CSV imports using a composite criteria:
  - Exact Email match
  - Exact Phone match
  - Exact Company match
- **Bulk CSV Lead Importer:** Automatically maps fields, parses rows, imports unique records, and returns clear summaries of skipped duplicates.

### 4. Cold Email Outreach Automation
- **Multi-Account SMTP Management:** Connect multiple mailboxes (Google Workspace, Office 365, SendGrid, Amazon SES) with AES-256 encrypted passwords.
- **Multi-Step Email Sequences:** Create campaigns with Step 1 (Day 0), Step 2 (Day 3), Step 3 (Day 7) sequences.
- **Dynamic Variable Interpolation:** Supports `{{first_name}}`, `{{last_name}}`, `{{company}}`, `{{designation}}`, `{{sender_name}}`, `{{sender_email}}`, and `{{sender_company}}`.
- **Open Tracking Pixel:** Inserts a zero-dimension tracking pixel (`/api/email/track/:trackingId.png`) logging open timestamps and counts.
- **1-Click Unsubscribe Handler:** Automatically injects compliant unsubscribe links into every outbound message (`/api/email/unsubscribe?leadId=...`).
- **Global Suppression List:** Prevents accidental outreach to opted-out contacts or blacklisted domains.

### 5. LinkedIn Outreach (100% Policy-Compliant)
- **Zero Risk Architecture:** No automated browser extensions or scrapers that violate LinkedIn Terms of Service or trigger bot detection algorithms.
- **User-Assisted Queue:** Generates personalized connection requests and InMail templates.
- **One-Click Execution:** Employees click **"Open LinkedIn Profile"** (opens prospect URL in a new tab) and **"Copy Message"** (copies pre-rendered message to clipboard with instant toast confirmation).
- **One-Click Status Tracking:** Update message status to `Sent`, `Replied`, or `Skipped` directly from the table.

### 6. WhatsApp Outreach Engine
- **Meta WhatsApp Cloud API v19.0:** Native integration architecture for enterprise-grade message delivery.
- **Simulated Sandbox Mode:** Built-in development fallback for testing without requiring active Meta API business verification.
- **Automated Opt-Out (`STOP`) Detection:** Inbound messages containing keywords like `STOP`, `UNSUBSCRIBE`, or `CANCEL` automatically push the lead into the Global Suppression List and transition lead status to `DO_NOT_CONTACT`.

### 7. Autonomous Follow-Up Dispatcher
- **Automated Sequence Progression:** 2-minute recurring background cron worker queries pending sequences whose scheduled delivery window has arrived.
- **Strict Halting Safeguards:** The engine **IMMEDIATELY TERMINATES** any future scheduled follow-ups for a lead if:
  1. The prospect replies to an email or message.
  2. The lead status changes to `INTERESTED`.
  3. The lead status changes to `NOT_INTERESTED` or `CLOSED_LOST`.
  4. The lead is marked as `DO_NOT_CONTACT` or unsubscribes.
- **Daily Sending Limits:** Enforces organisation-level quotas (e.g. 250 emails/day/account) to maintain sender domain reputation.

### 8. Follow-up & Task Command Center
- **Smart Queue Filters:** Instant segmented views for `Overdue`, `Today`, `Tomorrow`, `This Week`, and `All Tasks`.
- **Check-off Actions:** Mark items complete with timestamped activity logging.
- **Creation Dialog:** Quickly assign follow-ups across CRM leads and employees with custom priority flags (`LOW`, `MEDIUM`, `HIGH`).

### 9. Executive Analytics & Reporting
- **12 Real-Time KPI Cards:** Total Leads, Active Campaigns, Emails Dispatched, Open Rate %, Reply Rate %, Active Employees, Today's Attendance %, etc.
- **Multi-Channel Outreach Funnel:** Visual Recharts breakdown comparing Email vs. WhatsApp vs. LinkedIn conversion rates.
- **Attendance Heatmap & Punctuality:** Monthly trend analysis of on-time arrivals vs. late occurrences.
- **Employee Productivity Leaderboard:** Real-time metrics attributing closed revenue, contacted leads, and completed tasks to individual sales reps.

### 10. Immutable Audit Trail & Settings
- **Enterprise Activity Log:** Records every security-critical event with Actor Name, Role, Target Module, Action Taken, IP Address, User Agent, and ISO Timestamp.
- **Organisation Profile:** Rebrand application name, update working hours, punctuality thresholds, and daily rate limits.
- **1-Click Demo Lifecycle:** Admin tools to repopulate realistic demo data or completely purge the database for a clean production start.

---

## 🔒 Security & Compliance Architecture

| Security Domain | Implementation Standard |
| :--- | :--- |
| **Password Storage** | Salted `bcryptjs` hashing (10 rounds). Plaintext passwords are never logged or stored. |
| **Credential Encryption** | Sensitive SMTP credentials and WhatsApp API tokens are encrypted in the database using **AES-256-CBC** with an initialization vector (IV) and a 32-byte secret key. |
| **Authentication** | Stateless **JSON Web Tokens (JWT)** passed via HTTP `Bearer` Authorization headers with a configurable 24-hour expiration window. |
| **Role-Based Guards** | Express middleware verifies user roles before allowing access to administrative routes (`requireAdmin`). Blocked users are denied entry at the gateway. |
| **Anti-Spam Compliance** | Complies with **CAN-SPAM** and **GDPR**: every marketing email contains physical postal address headers, organization sender details, and an automated one-click unsubscribe endpoint. |
| **Suppression List** | Central suppression list guarantees that unsubscribed contacts and banned domains are never contacted by any campaign. |
| **Zero-Bot LinkedIn Flow** | 100% compliant with LinkedIn User Agreement by utilizing human-in-the-loop assisted workflow rather than dangerous automated scraping. |

---

## 🚀 Quick Start Guide (Local Development)

### Prerequisites
- **Node.js:** v20.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm:** v9.0.0 or higher

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/marketingflow.git
cd marketingflow

# Install dependencies for both server and client with one command
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` in the server directory:
```bash
# On Linux/macOS
cp server/.env.example server/.env

# On Windows (PowerShell)
Copy-Item server/.env.example server/.env
```

The default values in `server/.env` are ready for immediate local development with SQLite:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="marketingflow_super_secure_jwt_secret_key_2026_xyz!"
JWT_EXPIRES_IN="24h"
ENCRYPTION_KEY="marketingflow_32bytes_encryption!"
BASE_URL="http://localhost:5000"
AUTO_SEED=true
```

### 3. Initialize Database & Seed Demo Data
```bash
# Push Prisma schema to SQLite database and seed initial demo data
npm run prisma:push
npm run seed
```

### 4. Build Frontend & Run Application
```bash
# Option A: Run Full Stack in Production Mode (Single Port 5000)
npm run build:client
npm start

# Option B: Run in Concurrent Development Mode (Hot Reloading)
# Terminal 1 (Backend API & Cron Worker on port 5000):
npm run dev:server

# Terminal 2 (Vite React Client on port 5173 with proxy to 5000):
npm run dev:client
```

Open your browser and navigate to:
👉 **`http://localhost:5000`** (Production mode) or **`http://localhost:5173`** (Vite Dev mode)

---

## 🔑 Pre-Seeded Demo Credentials

The database comes pre-populated with realistic accounts. You can log in using the credentials below, or click any **"Quick-Fill Demo Account"** pill directly on the Login screen:

| Role | Name | Email | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Sarah Vance | `admin@marketingflow.io` | `Admin@12345` | **Full Access** (All features, settings, employee management) |
| **Employee (Sales Rep)** | Alex Rivera | `alex.rivera@marketingflow.io` | `Emp@12345` | Assigned leads, attendance check-in, campaigns, outreach |
| **Employee (Outreach)** | Maya Lin | `maya.lin@marketingflow.io` | `Emp@12345` | Assigned leads, attendance check-in, campaigns, outreach |
| **Employee (BDR)** | Marcus Chen | `marcus.chen@marketingflow.io` | `Emp@12345` | Assigned leads, attendance check-in, campaigns, outreach |
| **Employee (SDR)** | Elena Rostova | `elena.rostova@marketingflow.io` | `Emp@12345` | Assigned leads, attendance check-in, campaigns, outreach |

> 💡 **Tip:** All other demo employees (`jordan.taylor@...`, `priya.patel@...`, `david.kim@...`, etc.) use the standard default password: `Emp@12345`.

---

## 🚢 Production Deployment Guide

### 1. Docker & Docker Compose (Recommended)

MarketingFlow includes a multi-stage `Dockerfile` and a complete `docker-compose.yml` pre-configured with PostgreSQL 16 and Redis.

```bash
# 1. Build and boot the entire stack in the background
docker-compose up -d --build

# 2. View container logs
docker-compose logs -f app

# 3. Stop services
docker-compose down
```

The stack exposes:
- **MarketingFlow App:** `http://localhost:5000`
- **PostgreSQL Database:** `localhost:5432`
- **Redis Cache:** `localhost:6379`

Data volumes for PostgreSQL (`postgres_data`) and Redis (`redis_data`) ensure complete persistence across container restarts.

---

### 2. Cloud Platforms (Render, Supabase, Neon)

#### Step 1: Provision a Managed PostgreSQL Database
Create a free database on [Supabase](https://supabase.com/) or [Neon](https://neon.tech/) and copy your connection string:
```text
postgresql://postgres:[PASSWORD]@[HOST]:5432/marketingflow?schema=public
```

#### Step 2: Deploy Backend to Render / Railway / Fly.io
1. Connect your Git repository.
2. Set Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `DATABASE_URL` = `<Your PostgreSQL Connection String>`
   - `JWT_SECRET` = `<Generate a 32+ character random string>`
   - `ENCRYPTION_KEY` = `<Generate exactly 32 random characters>`
   - `BASE_URL` = `https://your-service.onrender.com`
   - `AUTO_SEED` = `true` (or `false` for completely clean production)
3. Set Build Command:
   ```bash
   npm run install:all && npm run build:client && npx prisma generate --schema=server/prisma/schema.postgresql.prisma
   ```
4. Set Start Command:
   ```bash
   node server/entrypoint.js
   ```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Required | Default Example |
| :--- | :--- | :---: | :--- |
| `PORT` | HTTP server listener port | No | `5000` |
| `DATABASE_URL` | Database connection string (SQLite or PostgreSQL) | Yes | `file:./dev.db` or `postgresql://...` |
| `JWT_SECRET` | Secret key for signing and verifying user session tokens | Yes | `marketingflow_super_secure_jwt_secret_2026!` |
| `JWT_EXPIRES_IN` | Token duration before session expiration | No | `24h` |
| `ENCRYPTION_KEY` | AES-256 symmetric cipher key (must be exactly 32 chars) | Yes | `marketingflow_32bytes_encryption!` |
| `BASE_URL` | Public domain URL for open tracking pixels & unsubscribe links | Yes | `http://localhost:5000` |
| `AUTO_SEED` | Automatically run demo seeding on startup if empty | No | `true` |
| `NODE_ENV` | Environment mode (`development` or `production`) | No | `development` |

---

## 📡 REST API Reference

All protected API endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials, returns user object and JWT token |
| `POST` | `/api/auth/setup-admin` | Public | Initializes Super Admin if zero users exist |
| `GET` | `/api/auth/me` | Authenticated | Fetches current user profile and session state |
| `POST` | `/api/auth/change-password` | Authenticated | Updates user password, clears `mustChangePassword` |
| `POST` | `/api/auth/logout` | Authenticated | Terminates session and logs audit trail event |

### 👥 Employees (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/users` | Admin | Lists all employees with search & department filters |
| `POST` | `/api/users` | Admin | Creates new employee, auto-generates credentials |
| `PUT` | `/api/users/:id` | Admin | Updates employee profile and designation |
| `PATCH` | `/api/users/:id/status` | Admin | Toggles employee status between `ACTIVE` and `DISABLED` |
| `POST` | `/api/users/:id/reset-password`| Admin | Resets password, returns one-time temporary credential |

### ⏱️ Attendance (`/api/attendance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/attendance/today` | Authenticated | Returns current user's check-in status for today |
| `POST` | `/api/attendance/check-in` | Authenticated | Clocks in employee, evaluates late punctuality threshold |
| `POST` | `/api/attendance/check-out` | Authenticated | Clocks out employee, computes total working hours |
| `GET` | `/api/attendance/history` | Authenticated | Fetches attendance logs (filtered to user, or all for Admin) |
| `POST` | `/api/attendance/override` | Admin | Manually creates or edits employee attendance record |

### 💼 Lead CRM (`/api/leads`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/leads` | Authenticated | Lists CRM leads with status and assignee filtering |
| `POST` | `/api/leads` | Authenticated | Creates a new lead with duplicate prevention |
| `PUT` | `/api/leads/:id` | Authenticated | Updates lead details and pipeline status |
| `DELETE` | `/api/leads/:id` | Admin | Deletes a lead record |
| `POST` | `/api/leads/import` | Authenticated | Bulk imports CSV file with duplicate deduplication |
| `GET` | `/api/leads/export` | Authenticated | Exports CRM leads to CSV format |

### 📨 Multi-Channel Outreach (`/api`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/email/accounts` | Authenticated | Lists configured SMTP mailboxes |
| `POST` | `/api/email/accounts` | Admin | Connects new SMTP mailbox (passwords encrypted AES-256) |
| `POST` | `/api/email/send-test` | Admin | Dispatches test email to verify SMTP handshake |
| `GET` | `/api/email/track/:trackingId.png` | Public | 1x1 transparent open tracking pixel |
| `GET` | `/api/email/unsubscribe` | Public | One-click unsubscribe endpoint adding lead to suppression list |
| `GET` | `/api/linkedin/queue` | Authenticated | Lists assigned LinkedIn outreach queue |
| `PATCH`| `/api/linkedin/messages/:id` | Authenticated | Updates LinkedIn outreach state (`Sent`, `Replied`, `Skipped`) |
| `GET` | `/api/whatsapp/messages` | Authenticated | Retrieves WhatsApp conversation history |
| `POST` | `/api/whatsapp/send` | Authenticated | Dispatches WhatsApp message via Meta Cloud API / Sandbox |

### 📈 Campaigns & Sequences (`/api/campaigns`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/campaigns` | Authenticated | Lists all marketing campaigns and metrics |
| `POST` | `/api/campaigns` | Authenticated | Creates campaign with multi-step sequence schedule |
| `POST` | `/api/campaigns/:id/start` | Authenticated | Activates campaign and enqueues Step 1 messages |
| `POST` | `/api/campaigns/:id/pause` | Authenticated | Pauses active campaign sequence execution |

### 📊 Dashboard & Reports (`/api/dashboard`, `/api/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/dashboard` | Authenticated | Returns 12 KPI cards, charts, and activity summary |
| `GET` | `/api/reports/performance`| Authenticated | Sales rep productivity and outreach conversion metrics |
| `GET` | `/api/reports/attendance` | Authenticated | Monthly workforce attendance breakdown |
| `GET` | `/api/reports/marketing` | Authenticated | Attribution ROI across Email, LinkedIn, and WhatsApp |

---

## 🧪 Automated Testing & Verification

MarketingFlow features an automated end-to-end integration test suite (`server/src/tests/testAll.js`) verifying every core workflow.

### Running the Test Suite
```bash
# Execute the comprehensive test runner
npm test
```

### Test Suite Coverage (16/16 Passed)
```text
🧪 Starting MarketingFlow Comprehensive Test Suite...

  ✅ PASS: GET /health endpoint
  ✅ PASS: POST /api/auth/login with invalid password fails (401)
  ✅ PASS: POST /api/auth/login for Super Admin succeeds
  ✅ PASS: POST /api/auth/login for Employee Alex succeeds
  ✅ PASS: Role protection: Employee blocked from Admin-only routes (403)
  ✅ PASS: Admin creates new employee with auto-generated credentials
  ✅ PASS: Employee check-in & check-out lifecycle
  ✅ PASS: POST /api/leads creates CRM lead with duplicate check
  ✅ PASS: POST /api/leads/import bulk imports leads and detects duplicates
  ✅ PASS: POST /api/campaigns creates campaign with sequences
  ✅ PASS: POST /api/campaigns/:id/start and queue processing runs
  ✅ PASS: GET /api/email/unsubscribe handles opt-out compliance
  ✅ PASS: GET /api/reports/performance, attendance, and marketing
  ✅ PASS: GET /api/activity-logs returns audit events
  ✅ PASS: GET /api/dashboard returns 12 KPI metrics & charts
  ✅ PASS: POST /api/auth/logout logs user out cleanly

========================================
Test Results: 16 Passed, 0 Failed
========================================
```

---

## 🗄️ Database Schema (Prisma)

MarketingFlow is built on a relational architecture supporting both **SQLite** for rapid local development and **PostgreSQL** for enterprise production scale:

```mermaid
erDiagram
    OrganisationSetting {
        string id PK
        string orgName
        string workStartTime
        string workEndTime
        int lateThresholdMinutes
        int defaultEmailDailyLimit
    }

    User ||--o{ Attendance : "logs"
    User ||--o{ Lead : "manages"
    User ||--o{ Campaign : "owns"
    User ||--o{ Followup : "assigned"
    User ||--o{ Task : "assigned"
    User ||--o{ ActivityLog : "triggers"

    User {
        string id PK
        string email UK
        string passwordHash
        string role "ADMIN | EMPLOYEE"
        string firstName
        string lastName
        string employeeId UK
        string status "ACTIVE | DISABLED"
        boolean mustChangePassword
    }

    Attendance {
        string id PK
        string userId FK
        datetime date
        datetime checkIn
        datetime checkOut
        float totalHours
        string status "ON_TIME | LATE | HALF_DAY"
    }

    Lead ||--o{ CampaignLead : "enrolled"
    Lead ||--o{ Followup : "has"
    Lead ||--o{ EmailEvent : "generates"
    Lead ||--o{ WhatsAppMessage : "receives"
    Lead ||--o{ LinkedInMessage : "receives"

    Lead {
        string id PK
        string email
        string phone
        string company
        string status "NEW | CONTACTED | INTERESTED | CLOSED_WON | CLOSED_LOST"
        string assignedToId FK
    }

    Campaign ||--o{ CampaignLead : "targets"
    Campaign ||--o{ EmailSequence : "schedules"

    Campaign {
        string id PK
        string name
        string type "EMAIL | WHATSAPP | LINKEDIN | MULTI_CHANNEL"
        string status "DRAFT | ACTIVE | PAUSED | COMPLETED"
    }

    SuppressionList {
        string id PK
        string email UK
        string reason "UNSUBSCRIBED | BOUNCED | COMPLAINT"
    }
```

---

## ❓ Troubleshooting & FAQ

### 1. How do I change the organization name and branding?
Log in as Super Admin (`admin@marketingflow.io`), click **Settings** in the left sidebar, update the **Organisation Name**, **Working Hours**, and **Daily Limits**, then click **Save Changes**. The top-left branding updates immediately across the entire app.

### 2. Can I switch from SQLite to PostgreSQL without code changes?
Yes! Simply update the `DATABASE_URL` environment variable to your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
```
When `server/entrypoint.js` or `npm start` runs, MarketingFlow automatically detects PostgreSQL and applies `prisma/schema.postgresql.prisma`.

### 3. How do I reset the demo environment to factory defaults?
Navigate to **Settings** ➔ Scroll down to the **Demo Data Management** section ➔ Click **"Reset Demo Data"**. This repopulates the standard 10 employees, 50 leads, 7 campaigns, and attendance records.

### 4. What happens if an employee forgets their password?
The Super Admin navigates to **Employees** in the sidebar, locates the employee, and clicks **"Reset Password"**. The system generates a secure temporary password and displays a copy-to-clipboard dialog to share directly with the employee. Upon their next login, they will be prompted to set a new password.

### 5. Why does LinkedIn outreach use a manual queue instead of automated scraping?
Automated LinkedIn scrapers frequently trigger account restrictions, CAPTCHAs, and permanent profile bans. MarketingFlow uses a **100% policy-compliant, rep-assisted workflow** where the system dynamically merges personalized tags and provides instant **"Open Profile"** and **"Copy Message"** shortcuts, achieving 10x rep speed without any account ban risks.

---

## 📄 License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute it for personal or commercial applications.
