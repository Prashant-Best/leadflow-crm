const request = require('supertest');
const app = require('../src/app');

const API = '/api/v1';

let userCounter = 0;

async function registerAndLogin(overrides = {}) {
  userCounter += 1;
  const credentials = {
    name: 'Test User',
    email: `user${userCounter}@example.com`,
    password: 'Password123',
    ...overrides,
  };
  const res = await request(app).post(`${API}/auth/register`).send(credentials);
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.data.token, user: res.body.data.user, credentials };
}

function authed(token) {
  const withAuth = (req) => req.set('Authorization', `Bearer ${token}`);
  return {
    get: (url) => withAuth(request(app).get(`${API}${url}`)),
    post: (url) => withAuth(request(app).post(`${API}${url}`)),
    patch: (url) => withAuth(request(app).patch(`${API}${url}`)),
    delete: (url) => withAuth(request(app).delete(`${API}${url}`)),
  };
}

async function createLead(token, overrides = {}) {
  const res = await authed(token)
    .post('/leads')
    .send({ name: 'Asha Verma', company: 'Bright Media', email: 'asha@bright.test', ...overrides });
  if (res.status !== 201) {
    throw new Error(`createLead failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.lead;
}

const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

async function createActivity(token, leadId, overrides = {}) {
  const res = await authed(token)
    .post('/activities')
    .send({ leadId, title: 'Intro call', type: 'Call', dueAt: hoursFromNow(24), ...overrides });
  if (res.status !== 201) {
    throw new Error(`createActivity failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.activity;
}

module.exports = { app, API, request, registerAndLogin, authed, createLead, createActivity, hoursFromNow };
