/**
 * One-off helper: register the MediaConvert Job Template (PortfolioHlsAbr) in
 * AWS from the checked-in JSON definition, so you never have to fight the
 * AWS console file picker.
 *
 * Usage (from server/):
 *   node scripts/create-mc-template.mjs
 *
 * It loads credentials from server/.env via dotenv (never prints them), then
 * calls CreateJobTemplateCommand with the settings in
 * mediaconvert-hls-template.json. The template NAME is taken from
 * AWS_MEDIACONVERT_JOB_TEMPLATE so this always stays in sync with the server.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// dotenv is an ESM/CJS-mixed package; this works from within server/.
require('dotenv').config({ path: path.resolve('server/.env') });

const {
  MediaConvertClient,
  CreateJobTemplateCommand,
  GetJobTemplateCommand,
} = require('@aws-sdk/client-mediaconvert');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const templateName = process.env.AWS_MEDIACONVERT_JOB_TEMPLATE || 'PortfolioHlsAbr';

if (!region || !accessKeyId || !secretAccessKey) {
  console.error('Missing AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION in server/.env');
  process.exit(1);
}

// Load the job definition JSON. The top-level `settings` object is exactly the
// `Settings` payload the CreateJobTemplate API expects.
const templatePath = path.resolve(__dirname, '../mediaconvert-hls-template.json');
const raw = JSON.parse(await readFile(templatePath, 'utf8'));

// The MediaConvert *API* uses PascalCase JSON field names (OutputGroups, Type,
// HlsGroupSettings, ...). The checked-in JSON uses camelCase so it stays friendly
// for the AWS console's Import button (the console normalizes case there). The
// raw SDK/API does NOT normalize, so convert every object key to PascalCase
// before submitting. Immutable values (arrays, strings, numbers, booleans) are
// left alone.
const toPascalCase = (obj) => {
  if (Array.isArray(obj)) return obj.map(toPascalCase);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k[0].toUpperCase() + k.slice(1)] = toPascalCase(v);
    }
    return out;
  }
  return obj;
};
const submitSettings = toPascalCase(raw.settings);

const client = new MediaConvertClient({
  region,
  endpoint: `https://mediaconvert.${region}.amazonaws.com`,
  credentials: { accessKeyId, secretAccessKey },
});

// If it already exists, report and exit cleanly rather than failing on a 409.
try {
  const existing = await client.send(new GetJobTemplateCommand({ Name: templateName }));
  console.log(`Job template "${templateName}" already exists (id=${existing.JobTemplate?.Id}). Nothing to do.`);
  process.exit(0);
} catch (err) {
  // MediaConvert reports a missing template with a NotFoundException (name
  // varies: "NotFoundException" / "ResourceNotFoundException"); treat any
  // 404-class response as "doesn't exist yet" and proceed to create it.
  const isNotFound = err?.$metadata?.httpStatusCode === 404;
  if (!isNotFound) {
    console.error('Unexpected error checking for existing template:', err.message);
    process.exit(1);
  }
}

try {
  const res = await client.send(
    new CreateJobTemplateCommand({
      Name: templateName,
      Settings: submitSettings,
      Description: raw.description || `Adaptive HLS (240p/360p/720p/1080p) for portfolio videos`,
    })
  );
  console.log('SUCCESS: Created job template');
  console.log('  Name:    ', res.JobTemplate?.Name);
  console.log('  Id:      ', res.JobTemplate?.Id);
  console.log('  ARN:     ', res.JobTemplate?.Arn);
} catch (err) {
  console.error('Failed to create job template:');
  console.error(`  ${err.name}: ${err.message}`);
  if (err.$metadata?.httpStatusCode) console.error(`  HTTP ${err.$metadata.httpStatusCode}`);
  process.exitCode = 1;
}
