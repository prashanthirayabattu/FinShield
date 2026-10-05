import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Cryptographically hashes a plaintext password using bcrypt with 12 salt rounds.
 */
export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

/**
 * Constant-time comparison between plaintext candidate and stored bcrypt hash.
 */
export async function comparePassword(
  plainTextPassword: string,
  storedHash: string
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, storedHash);
}
