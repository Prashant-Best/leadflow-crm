const { app, API, request } = require('./helpers');
const { env } = require('../src/config/env');
const User = require('../src/models/User');

describe('App basics', () => {
  test('APP-01 GET /health returns ok without exposing configuration', async () => {
    const res = await request(app).get(`${API}/health`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');

    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/mongodb:\/\//i);
    expect(raw).not.toContain(process.env.JWT_SECRET);
  });

  test('APP-02 unknown route returns a 404 in the error format', async () => {
    const res = await request(app).get(`${API}/does-not-exist`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: expect.stringContaining('not found'),
      errors: [],
    });
  });

  test('APP-03 malformed JSON body returns 400, not 500', async () => {
    const res = await request(app)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send('{"email": "broken"');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Request body is not valid JSON');
  });

  test('APP-05 missing server configuration returns 503 and creates nothing', async () => {
    const original = env.jwtSecret;
    env.jwtSecret = undefined;
    try {
      const res = await request(app)
        .post(`${API}/auth/register`)
        .send({ name: 'No Config', email: 'noconfig@example.com', password: 'Password123' });

      expect(res.status).toBe(503);
      expect(res.body.message).toMatch(/not configured/);
      expect(await User.countDocuments()).toBe(0);
    } finally {
      env.jwtSecret = original;
    }
  });

  test('APP-04 error responses never include a stack trace', async () => {
    const res = await request(app)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send('{bad json');

    expect(res.body.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js:\d+/);
  });
});
