import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  if (expected.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(expected, derivedKey);
}

