// Fills the database with a demo account and sample leads/follow-ups.
// Usage: npm run seed   (reads MONGODB_URI from server/.env)
//
// Re-running it resets the demo account's data. Other accounts are not touched.
const bcrypt = require('bcryptjs');
const { env, assertRequiredEnv } = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Lead = require('../src/models/Lead');
const Activity = require('../src/models/Activity');

const DEMO_USER = {
  name: 'Demo User',
  email: process.env.SEED_EMAIL || 'demo@leadflow.test',
  password: process.env.SEED_PASSWORD || 'DemoPass@2026',
};

const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

const SAMPLE_LEADS = [
  { name: 'Ananya Rao', company: 'Bloom Bakery', email: 'ananya@bloombakery.in', phone: '+91 98450 11223', serviceInterest: 'Website Development', source: 'Website', budget: 60000, stage: 'New' },
  { name: 'Rohan Mehta', company: 'UrbanFit Gyms', email: 'rohan@urbanfit.in', serviceInterest: 'Social Media Marketing', source: 'Referral', budget: 45000, stage: 'Contacted' },
  { name: 'Kavya Iyer', company: 'Iyer Legal Associates', phone: '+91 99001 22334', serviceInterest: 'SEO', source: 'Email', budget: 30000, stage: 'Qualified' },
  { name: 'Arjun Singh', company: 'Singh Motors', email: 'arjun@singhmotors.co.in', serviceInterest: 'Paid Ads', source: 'Direct Outreach', budget: 120000, stage: 'Proposal Sent', notes: 'Wants Google + Meta ads for the festive season.' },
  { name: 'Neha Kapoor', company: 'Kapoor Interiors', email: 'neha@kapoorinteriors.com', serviceInterest: 'Branding', source: 'Social Media', budget: 80000, stage: 'Won' },
  { name: 'Vikram Desai', company: 'Desai Exports', email: 'vikram@desaiexports.com', serviceInterest: 'Website Development', source: 'Website', budget: 150000, stage: 'Lost', notes: 'Went with an in-house team.' },
];

async function seed() {
  assertRequiredEnv();
  await connectDB();

  const passwordHash = await bcrypt.hash(DEMO_USER.password, env.bcryptRounds);
  const user = await User.findOneAndUpdate(
    { email: DEMO_USER.email },
    { name: DEMO_USER.name, email: DEMO_USER.email, passwordHash },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Activity.deleteMany({ createdBy: user._id });
  await Lead.deleteMany({ createdBy: user._id });

  const leads = await Lead.create(SAMPLE_LEADS.map((lead) => ({ ...lead, createdBy: user._id })));
  const byName = Object.fromEntries(leads.map((lead) => [lead.name, lead]));

  await Activity.create([
    { leadId: byName['Ananya Rao']._id, title: 'Intro call', type: 'Call', dueAt: hoursFromNow(20) },
    { leadId: byName['Rohan Mehta']._id, title: 'Send social media audit', type: 'Email', dueAt: hoursFromNow(-6) },
    { leadId: byName['Kavya Iyer']._id, title: 'Discovery meeting', type: 'Meeting', dueAt: hoursFromNow(48) },
    { leadId: byName['Arjun Singh']._id, title: 'Follow up on proposal', type: 'Call', dueAt: hoursFromNow(-30) },
    { leadId: byName['Neha Kapoor']._id, title: 'Kick-off meeting', type: 'Meeting', dueAt: hoursFromNow(-72), status: 'Completed', completedAt: hoursFromNow(-70) },
  ].map((activity) => ({ ...activity, createdBy: user._id })));

  console.log(`Seeded ${leads.length} leads and 5 follow-ups for ${DEMO_USER.email}`);
}

seed()
  .catch((err) => {
    console.error(`Seed failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
