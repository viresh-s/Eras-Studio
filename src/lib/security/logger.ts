export type SecurityLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY_AUDIT' | 'SECURITY_ALERT';

export interface SecurityLogPayload {
  action: string;
  userId?: string | null;
  ip?: string | null;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  level: SecurityLogLevel;
  action: string;
  userId: string;
  ip: string;
  details?: Record<string, unknown>;
}

// Memory Ring Buffer for Verified Real-Time Administrative Security Centre Visibility
const MAX_EVENT_BUFFER = 200;
const eventBuffer: SecurityLogEntry[] = [];
let totalEventsCount = 0;
let failedAuthCount = 0;
let unauthorizedApiCount = 0;
let securityAlertsCount = 0;

// Sensitive keys that must NEVER appear in logs
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'authorization',
  'cookie',
  'credential',
]);

function redactSensitiveData(obj: unknown, depth = 0): unknown {
  if (depth > 4 || obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return obj.length > 256 ? `${obj.slice(0, 256)}...[TRUNCATED]` : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

export const securityLogger = {
  log(level: SecurityLogLevel, payload: SecurityLogPayload) {
    const timestamp = new Date().toISOString();
    const sanitizedDetails = payload.details ? (redactSensitiveData(payload.details) as Record<string, unknown>) : undefined;

    const logEntry: SecurityLogEntry = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      level,
      action: payload.action,
      userId: payload.userId || 'anonymous',
      ip: payload.ip || 'unknown',
      details: sanitizedDetails,
    };

    // Update real system security counters
    totalEventsCount++;
    const act = payload.action.toUpperCase();
    if (act.includes('LOGIN_FAILED') || act.includes('RATE_LIMIT_LOGIN') || act.includes('AUTH_FAILED')) {
      failedAuthCount++;
    }
    if (act.includes('UNAUTHORIZED') || act.includes('FORBIDDEN') || act.includes('ACCESS_DENIED') || act.includes('TAMPER')) {
      unauthorizedApiCount++;
    }
    if (level === 'SECURITY_ALERT') {
      securityAlertsCount++;
    }

    // Keep ring buffer
    eventBuffer.unshift(logEntry);
    if (eventBuffer.length > MAX_EVENT_BUFFER) {
      eventBuffer.pop();
    }

    if (level === 'SECURITY_ALERT' || level === 'ERROR') {
      console.error(`[SECURITY ${level}] ${JSON.stringify(logEntry)}`);
    } else if (level === 'SECURITY_AUDIT' || level === 'WARN') {
      console.warn(`[SECURITY ${level}] ${JSON.stringify(logEntry)}`);
    } else {
      console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);
    }
  },

  audit(action: string, payload?: Record<string, unknown>) {
    this.log('SECURITY_AUDIT', { action, ...(payload || {}) });
  },

  alert(action: string, payload?: Record<string, unknown>) {
    this.log('SECURITY_ALERT', { action, ...(payload || {}) });
  },

  info(action: string, payload?: Record<string, unknown>) {
    this.log('INFO', { action, ...(payload || {}) });
  },

  warn(action: string, payload?: Record<string, unknown>) {
    this.log('WARN', { action, ...(payload || {}) });
  },

  error(action: string, payload?: Record<string, unknown>) {
    this.log('ERROR', { action, ...(payload || {}) });
  },
};

export function getSecurityAuditStats() {
  return {
    totalEventsCount,
    failedAuthCount,
    unauthorizedApiCount,
    securityAlertsCount,
    bufferLength: eventBuffer.length,
  };
}

export function getRecentSecurityEvents(limit = 50): SecurityLogEntry[] {
  return eventBuffer.slice(0, limit);
}
