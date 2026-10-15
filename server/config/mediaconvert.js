import {
  MediaConvertClient,
  CreateJobCommand,
  GetJobCommand,
} from '@aws-sdk/client-mediaconvert';
import { getRegion, getBucket } from './s3.js';
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
export const isMediaConvertConfigured = () =>
  !!(process.env.AWS_MEDIACONVERT_ROLE_ARN &&
     process.env.AWS_MEDIACONVERT_JOB_TEMPLATE &&
     process.env.AWS_ACCESS_KEY_ID &&
     getRegion());

const hlsDirFor = (mp4Key) => {
  const name = mp4Key.replace(/\.[^.]+$/, ''); // strip extension
  return `hls/${name}`;
};

export const getHlsManifestUrl = (mp4Key) =>
  `https://${getBucket()}.s3.${getRegion()}.amazonaws.com/${encodeURI(`${hlsDirFor(mp4Key)}/index.m3u8`)}`;

export const submitHlsJob = async ({ mp4Key }) => {
  const client = isMediaConvertConfigured() ? getMcClient() : null;
  if (!client || !mp4Key) return null;

  const params = {
    Role: process.env.AWS_MEDIACONVERT_ROLE_ARN,
    JobTemplate: process.env.AWS_MEDIACONVERT_JOB_TEMPLATE,
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
    console.error('MediaConvert submit failed:', err.message);
    return null;
  }
};

export const pollJobUntilDone = async (jobId, { timeoutMs = 30 * 60 * 1000, intervalMs = 15000 } = {}) => {
  const client = getMcClient();
  if (!client || !jobId) throw new Error('MediaConvert not configured / no job id');
  const start = Date.now();
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  while (true) {
    const { Job } = await client.send(new GetJobCommand({ Id: jobId }));
    const status = Job?.Status;
    if (status === 'COMPLETE') return { status };
    if (status === 'ERROR' || status === 'CANCELED') {
      console.error(`MediaConvert job ${jobId} ended ${status}:`, Job?.ErrorCode, Job?.ErrorMessage);
      throw new Error(`MediaConvert job ${status}`);
    }
    if (Date.now() - start > timeoutMs) throw new Error('MediaConvert job timed out');
    await sleep(intervalMs);
  }
};
