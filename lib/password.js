// lib/password.js
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  try {
    // Use the synchronous version for more consistent results
    const salt = bcrypt.genSaltSync(SALT_ROUNDS);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
  } catch (error) {
    console.error('Hash creation error:', error);
    throw error;
  }
}

export async function verifyPassword(password, hash) {
  try {
    // Use the synchronous version for consistency
    return bcrypt.compareSync(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    throw error;
  }
}
