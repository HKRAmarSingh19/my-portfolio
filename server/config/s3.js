import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Transform } from 'node:stream';

/**
 * AWS S3 client + small helpers for storing portfolio media (photos & videos).
 *
 * Credentials come from server/.env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 * AWS_REGION, AWS_BUCKET. Files are uploaded to a **public-read** bucket so the
 * returned absolute URL can be rendered directly by <img>/<video> on the public
 * site (no signed URLs needed for this portfolio).
 *
 * IMPORTANT: env vars are read LAZILY (inside the functions), NOT at module
 * load. ESM hoists static imports, so this module can be evaluated before
 * `dotenv.config()` runs in server.js — capturing `process.env` at import time
 * would yield undefined and break every upload.
 */
export const getBucket = () => process.env.AWS_BUCKET;
export const getRegion = () => process.env.AWS_REGION || 'us-east-1';

let client;
const getClient = () => {
  if (!client) {
    client = new S3Client({
      region: getRegion(),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      // Large multipart parts upload steadily; give each 10 s to establish a
      // connection and a 5 min socket timeout so a big part is never killed
      // mid-stream. (Node's default https agent already allows unlimited
      // sockets, so concurrency is governed by Upload's queueSize below.)
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 10000,
        socketTimeout: 5 * 60 * 1000,
      }),
    });
  }
  return client;
};

// Public URL for an object key, e.g.
// https://portfolio-media-hkramar.s3.ap-southeast-1.amazonaws.com/key.png
export const s3Url = (key) => `https://${getBucket()}.s3.${getRegion()}.amazonaws.com/${encodeURI(key)}`;

// Inverse of s3Url: recover the object key from a stored public URL. Returns
// the input unchanged if it isn't this bucket's URL (e.g. a pasted external
// link or a local /uploads path) so callers never try to delete a foreign
// object.
export const urlToKey = (url) => {
  if (typeof url !== 'string' || !url) return url;
  const prefix = `https://${getBucket()}.s3.${getRegion()}.amazonaws.com/`;
  if (!url.startsWith(prefix)) return url;
  const key = url.slice(prefix.length);
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
};

/**
 * Delete a batch of media from the bucket, given their public URLs (the raw
 * values stored in the DB). Keys that don't belong to this bucket are skipped
 * so a pasted external URL is never deleted. S3 batches up to 1000 keys per
 * request, so larger lists are chunked. Best-effort: throws on S3 failure but
 * callers decide whether that should fail the whole operation.
 * @param {string[]} urls  full public S3 URLs (or raw keys — both handled)
 */
export const deleteObjectsFromS3 = async (urls) => {
  const bucket = getBucket();
  if (!bucket) return;
  // urlToKey keeps non-bucket inputs (external http URLs, local /uploads paths)
  // unchanged — drop those and keep only plain bucket keys (no scheme, no path).
  const localKeys = [
    ...new Set(
      (urls || [])
        .map(urlToKey)
        .filter((k) => typeof k === 'string' && k && !k.startsWith('http') && !k.startsWith('/') && !k.includes('/'))
    ),
  ];
  if (!localKeys.length) return;
  for (let i = 0; i < localKeys.length; i += 1000) {
    const chunk = localKeys.slice(i, i + 1000).map((key) => ({ Key: key }));
    await getClient().send(
      new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: chunk, Quiet: true } })
    );
  }
};

/**
 * Delete every object under a key prefix (e.g. all HLS segments for one video,
 * keys `hls/<name>/...`). Lists in pages of 1000 and batch-deletes each page.
 * No-op when the prefix is empty/unsafe. Used so deleting a gallery item also
 * removes the whole adaptive-HLS output set, not just the master playlist.
 * @param {string} prefix  object-key prefix (no leading slash)
 */
export const deleteObjectsByPrefix = async (prefix) => {
  const bucket = getBucket();
  if (!bucket || typeof prefix !== 'string' || !prefix || prefix.startsWith('/')) return;
  const client = getClient();
  let token;
  do {
    const listed = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token })
    );
    const keys = (listed.Contents || []).map((o) => ({ Key: o.Key }));
    if (keys.length) {
      await client.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys, Quiet: true } })
      );
    }
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (token);
};

// In-memory store of in-flight S3 upload progress, keyed by an uploadId the
// client generates and sends with the request. Kept outside the upload itself
// so the client can poll a small endpoint (GET /upload/video/progress/:id)
// while the server streams the file up to S3. Per-process, so fine for this
// single-admin portfolio (one upload at a time).
const progressStore = new Map(); // uploadId -> { percent, loaded, total }

export const setUploadProgress = (uploadId, entry) => {
  if (uploadId) progressStore.set(uploadId, entry);
};
export const clearUploadProgress = (uploadId) => {
  if (uploadId) progressStore.delete(uploadId);
};
export const getUploadProgress = (uploadId) => {
  const entry = progressStore.get(uploadId);
  return entry ? { ...entry } : null;
};

/**
 * Upload a buffer to S3 and return the public URL + key. Single put (small
 * files — used by image uploads, where no progress reporting is wanted).
 * @param {Buffer} body  file content (multer memory storage gives req.file.buffer)
 * @param {string} key   object key (generated filename)
 * @param {string} contentType  e.g. image/png
 */
export const uploadToS3 = async (body, key, contentType) => {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error('AWS_BUCKET is not set in server/.env.');
  }
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return { url: s3Url(key), key };
};

/**
 * Stream a Readable (the incoming video from multer) up to S3 via lib-storage's
 * multipart `Upload`, reporting live { percent, loaded, total } into the
 * progress store under `uploadId`. Streams in ~32 MB parts with 16 in flight so
 * only a few part-sized buffers sit in memory at once — the whole file is never
 * buffered in RAM (a full in-memory copy of a large video is what previously
 * crashed the process mid-upload and left orphaned S3 objects).
 *
 * @param {import('node:stream').Readable} stream  the file stream (multer gives file.stream)
 * @param {string} key   object key (generated filename)
 * @param {string} contentType  e.g. video/mp4
 * @param {object} [opts]  { uploadId }
 */
export const uploadStreamToS3 = async (stream, key, contentType, { uploadId } = {}) => {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error('AWS_BUCKET is not set in server/.env.');
  }

  // lib-storage's own onProgress is unreliable for a raw stream Body (it can
  // report loaded: 0 the whole way through), so we count the bytes ourselves
  // with a passthrough Transform and write them straight into the progress
  // store. We don't know the total up front (live stream) -> total: 0 and the
  // CLIENT paces the % against the file size it already knows.
  if (uploadId) progressStore.set(uploadId, { percent: 0, loaded: 0, total: 0 });
  let consumed = 0;
  const counter = new Transform({
    transform(chunk, _enc, cb) {
      if (chunk && chunk.length) {
        consumed += chunk.length;
        if (uploadId) {
          progressStore.set(uploadId, { percent: 0, loaded: consumed, total: 0 });
        }
      }
      cb(null, chunk);
    },
  });
  stream.pipe(counter);

  const upload = new Upload({
    client: getClient(),
    params: {
      Bucket: bucket,
      Key: key,
      Body: counter,
      ContentType: contentType,
    },
    partSize: 32 * 1024 * 1024,
    queueSize: 16,
  });

  try {
    await upload.done();
    return { url: s3Url(key), key };
  } catch (err) {
    // Cancel the multipart so no dangling partial object is left in the bucket.
    try {
      await upload.abort();
    } catch {
      /* ignore abort errors */
    }
    throw err;
  } finally {
    if (uploadId) progressStore.delete(uploadId);
  }
};
