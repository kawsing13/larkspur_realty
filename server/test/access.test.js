import test from 'node:test';
import assert from 'node:assert/strict';
import { req, login, base, AGENT_LENA, AGENT_OMAR, ADMIN, MANAGER, BUYER } from './helpers/api.js';

// A published property owned by Lena (seeded RE-2026-0101).
const REF = 'RE-2026-0101';
let propertyId;

test('setup: resolve the demo property id', async () => {
  const res = await req('GET', `/api/properties/${REF}`);
  propertyId = res.body.property.id;
  assert.ok(propertyId);
});

test('a public inquiry is auto-assigned to the listing agent', async () => {
  const create = await req('POST', '/api/inquiries', {
    body: {
      propertyId,
      name: 'Test Enquirer',
      email: 'test.enquirer@example.com',
      message: 'Is this still available for a viewing this week?',
    },
  });
  assert.equal(create.status, 201);
  const id = create.body.id;

  const lena = await login(AGENT_LENA);
  const omar = await login(AGENT_OMAR);

  const seen = await req('GET', `/api/inquiries/${id}`, { token: lena });
  assert.equal(seen.status, 200);
  assert.equal(seen.body.inquiry.assignedAgent.name, 'Lena Fitzgerald');

  // A different agent cannot see it.
  assert.equal((await req('GET', `/api/inquiries/${id}`, { token: omar })).status, 403);

  // Only an admin can reassign.
  const omarAgent = await req('GET', '/api/agents/me', { token: omar });
  assert.equal(
    (await req('POST', `/api/inquiries/${id}/assign`, {
      token: lena,
      body: { agentId: omarAgent.body.agent.id },
    })).status,
    403,
  );

  const admin = await login(ADMIN);
  const reassigned = await req('POST', `/api/inquiries/${id}/assign`, {
    token: admin,
    body: { agentId: omarAgent.body.agent.id },
  });
  assert.equal(reassigned.body.inquiry.assignedAgent.name, 'Omar Haddad');

  // Lena can no longer write to it, but Omar can.
  assert.equal(
    (await req('PATCH', `/api/inquiries/${id}`, { token: lena, body: { status: 'CONTACTED' } })).status,
    403,
  );
  assert.equal(
    (await req('PATCH', `/api/inquiries/${id}`, { token: omar, body: { status: 'CONTACTED' } })).status,
    200,
  );
});

test('private documents are only downloadable by the owning agent or an admin', async () => {
  const lena = await login(AGENT_LENA);

  const form = new FormData();
  form.append('propertyId', propertyId);
  form.append('title', 'Test private document');
  form.append('visibility', 'PRIVATE');
  form.append('file', new Blob([Buffer.from('%PDF-1.4 test')], { type: 'application/pdf' }), 't.pdf');

  const upload = await fetch(`${base}/api/documents`, {
    method: 'POST',
    headers: { authorization: `Bearer ${lena}` },
    body: form,
  });
  assert.equal(upload.status, 201);
  const docId = (await upload.json()).document.id;

  const dl = (token) =>
    fetch(`${base}/api/documents/${docId}/download`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }).then((r) => r.status);

  assert.equal(await dl(null), 403); // anonymous
  assert.equal(await dl(await login(AGENT_OMAR)), 403); // other agent
  assert.equal(await dl(await login(MANAGER)), 403); // manager is not the owner
  assert.equal(await dl(lena), 200); // owner
  assert.equal(await dl(await login(ADMIN)), 200); // admin

  // Clean up.
  await req('DELETE', `/api/documents/${docId}`, { token: await login(ADMIN) });
});

test('favorites and saved searches are buyer-only', async () => {
  const agent = await login(AGENT_LENA);
  assert.equal((await req('GET', '/api/favorites', { token: agent })).status, 403);
  assert.equal(
    (await req('POST', '/api/saved-searches', { token: agent, body: { name: 'x', criteria: {} } })).status,
    403,
  );

  const buyer = await login(BUYER);
  assert.equal((await req('GET', '/api/favorites', { token: buyer })).status, 200);
});

test('reports require the report:read permission', async () => {
  assert.equal((await req('GET', '/api/reports/overview')).status, 401);
  assert.equal(
    (await req('GET', '/api/reports/overview', { token: await login(AGENT_LENA) })).status,
    403,
  );
  assert.equal(
    (await req('GET', '/api/reports/overview', { token: await login(ADMIN) })).status,
    200,
  );
});
