import bcrypt from 'bcryptjs';

/**
 * Password Utility
 * Handles password hashing and verification
 */

const SALT_ROUNDS = 10;

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if a password hash is valid format
 */
export function isValidHash(hash: string): boolean {
  // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
  return /^\$2[ayb]\$.{56}$/.test(hash);
}

