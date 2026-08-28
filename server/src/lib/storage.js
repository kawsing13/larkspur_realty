// Object storage. Talks to MinIO locally (docker-compose.yml) and any S3-compatible
// service in production.
//
// Two buckets:
//   media   - property photos. Public-read, so <img src> loads them directly.
//   docs    - property documents (brochures, floor plans, permits). Private; every
//             download goes through an access-checked route (see modules/documents).

import crypto from 'node:crypto';
import path from 'node:path';
import { Client } from 'minio';
import { env } from '../config/env.js';

const endpoint = new URL(env.STORAGE_ENDPOINT);

export const storage = new Client({
  endPoint: endpoint.hostname,
  port: Number(endpoint.port) || (endpoint.protocol === 'https:' ? 443 : 80),
  useSSL: endpoint.protocol === 'https:',
  accessKey: env.STORAGE_ACCESS_KEY,
  secretKey: env.STORAGE_SECRET_KEY,
});

const MEDIA_BUCKET = env.STORAGE_BUCKET;
const DOCS_BUCKET = env.STORAGE_DOCS_BUCKET;

// Public URL a browser uses to load a media object.
export const publicUrl = (key) => {
  const base = (env.STORAGE_PUBLIC_URL || env.STORAGE_ENDPOINT).replace(/\/$/, '');
  return `${base}/${MEDIA_BUCKET}/${key}`;
};

// Create both buckets if missing. Only the media bucket gets an anonymous-read
// policy. Called once on server start; safe to re-run. Non-fatal if storage is down.
export const ensureBuckets = async () => {
  for (const bucket of [MEDIA_BUCKET, DOCS_BUCKET]) {
    const exists = await storage.bucketExists(bucket);
    if (!exists) await storage.makeBucket(bucket);
  }

  await storage.setBucketPolicy(
    MEDIA_BUCKET,
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${MEDIA_BUCKET}/*`],
        },
      ],
    }),
  );
};

// ---- media (public) ----

const IMAGE_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const putPropertyImage = async ({ propertyId, buffer, mimeType }) => {
  const key = `properties/${propertyId}/${crypto.randomUUID()}.${IMAGE_EXT[mimeType] || 'bin'}`;
  await storage.putObject(MEDIA_BUCKET, key, buffer, buffer.length, { 'Content-Type': mimeType });
  return { key, url: publicUrl(key) };
};

export const removeObject = (key) => storage.removeObject(MEDIA_BUCKET, key);

// ---- documents (private) ----

export const putDocument = async ({ propertyId, buffer, mimeType, fileName }) => {
  const ext = path.extname(fileName || '').slice(0, 10) || '';
  const key = `properties/${propertyId}/${crypto.randomUUID()}${ext}`;
  await storage.putObject(DOCS_BUCKET, key, buffer, buffer.length, { 'Content-Type': mimeType });
  return { key };
};

// Returns a readable stream of the object, for the download proxy.
export const getDocumentStream = (key) => storage.getObject(DOCS_BUCKET, key);

export const removeDocument = (key) => storage.removeObject(DOCS_BUCKET, key);
