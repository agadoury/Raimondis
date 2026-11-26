// Server-only settings. The "server-only" import makes the build fail if any
// client component ever imports this file, so the admin password can't leak
// into the browser bundle.
import "server-only";

export const ADMIN_PASSWORD = "admin123";

/** Max nominations one person can submit per hour. */
export const RATE_LIMIT_PER_HOUR = 60;

/** Max sign-in attempts per name per hour (stops someone guessing a 4-digit code). */
export const SIGN_IN_ATTEMPTS_PER_HOUR = 10;
