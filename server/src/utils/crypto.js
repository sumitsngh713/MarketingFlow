import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Fallback key for dev if ENCRYPTION_KEY not set in env (must be 32 bytes)
const SECRET_KEY = Buffer.from(
  (process.env.ENCRYPTION_KEY || 'marketingflow_secret_key_32bytes!').padEnd(32, '0').slice(0, 32)
);
const IV_LENGTH = 16;

/**
 * Encrypt sensitive credentials (e.g. SMTP passwords, API tokens)
 */
export function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive credentials
 */
export function decrypt(text) {
  if (!text) return '';
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return text; // Fallback if plain text
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed, returning empty:', error.message);
    return '';
  }
}
