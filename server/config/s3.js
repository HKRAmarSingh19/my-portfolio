import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Transform } from 'node:stream';
export const getBucket = () => process.env.R2_BUCKET;
export const getRegion = () => process.env.AWS_REGION || 'us-east-1';

let client;

const getClient = () => {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 10000,
        socketTimeout: 5 * 60 * 1000,
      }),
    });
  }

  return client;
};

export const s3Url = (key) => {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '');

  if (!baseUrl) {
    throw new Error('R2_PUBLIC_BASE_URL is not set.');
  }

  const encodedKey = key
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  return `${baseUrl}/${encodedKey}`;
};

export const urlToKey = (url) => {
  if (typeof url !== 'string' || !url) return url;

  const baseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '');

  if (!baseUrl || !url.startsWith(`${baseUrl}/`)) {
    return url;
  }

  const encodedKey = url.slice(baseUrl.length + 1);

  try {
    return encodedKey
      .split('/')
      .map(decodeURIComponent)
      .join('/');
  } catch {
    return encodedKey;
  }
};


export const deleteObjectsFromS3 = async (urls) => {
  const bucket = getBucket();
  if (!bucket) return;

  const baseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error('R2_PUBLIC_BASE_URL is not set.');
  }

  // Accept only URLs belonging to the new R2 public domain.
  // Old AWS S3 URLs and unrelated URLs are ignored.
  const keys = [
    ...new Set(
      (urls || [])
        .filter(
          (url) =>
            typeof url === 'string' &&
            url.startsWith(`${baseUrl}/`)
        )
        .map(urlToKey)
        .filter(
          (key) =>
            typeof key === 'string' &&
            key &&
            !key.startsWith('/') &&
            !key.includes('\\')
        )
    ),
  ];

  if (!keys.length) return;

  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000).map((Key) => ({ Key }));

    const result = await getClient().send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: chunk, Quiet: false },
      })
    );

    if (result.Errors?.length) {
      throw new Error(
        `R2 deletion failed for ${result.Errors.length} object(s).`
      );
    }
  }
};




export const deleteObjectsByPrefix = async (prefix) => {
  console.warn(
    `[R2 Migration] Bulk deletion disabled. Prefix: ${prefix}`
  );

  return;
};

const progressStore = new Map(); 
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


export const uploadToS3 = async (body, key, contentType) => {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error('R2_BUCKET is not set in server/.env.');
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

export const uploadStreamToS3 = async (stream, key, contentType, { uploadId } = {}) => {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error('R2_BUCKET is not set in server/.env.');
  }

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
   
    try {
      await upload.abort();
    } catch {
    }
    throw err;
  } finally {
    if (uploadId) progressStore.delete(uploadId);
  }
};
