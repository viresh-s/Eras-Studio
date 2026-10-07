type SecurityLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY_AUDIT' | 'SECURITY_ALERT';

interface SecurityLogPayload {
  action: string;
  userId?: string | null;
  ip?: string | null;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

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
    const sanitizedDetails = payload.details ? redactSensitiveData(payload.details) : undefined;

    const logEntry = {
      timestamp,
      level,
      action: payload.action,
      userId: payload.userId || 'anonymous',
      ip: payload.ip || 'unknown',
      details: sanitizedDetails,
    };

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
