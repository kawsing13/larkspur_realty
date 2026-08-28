// Smoke tests for the Express app. These do not touch the database - they check
// that the app boots and that the error/response shapes match the conventions.
//
//   npm run test        (from server/)

import test from 'node:test';
import assert from 'node:assert/strict';

// Provide the minimum env the app needs, without a real database connection.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://localhost:5432/placeholder';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-0000000000';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-0000000000';

const { createApp } = await import('../src/app.js');

const withServer = async (run) => {
  const server = createApp().listen(0);
  const { port } = server.address();
  try {
    await run(port);
  } finally {
    server.close();
  }
};

test('GET /health returns ok', async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://localhost:${port}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
  });
});

test('unknown API route returns the standard error shape', async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://localhost:${port}/api/does-not-exist`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 404);
    assert.equal(typeof body.error.message, 'string');
  });
});

test('reports are gated behind authentication', async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://localhost:${port}/api/reports/overview`);
    assert.equal(res.status, 401);
  });
});

test('protected route rejects an unauthenticated request', async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://localhost:${port}/api/users`);
    assert.equal(res.status, 401);
  });
});

test('property management routes require authentication', async () => {
  await withServer(async (port) => {
    const create = await fetch(`http://localhost:${port}/api/properties`, { method: 'POST' });
    assert.equal(create.status, 401);

    const manage = await fetch(`http://localhost:${port}/api/properties/manage`);
    assert.equal(manage.status, 401);
  });
});
