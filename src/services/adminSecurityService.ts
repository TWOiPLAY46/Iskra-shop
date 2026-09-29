export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  email: string;
  success: boolean;
  reason?: string;
  userAgent?: string;
}

const STORAGE_KEY_SECURITY = 'iskra_admin_security_v1';
const STORAGE_KEY_LOGS = 'iskra_admin_security_logs_v1';
const STORAGE_KEY_SESSION = 'iskra_admin_secure_session_v1';

interface SecurityState {
  failedAttempts: number;
  lockoutUntil: number; // timestamp in ms
  lastAttemptTime: number;
}

function getStoredSecurityState(): SecurityState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SECURITY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        failedAttempts: Number(parsed.failedAttempts) || 0,
        lockoutUntil: Number(parsed.lockoutUntil) || 0,
        lastAttemptTime: Number(parsed.lastAttemptTime) || 0,
      };
    }
  } catch {}
  return { failedAttempts: 0, lockoutUntil: 0, lastAttemptTime: 0 };
}

function saveSecurityState(state: SecurityState) {
  try {
    localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(state));
  } catch {}
}

/**
 * Check current rate-limit and lock status
 */
export function checkAdminSecurityStatus(): {
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
  requireBotCheck: boolean;
} {
  const state = getStoredSecurityState();
  const now = Date.now();

  if (state.lockoutUntil > now) {
    const remaining = Math.ceil((state.lockoutUntil - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds: remaining,
      failedAttempts: state.failedAttempts,
      requireBotCheck: true,
    };
  }

  // If lockout expired, reset if it was more than 30 minutes ago
  if (state.lockoutUntil > 0 && now - state.lastAttemptTime > 1800000) {
    saveSecurityState({ failedAttempts: 0, lockoutUntil: 0, lastAttemptTime: now });
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0, requireBotCheck: false };
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    failedAttempts: state.failedAttempts,
    requireBotCheck: state.failedAttempts >= 2,
  };
}

/**
 * Record a failed attempt with progressive lockout
 */
export function recordFailedLogin(email: string, reason: string): {
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
} {
  const state = getStoredSecurityState();
  const now = Date.now();
  const attempts = state.failedAttempts + 1;

  let lockoutDuration = 0;
  if (attempts >= 5) {
    lockoutDuration = 15 * 60 * 1000; // 15 minutes lockout for 5+ attempts
  } else if (attempts >= 3) {
    lockoutDuration = 45 * 1000; // 45 seconds cooldown for 3-4 attempts
  }

  const newState: SecurityState = {
    failedAttempts: attempts,
    lockoutUntil: lockoutDuration > 0 ? now + lockoutDuration : 0,
    lastAttemptTime: now,
  };
  saveSecurityState(newState);

  // Add to security log
  addSecurityLog({
    email,
    success: false,
    reason: attempts >= 5 
      ? `Блокування системи (5 невдалих спроб): ${reason}`
      : `Невдала спроба #${attempts}: ${reason}`,
  });

  return {
    isLocked: lockoutDuration > 0,
    remainingSeconds: Math.ceil(lockoutDuration / 1000),
    failedAttempts: attempts,
  };
}

/**
 * Record a successful login and create secure session token
 */
export function recordSuccessfulLogin(email: string): string {
  const now = Date.now();
  // Reset security lockout on success
  saveSecurityState({ failedAttempts: 0, lockoutUntil: 0, lastAttemptTime: now });

  // Generate secure token
  const token = 'iskra_sec_' + Math.random().toString(36).substring(2) + '_' + now;
  const sessionData = {
    token,
    email,
    loginTime: now,
    expiresAt: now + (45 * 60 * 1000), // 45 minutes session lifetime
  };

  try {
    sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionData));
    sessionStorage.setItem('isAdminLoggedIn', 'true');
    sessionStorage.setItem('adminUserEmail', email);
  } catch {}

  addSecurityLog({
    email,
    success: true,
    reason: 'Успішний вхід в панель керування',
  });

  return token;
}

/**
 * Verify active secure session
 */
export function verifySecureSession(): { isValid: boolean; email?: string } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return { isValid: false };

    const session = JSON.parse(raw);
    const now = Date.now();
    if (session.expiresAt && session.expiresAt > now) {
      // Refresh session lifetime on active usage
      session.expiresAt = now + (45 * 60 * 1000);
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      return { isValid: true, email: session.email };
    }
  } catch {}

  // Expired
  clearSecureSession();
  return { isValid: false };
}

/**
 * Clear secure session on logout
 */
export function clearSecureSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    sessionStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('adminUserEmail');
    sessionStorage.removeItem('iskra_admin_auth');
    localStorage.removeItem('iskra_admin_auth');
  } catch {}
}

/**
 * Security audit log management
 */
function addSecurityLog(entry: { email: string; success: boolean; reason?: string }) {
  try {
    const logs = getSecurityLogs();
    const newEntry: SecurityLogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleString('uk-UA', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      email: entry.email || 'Невідомий',
      success: entry.success,
      reason: entry.reason,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'Web Client'
    };

    const updated = [newEntry, ...logs].slice(0, 50); // Keep last 50 logs
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
  } catch {}
}

export function getSecurityLogs(): SecurityLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function clearSecurityAuditLogs() {
  try {
    localStorage.removeItem(STORAGE_KEY_LOGS);
  } catch {}
}

/**
 * Generate a dynamic math anti-bot challenge
 */
export function generateAntiBotChallenge(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 8) + 2; // 2-9
  const b = Math.floor(Math.random() * 8) + 2; // 2-9
  return {
    question: `Скільки буде ${a} + ${b}?`,
    answer: a + b
  };
}
