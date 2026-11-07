import mongoose from 'mongoose';

const gmailCredentialSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['gmail'],
      default: 'gmail',
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },
    encryptedRefreshToken: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { timestamps: true }
);

// Each allowed admin has an independent Gmail credential.
gmailCredentialSchema.index({ provider: 1, email: 1 }, { unique: true });

export default mongoose.model('GmailCredential', gmailCredentialSchema);
