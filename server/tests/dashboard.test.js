const { registerAndLogin, authed, createLead, createActivity, hoursFromNow } = require('./helpers');

describe('Dashboard summary', () => {
  test('DASH-01 a new user sees all zeros', async () => {
    const { token } = await registerAndLogin();
    const res = await authed(token).get('/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalLeads: 0,
      activeLeads: 0,
      wonLeads: 0,
      lostLeads: 0,
      pendingFollowUps: 0,
      overdueFollowUps: 0,
      completedFollowUps: 0,
      upcomingFollowUps: [],
    });
    expect(res.body.data.leadsByStage).toHaveLength(6);
  });

  test('DASH-02 counts match a known set of records exactly', async () => {
    const { token } = await registerAndLogin();
    const api = authed(token);

    // 5 leads: one in each stage except Qualified.
    const leadNew = await createLead(token, { name: 'L-New', stage: 'New' });
    await createLead(token, { name: 'L-Contacted', stage: 'Contacted' });
    await createLead(token, { name: 'L-Proposal', stage: 'Proposal Sent' });
    await createLead(token, { name: 'L-Won', stage: 'Won' });
    await createLead(token, { name: 'L-Lost', stage: 'Lost' });

    // 3 follow-ups: future pending, past pending (overdue), completed.
    await createActivity(token, leadNew.id, { title: 'Future', dueAt: hoursFromNow(24) });
    await createActivity(token, leadNew.id, { title: 'Past', dueAt: hoursFromNow(-24) });
    const done = await createActivity(token, leadNew.id, { title: 'Done', dueAt: hoursFromNow(-48) });
    await api.patch(`/activities/${done.id}`).send({ status: 'Completed' });

    const res = await api.get('/dashboard/summary');

    expect(res.body.data).toMatchObject({
      totalLeads: 5,
      activeLeads: 3,
      wonLeads: 1,
      lostLeads: 1,
      pendingFollowUps: 2,
      overdueFollowUps: 1,
      completedFollowUps: 1,
    });
    const byStage = Object.fromEntries(res.body.data.leadsByStage.map((s) => [s.stage, s.count]));
    expect(byStage).toEqual({ New: 1, Contacted: 1, Qualified: 0, 'Proposal Sent': 1, Won: 1, Lost: 1 });
    expect(res.body.data.upcomingFollowUps.map((a) => a.title)).toEqual(['Past', 'Future']);
  });

  test('DASH-03 another user\'s records are not counted', async () => {
    const mine = await registerAndLogin();
    const theirs = await registerAndLogin();
    const theirLead = await createLead(theirs.token, { stage: 'Won' });
    await createActivity(theirs.token, theirLead.id, { dueAt: hoursFromNow(-1) });
    await createLead(mine.token);

    const res = await authed(mine.token).get('/dashboard/summary');

    expect(res.body.data).toMatchObject({ totalLeads: 1, wonLeads: 0, pendingFollowUps: 0, overdueFollowUps: 0 });
  });

  test('DASH-04 counts update when a lead moves to Won and when it is deleted', async () => {
    const { token } = await registerAndLogin();
    const api = authed(token);
    const lead = await createLead(token);
    await createActivity(token, lead.id, { dueAt: hoursFromNow(-3) });

    const before = (await api.get('/dashboard/summary')).body.data;
    await api.patch(`/leads/${lead.id}`).send({ stage: 'Won' });
    const afterWon = (await api.get('/dashboard/summary')).body.data;
    await api.delete(`/leads/${lead.id}`);
    const afterDelete = (await api.get('/dashboard/summary')).body.data;

    expect(before).toMatchObject({ activeLeads: 1, wonLeads: 0, overdueFollowUps: 1 });
    expect(afterWon).toMatchObject({ activeLeads: 0, wonLeads: 1 });
    expect(afterDelete).toMatchObject({ totalLeads: 0, wonLeads: 0, pendingFollowUps: 0, overdueFollowUps: 0 });
  });
});
