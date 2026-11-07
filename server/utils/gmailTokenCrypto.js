import crypto from 'crypto';

const getEncryptionKey = () => {
  const value = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;

  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(
      'GMAIL_TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).'
    );
  }

  return Buffer.from(value, 'hex');
};

export const encryptRefreshToken = (token) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ]);

  return {
    encryptedRefreshToken: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
};

export const decryptRefreshToken = (record) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(record.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(record.authTag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(record.encryptedRefreshToken, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};
