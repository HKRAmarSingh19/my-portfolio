// Run with: node scripts/inspect-gmail-indexes.js
// This is intentionally read-only. Back up MongoDB and drop the old provider_1
// unique index manually in Atlas after verifying the index name.
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) throw new Error('Set MONGODB_URI or MONGO_URI before running.');

await mongoose.connect(uri);
const collection = mongoose.connection.collection('gmailcredentials');
const indexes = await collection.indexes();

console.log('Current gmailcredentials indexes:');
console.table(indexes.map(({ name, key, unique }) => ({
  name,
  key: JSON.stringify(key),
  unique: Boolean(unique),
})));

await mongoose.disconnect();
