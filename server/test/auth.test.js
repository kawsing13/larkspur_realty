import test from 'node:test';
import assert from 'node:assert/strict';
import { req, login, base, AGENT_LENA, ADMIN, BUYER } from './helpers/api.js';

test('login returns an access token and sets a refresh cookie', async () => {
  const res = await req('POST', '/api/auth/login', {
    body: { email: ADMIN, password: 'Passw0rd!' },
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.accessToken);
  assert.ok(res.headers.get('set-cookie')?.includes('rems_refresh'));
});

test('wrong password is rejected with the same message as an unknown email', async () => {
  const bad = await req('POST', '/api/auth/login', { body: { email: ADMIN, password: 'nope' } });
  const unknown = await req('POST', '/api/auth/login', {
    body: { email: 'nobody@example.com', password: 'nope' },
  });
  assert.equal(bad.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(bad.body.error.message, unknown.body.error.message);
});

test('registration creates a customer and rejects a short password', async () => {
  const short = await req('POST', '/api/auth/register', {
    body: { email: 'x@example.com', password: 'short', firstName: 'A', lastName: 'B' },
  });
  assert.equal(short.status, 422);

  const ok = await req('POST', '/api/auth/register', {
    body: {
      email: `newbuyer_${Date.now()}@example.com`,
      password: 'Passw0rd!',
      firstName: 'New',
      lastName: 'Buyer',
    },
  });
  assert.equal(ok.status, 201);
  assert.deepEqual(ok.body.user.roles, ['CUSTOMER']);
});

test('a rotated refresh token cannot be replayed', async () => {
  const first = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: BUYER, password: 'Passw0rd!' }),
  });
  const cookie = first.headers.get('set-cookie').split(';')[0];

  const refreshWith = (c) =>
    fetch(`${base}/api/auth/refresh`, { method: 'POST', headers: { cookie: c } });

  const ok = await refreshWith(cookie);
  assert.equal(ok.status, 200); // first use rotates it

  const replay = await refreshWith(cookie);
  assert.equal(replay.status, 401); // the old token is now dead
});

test('protected routes require a token and the right role', async () => {
  const noToken = await req('GET', '/api/users');
  assert.equal(noToken.status, 401);

  const agent = await login(AGENT_LENA);
  assert.equal((await req('GET', '/api/users', { token: agent })).status, 403);

  const admin = await login(ADMIN);
  assert.equal((await req('GET', '/api/users', { token: admin })).status, 200);
});

test('change-password verifies the current password', async () => {
  const token = await login(AGENT_LENA);
  const wrong = await req('POST', '/api/auth/change-password', {
    token,
    body: { currentPassword: 'wrong', newPassword: 'Passw0rd!2' },
  });
  assert.equal(wrong.status, 400);
});
