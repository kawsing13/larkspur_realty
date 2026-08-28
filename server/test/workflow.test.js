import test from 'node:test';
import assert from 'node:assert/strict';
import { req, login, AGENT_LENA, AGENT_OMAR, ADMIN } from './helpers/api.js';

// Creates a fresh draft property owned by Lena and returns { propertyId, listingId, reference }.
async function newDraft(token) {
  const types = await req('GET', '/api/property-types');
  const houseId = types.body.data.find((t) => t.slug === 'house').id;

  const res = await req('POST', '/api/properties', {
    token,
    body: {
      title: `Test property ${Date.now()}`,
      description: 'A property created by the integration test suite for the workflow checks.',
      propertyTypeId: houseId,
      listingMode: 'SALE',
      price: 500000,
    },
  });
  assert.equal(res.status, 201);
  return {
    propertyId: res.body.property.id,
    listingId: res.body.property.listing.id,
    reference: res.body.property.reference,
  };
}

test('a new property is a private draft, not visible publicly', async () => {
  const lena = await login(AGENT_LENA);
  const { reference } = await newDraft(lena);
  const pub = await req('GET', `/api/properties/${reference}`);
  assert.equal(pub.status, 404);
});

test('another agent cannot edit or see the draft', async () => {
  const lena = await login(AGENT_LENA);
  const omar = await login(AGENT_OMAR);
  const { propertyId } = await newDraft(lena);

  assert.equal((await req('GET', `/api/properties/manage/${propertyId}`, { token: omar })).status, 403);
  assert.equal(
    (await req('PATCH', `/api/properties/${propertyId}`, { token: omar, body: { price: 1 } })).status,
    403,
  );
});

test('the full approval workflow: submit -> request changes -> resubmit -> approve -> public', async () => {
  const lena = await login(AGENT_LENA);
  const admin = await login(ADMIN);
  const { listingId, reference } = await newDraft(lena);

  // agents cannot approve
  assert.equal((await req('POST', `/api/listings/${listingId}/approve`, { token: lena })).status, 403);

  const submitted = await req('POST', `/api/listings/${listingId}/submit`, { token: lena });
  assert.equal(submitted.body.listing.status, 'PENDING_REVIEW');

  // request-changes needs a note
  const noNote = await req('POST', `/api/listings/${listingId}/request-changes`, { token: admin });
  assert.equal(noNote.status, 422);

  const changes = await req('POST', `/api/listings/${listingId}/request-changes`, {
    token: admin,
    body: { note: 'Add photos and a floor area.' },
  });
  assert.equal(changes.body.listing.status, 'CHANGES_REQUESTED');
  assert.equal(changes.body.listing.reviewNotes, 'Add photos and a floor area.');

  const resubmit = await req('POST', `/api/listings/${listingId}/submit`, { token: lena });
  assert.equal(resubmit.body.listing.status, 'PENDING_REVIEW');
  assert.equal(resubmit.body.listing.reviewNotes, null); // cleared on resubmit

  const approved = await req('POST', `/api/listings/${listingId}/approve`, { token: admin });
  assert.equal(approved.body.listing.status, 'PUBLISHED');

  const pub = await req('GET', `/api/properties/${reference}`);
  assert.equal(pub.status, 200);
  assert.equal(pub.body.property.status, 'PUBLISHED');

  // unpublish removes it again
  await req('POST', `/api/listings/${listingId}/unpublish`, { token: admin });
  assert.equal((await req('GET', `/api/properties/${reference}`)).status, 404);
});

test('the brochure endpoint returns a PDF for a published property', async () => {
  const list = await req('GET', '/api/properties?pageSize=1');
  const ref = list.body.data[0].reference;
  const res = await fetch(
    `${(await import('./helpers/api.js')).base}/api/properties/${ref}/brochure.pdf`,
  );
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/pdf');
  const bytes = Buffer.from(await res.arrayBuffer());
  assert.equal(bytes.subarray(0, 4).toString(), '%PDF');
});
