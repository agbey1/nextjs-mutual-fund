import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
const KEY_LENGTH = 64;
/**
 * Hash a password using scrypt
 * Format: salt:hash
 */
export function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
    return `${salt}:${hash}`;
}
/**
 * Verify a password against a header
 */
export function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash)
        return false;
    const passwordBuffer = scryptSync(password, salt, KEY_LENGTH);
    const hashBuffer = Buffer.from(hash, "hex");
    return timingSafeEqual(passwordBuffer, hashBuffer);
}
