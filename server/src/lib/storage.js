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
import { ApiError } from './ApiError.js';

const isMinio = env.STORAGE_PROVIDER === 'minio';
// "none": no object storage in this deployment (the free Render deploy). Browsing
// works from the seeded demo photos; anything that writes a file returns 501.
const uploadsDisabled = env.STORAGE_PROVIDER === 'none';

const noStorage = () =>
  new ApiError(501, 'File uploads are disabled in this deployment');

const endpoint = new URL(env.STORAGE_ENDPOINT);

export const storage = uploadsDisabled
  ? null
  : new Client({
      endPoint: endpoint.hostname,
      port: Number(endpoint.port) || (endpoint.protocol === 'https:' ? 443 : 80),
      useSSL: endpoint.protocol === 'https:',
      region: env.STORAGE_REGION,
      accessKey: env.STORAGE_ACCESS_KEY,
      secretKey: env.STORAGE_SECRET_KEY,
    });

const MEDIA_BUCKET = env.STORAGE_BUCKET;
const DOCS_BUCKET = env.STORAGE_DOCS_BUCKET;

// Public URL a browser uses to load a media object.
export const publicUrl = (key) => {
  // MinIO serves every bucket from one endpoint, so the bucket name is in the path.
  // A managed S3/R2 public URL (an r2.dev address or a custom domain) already points
  // at the media bucket, so the key goes straight on the end.
  if (!isMinio && env.STORAGE_PUBLIC_URL) {
    return `${env.STORAGE_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  const base = (env.STORAGE_PUBLIC_URL || env.STORAGE_ENDPOINT).replace(/\/$/, '');
  return `${base}/${MEDIA_BUCKET}/${key}`;
};

// Make sure both buckets exist. Called once on server start; safe to re-run.
// Non-fatal if storage is down.
//
// MinIO: create the buckets and open the media bucket for anonymous read so
// <img src> works. Managed S3/R2 ("s3" provider): the buckets are created in the
// provider console and the media bucket is made public there, so we only verify
// they are reachable and never send a bucket policy (R2 rejects the S3 policy API).
export const ensureBuckets = async () => {
  if (uploadsDisabled) return;

  for (const bucket of [MEDIA_BUCKET, DOCS_BUCKET]) {
    const exists = await storage.bucketExists(bucket);
    if (!exists) {
      if (!isMinio) {
        throw new Error(`Bucket "${bucket}" not found - create it in your storage provider`);
      }
      await storage.makeBucket(bucket);
    }
  }

  if (!isMinio) return;

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
  if (uploadsDisabled) throw noStorage();
  const key = `properties/${propertyId}/${crypto.randomUUID()}.${IMAGE_EXT[mimeType] || 'bin'}`;
  await storage.putObject(MEDIA_BUCKET, key, buffer, buffer.length, { 'Content-Type': mimeType });
  return { key, url: publicUrl(key) };
};

// No-op when storage is off, so deleting a property/image row still succeeds.
export const removeObject = (key) =>
  uploadsDisabled ? Promise.resolve() : storage.removeObject(MEDIA_BUCKET, key);

// ---- documents (private) ----

export const putDocument = async ({ propertyId, buffer, mimeType, fileName }) => {
  if (uploadsDisabled) throw noStorage();
  const ext = path.extname(fileName || '').slice(0, 10) || '';
  const key = `properties/${propertyId}/${crypto.randomUUID()}${ext}`;
  await storage.putObject(DOCS_BUCKET, key, buffer, buffer.length, { 'Content-Type': mimeType });
  return { key };
};

// Returns a readable stream of the object, for the download proxy.
export const getDocumentStream = (key) => {
  if (uploadsDisabled) throw noStorage();
  return storage.getObject(DOCS_BUCKET, key);
};

export const removeDocument = (key) =>
  uploadsDisabled ? Promise.resolve() : storage.removeObject(DOCS_BUCKET, key);
