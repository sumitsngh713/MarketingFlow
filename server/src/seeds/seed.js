import bcrypt from 'bcryptjs';
import prisma from '../utils/db.js';
import { encrypt } from '../utils/crypto.js';

export async function seedDemoData() {
  console.log('Seeding MarketingFlow demo data...');

  // 1. Ensure Organisation Setting
  await prisma.organisationSetting.upsert({
    where: { id: 'default-org' },
    update: {
      orgName: 'MarketingFlow',
      address: '100 Innovation Blvd, Tech Park, Suite 400',
      timezone: 'America/New_York',
      workStartTime: '09:00',
      workEndTime: '18:00',
      lateThresholdMinutes: 15,
      defaultEmailDailyLimit: 250,
      defaultFollowupDelayDays: 3,
    },
    create: {
      id: 'default-org',
      orgName: 'MarketingFlow',
      address: '100 Innovation Blvd, Tech Park, Suite 400',
      timezone: 'America/New_York',
      workStartTime: '09:00',
      workEndTime: '18:00',
      lateThresholdMinutes: 15,
      defaultEmailDailyLimit: 250,
      defaultFollowupDelayDays: 3,
    },
  });

  // 2. Super Admin user
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const employeeDefaultHash = await bcrypt.hash('Emp@12345', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@marketingflow.io' },
    update: {
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email: 'admin@marketingflow.io',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      firstName: 'Sarah',
      lastName: 'Vance',
      employeeId: 'ADM-001',
      phone: '+1 (555) 019-2831',
      designation: 'Managing Director & Super Admin',
      department: 'Executive',
      joiningDate: new Date('2023-01-10'),
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  });

  // 3. 10 Employees
  const employeeData = [
    { firstName: 'Alex', lastName: 'Rivera', email: 'alex.rivera@marketingflow.io', employeeId: 'EMP-001', phone: '+1 (555) 234-5671', designation: 'Senior SDR', department: 'Sales' },
    { firstName: 'Maya', lastName: 'Patel', email: 'maya.patel@marketingflow.io', employeeId: 'EMP-002', phone: '+1 (555) 234-5672', designation: 'Account Executive', department: 'Sales' },
    { firstName: 'Liam', lastName: 'Chen', email: 'liam.chen@marketingflow.io', employeeId: 'EMP-003', phone: '+1 (555) 234-5673', designation: 'Growth Marketer', department: 'Marketing' },
    { firstName: 'Emma', lastName: 'Johnson', email: 'emma.johnson@marketingflow.io', employeeId: 'EMP-004', phone: '+1 (555) 234-5674', designation: 'Inbound Specialist', department: 'Marketing' },
    { firstName: 'Daniel', lastName: 'Kim', email: 'daniel.kim@marketingflow.io', employeeId: 'EMP-005', phone: '+1 (555) 234-5675', designation: 'Outreach Manager', department: 'Marketing' },
    { firstName: 'Sophia', lastName: 'Taylor', email: 'sophia.taylor@marketingflow.io', employeeId: 'EMP-006', phone: '+1 (555) 234-5676', designation: 'Customer Success Specialist', department: 'Support' },
    { firstName: 'Lucas', lastName: 'Moreno', email: 'lucas.moreno@marketingflow.io', employeeId: 'EMP-007', phone: '+1 (555) 234-5677', designation: 'Lead Generation Executive', department: 'Sales' },
    { firstName: 'Olivia', lastName: 'Brown', email: 'olivia.brown@marketingflow.io', employeeId: 'EMP-008', phone: '+1 (555) 234-5678', designation: 'Content & Copy Strategist', department: 'Marketing' },
    { firstName: 'Ethan', lastName: 'Davis', email: 'ethan.davis@marketingflow.io', employeeId: 'EMP-009', phone: '+1 (555) 234-5679', designation: 'B2B Sales Representative', department: 'Sales' },
    { firstName: 'Ava', lastName: 'Martinez', email: 'ava.martinez@marketingflow.io', employeeId: 'EMP-010', phone: '+1 (555) 234-5680', designation: 'Business Development Rep', department: 'Sales' },
  ];

  const createdEmployees = [];
  for (const emp of employeeData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: { status: 'ACTIVE' },
      create: {
        ...emp,
        passwordHash: employeeDefaultHash,
        role: 'EMPLOYEE',
        joiningDate: new Date('2024-03-15'),
        status: 'ACTIVE',
        mustChangePassword: false,
      },
    });
    createdEmployees.push(user);
  }

  // 4. Default SMTP & WhatsApp Accounts
  const emailAccount = await prisma.emailAccount.upsert({
    where: { id: 'default-smtp-1' },
    update: {},
    create: {
      id: 'default-smtp-1',
      accountName: 'MarketingFlow Primary Outreach',
      senderName: 'MarketingFlow Growth Team',
      senderEmail: 'outreach@marketingflow.io',
      smtpHost: 'smtp.sendgrid.net',
      smtpPort: 587,
      smtpUser: 'apikey',
      smtpPasswordEncrypted: encrypt('SG.demo_api_key_placeholder'),
      encryption: 'TLS',
      dailySendingLimit: 500,
      sentToday: 42,
      status: 'ACTIVE',
    },
  });

  const waAccount = await prisma.whatsAppAccount.upsert({
    where: { id: 'default-wa-1' },
    update: {},
    create: {
      id: 'default-wa-1',
      accountName: 'MarketingFlow Official WhatsApp Cloud',
      phoneNumberId: '109823482390192',
      businessAccountId: '29837192837192',
      accessTokenEncrypted: encrypt('EAABwz_demo_access_token_placeholder'),
      dailyLimit: 1000,
      status: 'ACTIVE',
    },
  });

  // 5. 50 Realistic Leads
  const companies = [
    { comp: 'Apex Cloud Systems', ind: 'Cloud Infrastructure', loc: 'Austin, TX' },
    { comp: 'NovaPay Global', ind: 'FinTech', loc: 'New York, NY' },
    { comp: 'Starlight BioTech', ind: 'Healthcare', loc: 'Boston, MA' },
    { comp: 'Quantum Dynamics', ind: 'AI / Robotics', loc: 'San Francisco, CA' },
    { comp: 'BluePeak Analytics', ind: 'Data Analytics', loc: 'Seattle, WA' },
    { comp: 'Vanguard Security Labs', ind: 'Cybersecurity', loc: 'Denver, CO' },
    { comp: 'Ironclad Logistics', ind: 'Supply Chain', loc: 'Chicago, IL' },
    { comp: 'Horizon Health', ind: 'HealthTech', loc: 'Atlanta, GA' },
    { comp: 'Vertex Digital Media', ind: 'Digital Media', loc: 'Los Angeles, CA' },
    { comp: 'Pulse Retail CRM', ind: 'E-Commerce SaaS', loc: 'Miami, FL' },
  ];

  const leadStatuses = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'CONVERTED', 'NOT_INTERESTED'];
  const createdLeads = [];

  const firstNames = ['David', 'Jessica', 'Robert', 'Jennifer', 'Michael', 'Amanda', 'Christopher', 'Melissa', 'Matthew', 'Ashley'];
  const lastNames = ['Miller', 'Wilson', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia'];
  const designations = ['Chief Technology Officer', 'VP of Sales', 'Head of Growth', 'Marketing Director', 'Product Manager', 'Chief Marketing Officer', 'Director of RevOps'];

  for (let i = 0; i < 50; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[Math.floor(i / 5) % lastNames.length] + (i > 25 ? ' Jr.' : '');
    const compObj = companies[i % companies.length];
    const desig = designations[i % designations.length];
    const assignedEmp = createdEmployees[i % createdEmployees.length];
    const status = leadStatuses[i % leadStatuses.length];
    const leadNum = `LD-${String(i + 1).padStart(4, '0')}`;
    const email = `${fName.toLowerCase()}.${lName.replace(/[^a-z]/gi, '').toLowerCase()}@${compObj.comp.replace(/[^a-zA-Z]/g, '').toLowerCase()}.io`;

    const lead = await prisma.lead.upsert({
      where: { leadNumber: leadNum },
      update: {},
      create: {
        leadNumber: leadNum,
        name: `${fName} ${lName}`,
        designation: desig,
        company: compObj.comp,
        email,
        phone: `+1 (555) ${300 + i}-${1000 + i}`,
        linkedinUrl: `https://linkedin.com/in/${fName.toLowerCase()}-${lName.toLowerCase()}-${i}`,
        whatsappNumber: `+1555${300 + i}${1000 + i}`,
        website: `https://${compObj.comp.replace(/[^a-zA-Z]/g, '').toLowerCase()}.io`,
        industry: compObj.ind,
        location: compObj.loc,
        source: i % 3 === 0 ? 'LinkedIn' : i % 3 === 1 ? 'Website Form' : 'Outbound SDR',
        assignedEmployeeId: assignedEmp.id,
        status,
        lastContactedAt: new Date(Date.now() - (i % 10) * 86400000),
        nextFollowupDate: new Date(Date.now() + ((i % 5) - 2) * 86400000).toISOString().split('T')[0],
        notes: `Interested in evaluating marketing automation for their sales team of ${10 + i * 2} reps.`,
      },
    });
    createdLeads.push(lead);
  }

  // 6. 3 Email Campaigns
  const emailCampaign1 = await prisma.campaign.upsert({
    where: { id: 'demo-campaign-email-1' },
    update: {},
    create: {
      id: 'demo-campaign-email-1',
      name: 'Q4 Enterprise SaaS Cold Outreach',
      channel: 'EMAIL',
      status: 'RUNNING',
      ownerId: createdEmployees[0].id,
      senderAccountId: emailAccount.id,
      subject: 'Quick question regarding revenue operations at {{company}}',
      body: 'Hi {{first_name}},\n\nI noticed you lead operations at {{company}}. We help organisations scale their outreach with automated follow-ups and CRM attribution.\n\nWould you be open to a 10-minute introductory call this Thursday?\n\nBest regards,\n{{employee_name}}',
      intervalMinutes: 5,
      dailyLimit: 50,
      sequences: {
        create: [
          {
            stepNumber: 1,
            delayDays: 3,
            subject: 'Following up on revenue operations at {{company}}',
            body: 'Hi {{first_name}},\n\nWanted to float this back to the top of your inbox. Did you get a chance to review my previous note?\n\nBest,\n{{employee_name}}',
          },
          {
            stepNumber: 2,
            delayDays: 7,
            subject: 'Case study: How Apex scaled conversions by 38%',
            body: 'Hi {{first_name}},\n\nSharing a quick one-page breakdown on how similar teams in {{industry}} automated lead generation.\n\nLet me know if you would like me to share the link.\n\nRegards,\n{{employee_name}}',
          },
        ],
      },
    },
  });

  const emailCampaign2 = await prisma.campaign.upsert({
    where: { id: 'demo-campaign-email-2' },
    update: {},
    create: {
      id: 'demo-campaign-email-2',
      name: 'Inbound High-Intent Nurture Sequence',
      channel: 'EMAIL',
      status: 'RUNNING',
      ownerId: createdEmployees[1].id,
      senderAccountId: emailAccount.id,
      subject: 'Welcome to MarketingFlow – Your free trial is active',
      body: 'Hi {{first_name}},\n\nThanks for your interest in MarketingFlow. I would love to ensure your team is set up for success.\n\nCheers,\n{{employee_name}}',
      dailyLimit: 100,
    },
  });

  const emailCampaign3 = await prisma.campaign.upsert({
    where: { id: 'demo-campaign-email-3' },
    update: {},
    create: {
      id: 'demo-campaign-email-3',
      name: 'Product Demo Retargeting Sequence',
      channel: 'EMAIL',
      status: 'PAUSED',
      ownerId: createdEmployees[2].id,
      senderAccountId: emailAccount.id,
      subject: '{{first_name}}, here is the demo recording and feature list',
      body: 'Hi {{first_name}},\n\nFollowing up on our recent demonstration for {{company}}.\n\nBest,\n{{employee_name}}',
      dailyLimit: 40,
    },
  });

  // Attach leads to Email Campaign 1
  for (let i = 0; i < 20; i++) {
    const lead = createdLeads[i];
    const status = i < 8 ? 'OPENED' : i < 12 ? 'REPLIED' : i < 15 ? 'INTERESTED' : 'SENT';

    const cl = await prisma.campaignLead.upsert({
      where: { campaignId_leadId: { campaignId: emailCampaign1.id, leadId: lead.id } },
      update: {},
      create: {
        campaignId: emailCampaign1.id,
        leadId: lead.id,
        currentStep: i < 5 ? 1 : 0,
        status,
        sentAt: new Date(Date.now() - 3600000 * (i + 1)),
        openedAt: ['OPENED', 'REPLIED', 'INTERESTED'].includes(status) ? new Date() : null,
        repliedAt: ['REPLIED', 'INTERESTED'].includes(status) ? new Date() : null,
      },
    });

    // Record Email Events
    await prisma.emailEvent.upsert({
      where: { trackingId: `trk_demo_${i}` },
      update: {},
      create: {
        campaignLeadId: cl.id,
        eventType: 'SENT',
        trackingId: `trk_demo_${i}`,
      },
    });

    if (['REPLIED', 'INTERESTED'].includes(status)) {
      await prisma.emailEvent.upsert({
        where: { trackingId: `trk_rep_${i}` },
        update: {},
        create: {
          campaignLeadId: cl.id,
          eventType: 'REPLIED',
          trackingId: `trk_rep_${i}`,
        },
      });
    }
  }

  // 7. 2 WhatsApp Campaigns
  const waCampaign1 = await prisma.campaign.upsert({
    where: { id: 'demo-campaign-wa-1' },
    update: {},
    create: {
      id: 'demo-campaign-wa-1',
      name: 'VIP Webinar Invitation Broadcast',
      channel: 'WHATSAPP',
      status: 'RUNNING',
      ownerId: createdEmployees[3].id,
      senderAccountId: waAccount.id,
      body: 'Hello {{first_name}}! We are hosting a live session on scaling sales teams. Would you or someone from {{company}} like to join us live?',
      dailyLimit: 150,
    },
  });

  const waCampaign2 = await prisma.campaign.upsert({
    where: { id: 'demo-campaign-wa-2' },
    update: {},
    create: {
      id: 'demo-campaign-wa-2',
      name: 'Enterprise Renewal & Upsell Notice',
      channel: 'WHATSAPP',
      status: 'PAUSED',
      ownerId: createdEmployees[4].id,
      senderAccountId: waAccount.id,
      body: 'Hi {{first_name}}, this is {{employee_name}} from MarketingFlow. Checking in on your upcoming subscription anniversary.',
      dailyLimit: 50,
    },
  });

  // WhatsApp Messages
  for (let i = 20; i < 30; i++) {
    const lead = createdLeads[i];
    await prisma.whatsAppMessage.create({
      data: {
        campaignId: waCampaign1.id,
        leadId: lead.id,
        employeeId: createdEmployees[3].id,
        messageText: `Hello ${lead.name.split(' ')[0]}! We are hosting a live session on scaling sales teams. Would you or someone from ${lead.company} like to join us live?`,
        status: i % 3 === 0 ? 'READ' : i % 3 === 1 ? 'REPLIED' : 'SENT',
        whatsappMessageId: `wamid.HBgL${i}98234`,
        sentAt: new Date(),
      },
    });
  }

  // 8. 2 LinkedIn Campaigns (User-Assisted)
  const liCampaign1 = await prisma.campaign.upsert({
    where: { id: 'demo-campaign-li-1' },
    update: {},
    create: {
      id: 'demo-campaign-li-1',
      name: 'Tech Founders Direct Outreach',
      channel: 'LINKEDIN',
      status: 'RUNNING',
      ownerId: createdEmployees[0].id,
      body: 'Hi {{first_name}}, I came across your profile while researching innovators in {{industry}}. Impressed by what {{company}} is building. Would love to connect here on LinkedIn!',
      dailyLimit: 25,
    },
  });

  const liCampaign2 = await prisma.campaign.upsert({
    where: { id: 'demo-campaign-li-2' },
    update: {},
    create: {
      id: 'demo-campaign-li-2',
      name: 'VP of Engineering Connection Campaign',
      channel: 'LINKEDIN',
      status: 'RUNNING',
      ownerId: createdEmployees[1].id,
      body: 'Hi {{first_name}}, great to see your technical leadership at {{company}}. Connecting with fellow leaders in {{location}}.',
      dailyLimit: 30,
    },
  });

  // LinkedIn Queue Items
  for (let i = 30; i < 42; i++) {
    const lead = createdLeads[i];
    const statuses = ['NOT_CONTACTED', 'CONNECTION_REQUESTED', 'CONNECTED', 'MESSAGE_SENT', 'REPLIED', 'INTERESTED'];
    const st = statuses[i % statuses.length];

    await prisma.linkedInMessage.create({
      data: {
        campaignId: liCampaign1.id,
        leadId: lead.id,
        employeeId: createdEmployees[0].id,
        messageText: `Hi ${lead.name.split(' ')[0]}, I came across your profile while researching innovators in ${lead.industry}. Impressed by what ${lead.company} is building. Would love to connect here on LinkedIn!`,
        status: st,
        sentAt: ['CONNECTED', 'MESSAGE_SENT', 'REPLIED', 'INTERESTED'].includes(st) ? new Date() : null,
      },
    });
  }

  // 9. 30 Realistic Attendance Records
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - dayOffset);
    const dateStr = dateObj.toISOString().split('T')[0];

    // For all 10 employees
    for (let j = 0; j < createdEmployees.length; j++) {
      const emp = createdEmployees[j];
      const isAbsent = dayOffset === 1 && j === 8;
      const isLate = j % 4 === 1;

      if (isAbsent) {
        await prisma.attendance.upsert({
          where: { userId_date: { userId: emp.id, date: dateStr } },
          update: {},
          create: {
            userId: emp.id,
            date: dateStr,
            status: 'ABSENT',
            remarks: 'Sick leave reported',
          },
        });
      } else {
        const inHour = isLate ? 9 : 8;
        const inMin = isLate ? 35 : Math.floor(Math.random() * 45) + 15;
        const checkIn = new Date(dateObj);
        checkIn.setHours(inHour, inMin, 0, 0);

        const checkOut = new Date(dateObj);
        checkOut.setHours(17, 30 + (j % 25), 0, 0);

        const workingMinutes = Math.floor((checkOut - checkIn) / 60000);

        await prisma.attendance.upsert({
          where: { userId_date: { userId: emp.id, date: dateStr } },
          update: {},
          create: {
            userId: emp.id,
            date: dateStr,
            checkInTime: checkIn,
            checkOutTime: dayOffset === 0 ? null : checkOut, // today might not have checked out yet
            workingHoursMinutes: dayOffset === 0 ? 0 : workingMinutes,
            status: isLate ? 'LATE' : 'PRESENT',
            remarks: isLate ? 'Traffic congestion on bridge' : null,
          },
        });
      }
    }
  }

  // 10. Follow-ups
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const followupItems = [
    { lead: createdLeads[0], title: 'Review custom enterprise proposal with CTO', due: todayStr, ch: 'EMAIL', emp: createdEmployees[0] },
    { lead: createdLeads[1], title: 'Demo follow-up & security questionnaire', due: todayStr, ch: 'CALL', emp: createdEmployees[1] },
    { lead: createdLeads[2], title: 'Send revised contract pricing for Q4', due: todayStr, ch: 'WHATSAPP', emp: createdEmployees[0] },
    { lead: createdLeads[3], title: 'Confirm webinar attendee list', due: tomorrowStr, ch: 'EMAIL', emp: createdEmployees[2] },
    { lead: createdLeads[4], title: 'Schedule product walkthrough with VP Sales', due: tomorrowStr, ch: 'LINKEDIN', emp: createdEmployees[1] },
    { lead: createdLeads[5], title: 'Check procurement status', due: yesterdayStr, ch: 'CALL', emp: createdEmployees[3], comp: false },
    { lead: createdLeads[6], title: 'Quarterly review check-in', due: yesterdayStr, ch: 'EMAIL', emp: createdEmployees[0], comp: true },
  ];

  for (const item of followupItems) {
    await prisma.followup.create({
      data: {
        leadId: item.lead.id,
        title: item.title,
        dueDate: item.due,
        channel: item.ch,
        assignedEmployeeId: item.emp.id,
        completed: item.comp || false,
        completedAt: item.comp ? new Date() : null,
      },
    });
  }

  // 11. Initial Notifications
  const notifTargets = [superAdmin, createdEmployees[0], createdEmployees[1]];
  for (const u of notifTargets) {
    await prisma.notification.createMany({
      data: [
        { userId: u.id, title: 'Welcome to MarketingFlow', message: 'Your organization workspace is active and ready.', type: 'SUCCESS' },
        { userId: u.id, title: 'Daily Follow-ups Due', message: 'You have 3 follow-ups scheduled for today.', type: 'INFO' },
        { userId: u.id, title: 'Campaign Outreach Update', message: 'Q4 Enterprise SaaS Campaign is actively dispatching.', type: 'INFO' },
      ],
    });
  }

  // 12. Initial Activity Logs
  await prisma.activityLog.createMany({
    data: [
      { userId: superAdmin.id, userName: 'Sarah Vance', role: 'ADMIN', action: 'DEMO_DATA_INITIALIZED', module: 'SETTINGS', description: 'Loaded full realistic demo dataset with 10 employees, 50 leads, and 7 campaigns.' },
      { userId: createdEmployees[0].id, userName: 'Alex Rivera', role: 'EMPLOYEE', action: 'CHECK_IN', module: 'ATTENDANCE', description: 'Checked in at 08:45 AM (PRESENT).' },
      { userId: createdEmployees[1].id, userName: 'Maya Patel', role: 'EMPLOYEE', action: 'CHECK_IN', module: 'ATTENDANCE', description: 'Checked in at 09:12 AM (LATE).' },
      { userId: superAdmin.id, userName: 'Sarah Vance', role: 'ADMIN', action: 'CAMPAIGN_STARTED', module: 'CAMPAIGNS', description: 'Started Q4 Enterprise SaaS Cold Outreach campaign.' },
    ],
  });

  console.log('✅ Demo data seeding completed successfully!');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDemoData()
    .catch((e) => {
      console.error('Seeding error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
