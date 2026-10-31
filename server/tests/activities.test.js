const Activity = require('../src/models/Activity');
const { registerAndLogin, authed, createLead, createActivity, hoursFromNow } = require('./helpers');

describe('Follow-ups (activities)', () => {
  let token;
  let api;
  let lead;

  beforeEach(async () => {
    ({ token } = await registerAndLogin());
    api = authed(token);
    lead = await createLead(token);
  });

  test('ACT-01 creates a follow-up for a valid lead as Pending with no completion time', async () => {
    const dueAt = hoursFromNow(48);
    const res = await api.post('/activities').send({ leadId: lead.id, title: 'Demo call', type: 'Meeting', dueAt });

    expect(res.status).toBe(201);
    expect(res.body.data.activity).toMatchObject({
      title: 'Demo call',
      type: 'Meeting',
      status: 'Pending',
      completedAt: null,
      isOverdue: false,
      dueAt,
    });
    expect(res.body.data.activity.leadId).toMatchObject({ id: lead.id, name: lead.name });
  });

  test('ACT-02 rejects malformed, nonexistent and other users\' lead references', async () => {
    const other = await registerAndLogin();
    const otherLead = await createLead(other.token);

    const malformed = await api.post('/activities').send({ leadId: 'abc', title: 'x', dueAt: hoursFromNow(1) });
    const missing = await api
      .post('/activities')
      .send({ leadId: '64b7f0c2a1b2c3d4e5f60718', title: 'x', dueAt: hoursFromNow(1) });
    const foreign = await api.post('/activities').send({ leadId: otherLead.id, title: 'x', dueAt: hoursFromNow(1) });

    expect(malformed.status).toBe(400);
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe('Lead not found');
    expect(foreign.status).toBe(403);
    expect(await Activity.countDocuments()).toBe(0);
  });

  test('ACT-03 rejects missing title, missing or invalid due date and unknown type', async () => {
    const cases = [
      { leadId: lead.id, dueAt: hoursFromNow(1) },
      { leadId: lead.id, title: '   ', dueAt: hoursFromNow(1) },
      { leadId: lead.id, title: 'No date' },
      { leadId: lead.id, title: 'Bad date', dueAt: 'tomorrow' },
      { leadId: lead.id, title: 'No timezone', dueAt: '2026-11-05T10:30' },
      { leadId: lead.id, title: 'Impossible date', dueAt: '2026-02-30T10:00:00.000Z' },
      { leadId: lead.id, title: 'Not a string', dueAt: 1767225600000 },
      { leadId: lead.id, title: 'Bad type', dueAt: hoursFromNow(1), type: 'Fax' },
    ];

    for (const body of cases) {
      const res = await api.post('/activities').send(body);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    }
  });

  test('ACT-04 rejects status, completedAt and createdBy on create', async () => {
    const res = await api.post('/activities').send({
      leadId: lead.id,
      title: 'Cheat',
      dueAt: hoursFromNow(1),
      status: 'Completed',
      completedAt: new Date().toISOString(),
      createdBy: '64b7f0c2a1b2c3d4e5f60718',
    });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['status', 'completedAt', 'createdBy']));
  });

  test('ACT-05 marking complete records completedAt on the server; repeating keeps the original time', async () => {
    const activity = await createActivity(token, lead.id, { dueAt: hoursFromNow(-2) });
    expect(activity.isOverdue).toBe(true);

    const before = Date.now();
    const first = await api.patch(`/activities/${activity.id}`).send({ status: 'Completed' });

    expect(first.status).toBe(200);
    expect(first.body.data.activity.status).toBe('Completed');
    expect(first.body.data.activity.isOverdue).toBe(false);
    const completedAt = new Date(first.body.data.activity.completedAt).getTime();
    expect(completedAt).toBeGreaterThanOrEqual(before - 1000);
    expect(completedAt).toBeLessThanOrEqual(Date.now() + 1000);

    const second = await api.patch(`/activities/${activity.id}`).send({ status: 'Completed' });
    expect(second.status).toBe(200);
    expect(second.body.data.activity.completedAt).toBe(first.body.data.activity.completedAt);
  });

  test('ACT-06 cannot set completedAt directly, change leadId, or reopen a completed follow-up', async () => {
    const activity = await createActivity(token, lead.id);
    const otherLead = await createLead(token, { name: 'Other', email: 'other@test.com' });

    const setCompletedAt = await api.patch(`/activities/${activity.id}`).send({ completedAt: new Date().toISOString() });
    const moveLead = await api.patch(`/activities/${activity.id}`).send({ leadId: otherLead.id });
    await api.patch(`/activities/${activity.id}`).send({ status: 'Completed' });
    const reopen = await api.patch(`/activities/${activity.id}`).send({ status: 'Pending' });

    expect(setCompletedAt.status).toBe(400);
    expect(moveLead.status).toBe(400);
    expect(reopen.status).toBe(400);
  });

  test('ACT-07 updates title and due date of a follow-up', async () => {
    const activity = await createActivity(token, lead.id);
    const dueAt = hoursFromNow(72);

    const res = await api.patch(`/activities/${activity.id}`).send({ title: 'Reschedule call', dueAt });

    expect(res.status).toBe(200);
    expect(res.body.data.activity).toMatchObject({ title: 'Reschedule call', dueAt, status: 'Pending' });
  });

  test('ACT-08 lists follow-ups with status, overdue and lead filters, sorted by due date', async () => {
    const otherLead = await createLead(token, { name: 'Other', email: 'other@test.com' });
    const later = await createActivity(token, lead.id, { title: 'Later', dueAt: hoursFromNow(10) });
    await createActivity(token, lead.id, { title: 'Overdue', dueAt: hoursFromNow(-5) });
    await createActivity(token, otherLead.id, { title: 'Other lead', dueAt: hoursFromNow(5) });
    await api.patch(`/activities/${later.id}`).send({ status: 'Completed' });

    const all = await api.get('/activities');
    const pending = await api.get('/activities').query({ status: 'Pending' });
    const completed = await api.get('/activities').query({ status: 'Completed' });
    const overdue = await api.get('/activities').query({ overdue: 'true' });
    const forLead = await api.get('/activities').query({ leadId: lead.id });
    const invalid = await api.get('/activities').query({ status: 'Done' });

    expect(all.body.data.items.map((a) => a.title)).toEqual(['Overdue', 'Other lead', 'Later']);
    expect(pending.body.data.items.map((a) => a.title)).toEqual(['Overdue', 'Other lead']);
    expect(completed.body.data.items.map((a) => a.title)).toEqual(['Later']);
    expect(overdue.body.data.items.map((a) => a.title)).toEqual(['Overdue']);
    expect(forLead.body.data.count).toBe(2);
    expect(invalid.status).toBe(400);
  });

  test('ACT-09 another user cannot see or update my follow-ups', async () => {
    const activity = await createActivity(token, lead.id);
    const intruder = authed((await registerAndLogin()).token);

    const list = await intruder.get('/activities');
    const update = await intruder.patch(`/activities/${activity.id}`).send({ status: 'Completed' });

    expect(list.body.data.count).toBe(0);
    expect(update.status).toBe(403);
    expect((await Activity.findById(activity.id)).status).toBe('Pending');
  });
});
