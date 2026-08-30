import {
  MediaConvertClient,
  CreateJobCommand,
  GetJobCommand,
} from '@aws-sdk/client-mediaconvert';
import { getRegion, getBucket } from './s3.js';

/**
 * AWS Elemental MediaConvert client + HLS job helpers.
 *
 * Purpose: transcode an uploaded progressive MP4 (already in S3) into an
 * adaptive HLS set (240p/360p/720p/1080p) so the client player can drop quality
 * on slow connections instead of stalling. The server only submits a job and
 * polls its status — the actual transcoding runs entirely on AWS, so no ffmpeg
 * is needed on Render's ephemeral CPU.
 *
 * The HLS job definition itself lives in `mediaconvert-hls-template.json`
 * (import it once into MediaConvert as a Job Template from the AWS console —
 * the console validates the JSON there, so we never ship an unvalidated job
 * payload). The server submits a small CreateJob that references that template
 * by name and overrides only the input file + output destination to the S3
 * object just uploaded. See the README / plan notes for the one-time AWS setup.
 *
 * Transcoding is OPT-IN: nothing here does work unless `AWS_MEDIACONVERT_ROLE_ARN`
 * AND `AWS_MEDIACONVERT_JOB_TEMPLATE` are set in server/.env (the AWS creds +
 * region are shared with S3). Without them the app works exactly as before
 * (progressive MP4 playback only) — a safe rollout while the role/template are
 * being created.
 *
 * Like config/s3.js, env vars are read LAZILY inside the functions (never at
 * module load) so this module is safe to import before dotenv.config() runs.
 */

// MediaConvert requires an explicit per-region endpoint. We use the stable
// regional form `https://mediaconvert.<region>.amazonaws.com` so we never depend
// on the DescribeEndpoints lookup.
const MC_ENDPOINT = () => `https://mediaconvert.${getRegion()}.amazonaws.com`;

let mcClient;
const getMcClient = () => {
  if (!getRegion() || !process.env.AWS_ACCESS_KEY_ID) return null;
  if (!mcClient) {
    mcClient = new MediaConvertClient({
      region: getRegion(),
      endpoint: MC_ENDPOINT(),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return mcClient;
};

/**
 * True only when transcoding is fully configured. All transcode entry points
 * check this and no-op when false.
 */
export const isMediaConvertConfigured = () =>
  !!(process.env.AWS_MEDIACONVERT_ROLE_ARN &&
     process.env.AWS_MEDIACONVERT_JOB_TEMPLATE &&
     process.env.AWS_ACCESS_KEY_ID &&
     getRegion());

// Where the HLS output set is written, keyed off the source MP4 key. E.g.
// video-123456.mp4 -> hls/video-123456/index.m3u8 (+ segments alongside).
const hlsDirFor = (mp4Key) => {
  const name = mp4Key.replace(/\.[^.]+$/, ''); // strip extension
  return `hls/${name}`;
};

/**
 * Public URL of the master playlist for a source MP4 key. Deterministic (the
 * transcode writes there), so callers can compute it whether or not a job has
 * actually completed.
 */
export const getHlsManifestUrl = (mp4Key) =>
  `https://${getBucket()}.s3.${getRegion()}.amazonaws.com/${encodeURI(`${hlsDirFor(mp4Key)}/index.m3u8`)}`;

/**
 * Submit an HLS transcode job for the given source MP4 key, using the imported
 * Job Template (name from env). Overrides the template's input + output
 * destination to point at this upload. Returns the jobId, or null when
 * MediaConvert isn't configured / submission fails (best-effort).
 */
export const submitHlsJob = async ({ mp4Key }) => {
  const client = isMediaConvertConfigured() ? getMcClient() : null;
  if (!client || !mp4Key) return null;

  const params = {
    Role: process.env.AWS_MEDIACONVERT_ROLE_ARN,
    JobTemplate: process.env.AWS_MEDIACONVERT_JOB_TEMPLATE,
    // Runtime overrides on top of the template: which file, and where to write.
    Settings: {
      Inputs: [{ FileInput: `s3://${getBucket()}/${mp4Key}` }],
      OutputGroups: [
        {
          Name: 'HLS',
          OutputGroupSettings: {
            Type: 'HLS_GROUP_SETTINGS',
            HlsGroupSettings: {
              Destination: `s3://${getBucket()}/${hlsDirFor(mp4Key)}/`,
            },
          },
        },
      ],
    },
  };

  try {
    const res = await client.send(new CreateJobCommand(params));
    return res.Job?.Id || null;
  } catch (err) {
    // Transcoding is best-effort; a submit failure must not break the upload
    // (the MP4 is already safe and playable).
    // eslint-disable-next-line no-console
    console.error('MediaConvert submit failed:', err.message);
    return null;
  }
};

/**
 * Poll a MediaConvert job until it reaches a terminal state. Returns { status }
 * on COMPLETE; throws on ERROR/CANCELED or timeout. The manifest URL is computed
 * by the caller from the source key, so it isn't returned here.
 * @param {string} jobId
 * @param {object} [opts]  { timeoutMs=30*60*1000, intervalMs=15000 }
 */
export const pollJobUntilDone = async (jobId, { timeoutMs = 30 * 60 * 1000, intervalMs = 15000 } = {}) => {
  const client = getMcClient();
  if (!client || !jobId) throw new Error('MediaConvert not configured / no job id');
  const start = Date.now();
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { Job } = await client.send(new GetJobCommand({ Id: jobId }));
    const status = Job?.Status;
    if (status === 'COMPLETE') return { status };
    if (status === 'ERROR' || status === 'CANCELED') {
      // eslint-disable-next-line no-console
      console.error(`MediaConvert job ${jobId} ended ${status}:`, Job?.ErrorCode, Job?.ErrorMessage);
      throw new Error(`MediaConvert job ${status}`);
    }
    if (Date.now() - start > timeoutMs) throw new Error('MediaConvert job timed out');
    await sleep(intervalMs);
  }
};
