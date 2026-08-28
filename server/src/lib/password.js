// Password hashing. Argon2id is the current OWASP recommendation.
// The raw password is never stored or logged.
//
// We use @node-rs/argon2 (Rust, ships prebuilt binaries) so `npm install` works on
// Windows/macOS/Linux without a C++ toolchain.

import { hash, verify } from '@node-rs/argon2';

// Tuned for interactive logins: strong, but comfortably under ~100ms on a typical server.
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (plain) => hash(plain, OPTIONS);

export const verifyPassword = async (storedHash, plain) => {
  try {
    return await verify(storedHash, plain);
  } catch {
    // A malformed hash should read as "wrong password", not crash the request.
    return false;
  }
};
