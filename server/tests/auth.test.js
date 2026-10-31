const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const { app, API, request, registerAndLogin } = require('./helpers');

const validUser = { name: 'Prashant Panwar', email: 'prashant@example.com', password: 'Password123' };

describe('Authentication', () => {
  test('AUTH-01 register creates a user, hashes the password and never returns the hash', async () => {
    const res = await request(app).post(`${API}/auth/register`).send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: 'Prashant Panwar', email: 'prashant@example.com', role: 'admin' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('Password123');

    const stored = await User.findOne({ email: validUser.email }).select('+passwordHash');
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.passwordHash).not.toBe(validUser.password);
  });

  test('AUTH-02 rejects a duplicate email with 409, ignoring case and spaces', async () => {
    await request(app).post(`${API}/auth/register`).send(validUser);
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({ ...validUser, email: '  PRASHANT@Example.com ' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email is already registered');
  });

  test('AUTH-03 rejects invalid register input with field errors', async () => {
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({ name: 'A', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  test('AUTH-03b rejects extra fields such as role on register', async () => {
    const res = await request(app).post(`${API}/auth/register`).send({ ...validUser, role: 'superadmin' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'role' })]));
  });

  test('AUTH-04 logs in with valid credentials and returns token plus safe profile', async () => {
    await request(app).post(`${API}/auth/register`).send(validUser);
    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'Prashant@Example.com', password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('prashant@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  test('AUTH-05 rejects wrong password and unknown email with the same 401 message', async () => {
    await request(app).post(`${API}/auth/register`).send(validUser);

    const wrongPassword = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: validUser.email, password: 'WrongPassword1' });
    const unknownEmail = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'nobody@example.com', password: 'Password123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe('Invalid email or password');
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  test('AUTH-05b rejects a NoSQL-injection style password object with 400', async () => {
    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: validUser.email, password: { $gt: '' } });

    expect(res.status).toBe(400);
  });

  test('AUTH-06 GET /auth/me returns the profile for a valid token', async () => {
    const { token, user } = await registerAndLogin();
    const res = await request(app).get(`${API}/auth/me`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  test('AUTH-07 rejects missing, malformed, tampered and expired tokens with 401', async () => {
    const { token, user } = await registerAndLogin();
    const expired = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: -10 });
    const wrongSecret = jwt.sign({ sub: user.id }, 'some-other-secret', { expiresIn: '1h' });
    const tampered = `${token.slice(0, -2)}xx`;

    const cases = [
      undefined,
      'Bearer',
      'Bearer not-a-jwt',
      `Basic ${token}`,
      `Bearer ${tampered}`,
      `Bearer ${wrongSecret}`,
      `Bearer ${expired}`,
    ];

    for (const header of cases) {
      const req = request(app).get(`${API}/auth/me`);
      if (header) req.set('Authorization', header);
      const res = await req;
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  test('AUTH-08 every protected endpoint rejects requests without a token', async () => {
    const fakeId = '64b7f0c2a1b2c3d4e5f60718';
    const endpoints = [
      ['get', '/leads'],
      ['post', '/leads'],
      ['get', `/leads/${fakeId}`],
      ['patch', `/leads/${fakeId}`],
      ['delete', `/leads/${fakeId}`],
      ['get', '/activities'],
      ['post', '/activities'],
      ['patch', `/activities/${fakeId}`],
      ['get', '/dashboard/summary'],
      ['get', '/auth/me'],
    ];

    for (const [method, url] of endpoints) {
      const res = await request(app)[method](`${API}${url}`);
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ success: false, errors: [] });
    }
  });
});
