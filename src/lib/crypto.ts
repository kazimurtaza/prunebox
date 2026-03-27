import crypto from 'crypto';
import { promisify } from 'util';

const pbkdf2 = promisify(crypto.pbkdf2);

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

let cachedEncryptionKey: string | undefined;

function getEncryptionKey(): string {
  if (cachedEncryptionKey) return cachedEncryptionKey;

  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 16) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is missing or too short (minimum 16 characters). ' +
      'Generate one with: openssl rand -base64 48'
    );
  }
  cachedEncryptionKey = key;
  return key;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @returns Base64 encoded string containing salt:iv:authTag:encrypted
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return '';

  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = await pbkdf2(
    getEncryptionKey(),
    salt,
    100000,
    32,
    'sha256'
  );

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'binary');
  encrypted += cipher.final('binary');

  const authTag = cipher.getAuthTag();

  // Combine: salt + iv + authTag + encrypted
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'binary')
  ]);

  return combined.toString('base64');
}

/**
 * Decrypt data that was encrypted using encrypt()
 * @param ciphertext - Base64 encoded string from encrypt()
 * @returns The original plaintext
 * @throws Error if decryption fails or data is tampered with
 */
export async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext) return '';

  const combined = Buffer.from(ciphertext, 'base64');

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, TAG_POSITION);
  const authTag = combined.subarray(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = combined.subarray(ENCRYPTED_POSITION);

  // Derive key using the same salt
  const key = await pbkdf2(
    getEncryptionKey(),
    salt,
    100000,
    32,
    'sha256'
  );

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, 'binary') as string;
  decrypted += decipher.final('binary');

  return decrypted;
}

