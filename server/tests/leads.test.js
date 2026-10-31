const Activity = require('../src/models/Activity');
const Lead = require('../src/models/Lead');
const { registerAndLogin, authed, createLead, createActivity } = require('./helpers');

describe('Leads', () => {
  let token;
  let user;
  let api;

  beforeEach(async () => {
    ({ token, user } = await registerAndLogin());
    api = authed(token);
  });

  test('LEAD-01 creates a lead with defaults and createdBy taken from the token', async () => {
    const res = await api.post('/leads').send({
      name: '  Asha Verma ',
      company: 'Bright Media',
      email: ' Asha@Bright.TEST ',
      budget: 50000,
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Lead created');
    expect(res.body.data.lead).toMatchObject({
      name: 'Asha Verma',
      company: 'Bright Media',
      email: 'asha@bright.test',
      budget: 50000,
      stage: 'New',
      source: 'Other',
      serviceInterest: 'Other',
      createdBy: user.id,
    });
    expect(res.body.data.lead.id).toEqual(expect.any(String));
  });

  test('LEAD-02 rejects createdBy, _id and unknown fields in the request body', async () => {
    const res = await api.post('/leads').send({
      name: 'Sneaky',
      email: 'sneaky@test.com',
      createdBy: '64b7f0c2a1b2c3d4e5f60718',
      _id: '64b7f0c2a1b2c3d4e5f60719',
      isVip: true,
    });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['createdBy', '_id', 'isVip']));
    expect(await Lead.countDocuments()).toBe(0);
  });

  test('LEAD-03 rejects a missing or blank name', async () => {
    const missing = await api.post('/leads').send({ email: 'a@test.com' });
    const blank = await api.post('/leads').send({ name: '   ', email: 'a@test.com' });

    for (const res of [missing, blank]) {
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'name' })]));
    }
  });

  test('LEAD-04 rejects a lead with neither email nor phone', async () => {
    const res = await api.post('/leads').send({ name: 'No Contact', email: '', phone: '' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email', message: 'Provide at least an email or a phone number' }),
      ])
    );
  });

  test('LEAD-05 rejects an invalid email', async () => {
    const res = await api.post('/leads').send({ name: 'Bad Email', email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'email', message: 'Enter a valid email address' })])
    );
  });

  test('LEAD-06 rejects a negative budget but accepts zero', async () => {
    const negative = await api.post('/leads').send({ name: 'Neg', email: 'neg@test.com', budget: -1 });
    const zero = await api.post('/leads').send({ name: 'Zero', email: 'zero@test.com', budget: 0 });

    expect(negative.status).toBe(400);
    expect(negative.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'budget' })]));
    expect(zero.status).toBe(201);
    expect(zero.body.data.lead.budget).toBe(0);
  });

  test('LEAD-07 accepts a phone-only lead even when the form sends email as an empty string', async () => {
    const res = await api.post('/leads').send({ name: 'Phone Only', email: '', phone: '+91 98765 43210' });

    expect(res.status).toBe(201);
    expect(res.body.data.lead.email).toBeNull();
    expect(res.body.data.lead.phone).toBe('+91 98765 43210');
  });

  test('LEAD-08 gets a single lead; bad id is 400 and unknown id is 404', async () => {
    const lead = await createLead(token);

    const ok = await api.get(`/leads/${lead.id}`);
    const badId = await api.get('/leads/123');
    const unknown = await api.get('/leads/64b7f0c2a1b2c3d4e5f60718');

    expect(ok.status).toBe(200);
    expect(ok.body.data.lead.id).toBe(lead.id);
    expect(badId.status).toBe(400);
    expect(unknown.status).toBe(404);
  });

  test('LEAD-09 updates fields and the stage change persists in the database', async () => {
    const lead = await createLead(token);

    const res = await api.patch(`/leads/${lead.id}`).send({ stage: 'Proposal Sent', company: 'Bright Media Pvt Ltd' });

    expect(res.status).toBe(200);
    expect(res.body.data.lead.stage).toBe('Proposal Sent');
    const stored = await Lead.findById(lead.id);
    expect(stored.stage).toBe('Proposal Sent');
    expect(stored.company).toBe('Bright Media Pvt Ltd');
  });

  test('LEAD-10 rejects attempts to change _id, createdBy, timestamps or unknown fields', async () => {
    const lead = await createLead(token);

    for (const body of [
      { _id: '64b7f0c2a1b2c3d4e5f60718' },
      { createdBy: '64b7f0c2a1b2c3d4e5f60718' },
      { createdAt: '2020-01-01T00:00:00.000Z' },
      { updatedAt: '2020-01-01T00:00:00.000Z' },
      { stage: 'Won', priority: 'high' },
    ]) {
      const res = await api.patch(`/leads/${lead.id}`).send(body);
      expect(res.status).toBe(400);
    }

    const stored = await Lead.findById(lead.id);
    expect(stored.createdBy.toString()).toBe(user.id);
    expect(stored.stage).toBe('New');
  });

  test('LEAD-11 PATCH cannot remove the last contact method; invalid values are rejected', async () => {
    const lead = await createLead(token, { email: 'only@test.com', phone: null });

    const clearEmail = await api.patch(`/leads/${lead.id}`).send({ email: '' });
    const badStage = await api.patch(`/leads/${lead.id}`).send({ stage: 'Negotiation' });
    const badBudget = await api.patch(`/leads/${lead.id}`).send({ budget: -50 });
    const empty = await api.patch(`/leads/${lead.id}`).send({});

    expect(clearEmail.status).toBe(400);
    expect(badStage.status).toBe(400);
    expect(badBudget.status).toBe(400);
    expect(empty.status).toBe(400);

    // Swapping email for phone in one request is fine.
    const swap = await api.patch(`/leads/${lead.id}`).send({ email: '', phone: '9876543210' });
    expect(swap.status).toBe(200);
    expect(swap.body.data.lead.email).toBeNull();
  });

  test('LEAD-12 searches by name or company, case-insensitive, with regex characters treated literally', async () => {
    await createLead(token, { name: 'Ravi Kumar', company: 'Pixel Forge' });
    await createLead(token, { name: 'Meera Shah', company: 'Kumar Textiles' });
    await createLead(token, { name: 'John Doe', company: 'Acme (India)' });

    const byName = await api.get('/leads').query({ search: 'ravi' });
    const byNameOrCompany = await api.get('/leads').query({ search: 'KUMAR' });
    const special = await api.get('/leads').query({ search: '(India' });
    const regexChars = await api.get('/leads').query({ search: 'a.*(' });

    expect(byName.body.data.items.map((l) => l.name)).toEqual(['Ravi Kumar']);
    expect(byNameOrCompany.body.data.count).toBe(2);
    expect(special.body.data.items.map((l) => l.name)).toEqual(['John Doe']);
    expect(regexChars.status).toBe(200);
    expect(regexChars.body.data.count).toBe(0);
  });

  test('LEAD-13 filters by stage and rejects an unknown stage', async () => {
    await createLead(token, { name: 'One', stage: 'Qualified' });
    await createLead(token, { name: 'Two', stage: 'Won' });
    await createLead(token, { name: 'Three' });

    const qualified = await api.get('/leads').query({ stage: 'Qualified' });
    const combined = await api.get('/leads').query({ stage: 'Won', search: 'tw' });
    const invalid = await api.get('/leads').query({ stage: 'Pending' });
    const unknownParam = await api.get('/leads').query({ sort: 'name' });

    expect(qualified.body.data.items.map((l) => l.name)).toEqual(['One']);
    expect(combined.body.data.items.map((l) => l.name)).toEqual(['Two']);
    expect(invalid.status).toBe(400);
    expect(unknownParam.status).toBe(400);
  });

  test('LEAD-14 delete removes the lead and only its follow-ups', async () => {
    const lead = await createLead(token);
    const other = await createLead(token, { name: 'Keep Me', email: 'keep@test.com' });
    await createActivity(token, lead.id);
    await createActivity(token, lead.id, { title: 'Send proposal', type: 'Email' });
    await createActivity(token, other.id);

    const res = await api.delete(`/leads/${lead.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deletedActivities).toBe(2);
    expect((await api.get(`/leads/${lead.id}`)).status).toBe(404);
    expect(await Activity.countDocuments({ leadId: lead.id })).toBe(0);
    expect(await Activity.countDocuments({ leadId: other.id })).toBe(1);
  });

  test('LEAD-15 another user cannot list, view, edit or delete my leads', async () => {
    const lead = await createLead(token);
    const intruder = authed((await registerAndLogin()).token);

    const list = await intruder.get('/leads');
    const view = await intruder.get(`/leads/${lead.id}`);
    const edit = await intruder.patch(`/leads/${lead.id}`).send({ stage: 'Lost' });
    const remove = await intruder.delete(`/leads/${lead.id}`);

    expect(list.body.data.count).toBe(0);
    expect(view.status).toBe(403);
    expect(edit.status).toBe(403);
    expect(remove.status).toBe(403);
    expect((await Lead.findById(lead.id)).stage).toBe('New');
  });

  test('LEAD-16 list returns newest first in the standard envelope', async () => {
    await createLead(token, { name: 'First' });
    await createLead(token, { name: 'Second' });

    const res = await api.get('/leads');

    expect(res.body).toMatchObject({ success: true, message: 'Leads fetched' });
    expect(res.body.data.items.map((l) => l.name)).toEqual(['Second', 'First']);
  });
});
