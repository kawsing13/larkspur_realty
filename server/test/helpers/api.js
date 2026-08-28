// Test helpers: boot the app on an ephemeral port and make requests against it.
// Runs against the rems_test database, which `npm run pretest` resets and seeds.

import { after } from 'node:test';
import { createApp } from '../../src/app.js';

const app = createApp();
const server = app.listen(0);
const port = server.address().port;
export const base = `http://localhost:${port}`;

after(() => server.close());

// req('POST', '/api/auth/login', { body }) -> { status, body, headers }
export const req = async (method, path, { token, body, form } = {}) => {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form; // a FormData instance
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${base}${path}`, { method, headers, body: payload });
  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed, headers: res.headers };
};

// Signs in a seeded demo account and returns its access token.
export const login = async (email, password = 'Passw0rd!') => {
  const res = await req('POST', '/api/auth/login', { body: { email, password } });
  if (res.status !== 200) {
    throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken;
};

export const AGENT_LENA = 'agent.lena@demo.realestate';
export const AGENT_OMAR = 'agent.omar@demo.realestate';
export const ADMIN = 'admin@demo.realestate';
export const MANAGER = 'manager@demo.realestate';
export const BUYER = 'buyer@demo.realestate';
