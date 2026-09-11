// Shared brute-force guard for admin login, used by both the legacy EJS
// login route (routes/admin.js) and the new JSON login route
// (routes/api/adminApi.js) so attempts against either path count toward the
// same lockout. Simple in-memory guard, keyed by "ip + username"; resets on
// server restart, which is an acceptable trade-off for a small
// single-instance app — the goal is slowing down casual password guessing,
// not replacing a full security stack.
const loginAttempts = new Map(); // key -> { count, firstAttemptAt, lockedUntil }
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function loginKey(req, username) {
  return `${req.ip}::${(username || '').trim().toLowerCase()}`;
}

function isLockedOut(key) {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) return true;
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    loginAttempts.delete(key); // lockout expired, start fresh
    return false;
  }
  return false;
}

function minutesLeft(key) {
  const entry = loginAttempts.get(key);
  if (!entry || !entry.lockedUntil) return 0;
  return Math.max(1, Math.ceil((entry.lockedUntil - Date.now()) / 60000));
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttemptAt: now, lockedUntil: null });
    return;
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
  loginAttempts.set(key, entry);
}

function clearAttempts(key) {
  loginAttempts.delete(key);
}

module.exports = { loginKey, isLockedOut, minutesLeft, recordFailedAttempt, clearAttempts };
