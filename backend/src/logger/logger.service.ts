import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as net from 'net';

interface LogEntry {
  '@timestamp': string;
  level: string;
  message: string;
  context?: string;
  container_name: string;
  service: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logstashHost: string;
  private logstashPort: number;
  private serviceName = 'backend';

  constructor() {
    this.logstashHost = process.env.LOGSTASH_HOST || 'logstash';
    this.logstashPort = parseInt(process.env.LOGSTASH_PORT || '5000', 10);
  }

  private sendToLogstash(entry: LogEntry): void {
    // Don't block on logstash connection
    setImmediate(() => {
      const client = new net.Socket();
      client.setTimeout(1000);

      client.connect(this.logstashPort, this.logstashHost, () => {
        client.write(JSON.stringify(entry) + '\n');
        client.end();
      });

      client.on('error', () => {
        // Silently fail - ELK might not be running
        client.destroy();
      });

      client.on('timeout', () => {
        client.destroy();
      });
    });
  }

  private createLogEntry(level: string, message: any, context?: string, meta?: any): LogEntry {
    return {
      '@timestamp': new Date().toISOString(),
      level,
      message: typeof message === 'object' ? JSON.stringify(message) : String(message),
      context: context || 'Application',
      container_name: 'pong-backend',
      service: this.serviceName,
      ...meta,
    };
  }

  log(message: any, context?: string): void {
    const entry = this.createLogEntry('INFO', message, context);
    console.log(`[${entry.context}] ${entry.message}`);
    this.sendToLogstash(entry);
  }

  error(message: any, trace?: string, context?: string): void {
    const entry = this.createLogEntry('ERROR', message, context, { trace });
    console.error(`[${entry.context}] ERROR: ${entry.message}`);
    if (trace) console.error(trace);
    this.sendToLogstash(entry);
  }

  warn(message: any, context?: string): void {
    const entry = this.createLogEntry('WARN', message, context);
    console.warn(`[${entry.context}] WARN: ${entry.message}`);
    this.sendToLogstash(entry);
  }

  debug(message: any, context?: string): void {
    const entry = this.createLogEntry('DEBUG', message, context);
    console.debug(`[${entry.context}] DEBUG: ${entry.message}`);
    this.sendToLogstash(entry);
  }

  verbose(message: any, context?: string): void {
    const entry = this.createLogEntry('VERBOSE', message, context);
    console.log(`[${entry.context}] VERBOSE: ${entry.message}`);
    this.sendToLogstash(entry);
  }

  // Custom method for security events
  logSecurityEvent(event: string, details: Record<string, any>): void {
    const entry = this.createLogEntry('SECURITY', event, 'Security', {
      security_event: true,
      event_type: event,
      ...details,
    });
    console.log(`[SECURITY] ${event}`, JSON.stringify(details));
    this.sendToLogstash(entry);
  }

  // Custom method for API requests
  logApiRequest(method: string, path: string, statusCode: number, duration: number, userId?: number): void {
    const entry = this.createLogEntry('INFO', `${method} ${path} ${statusCode} ${duration}ms`, 'API', {
      http_method: method,
      request_path: path,
      status_code: statusCode,
      response_time_ms: duration,
      user_id: userId,
    });
    console.log(`[API] ${method} ${path} ${statusCode} ${duration}ms`);
    this.sendToLogstash(entry);
  }

  // Custom method for Vault access
  logVaultAccess(action: string, success: boolean, details?: Record<string, any>): void {
    const entry = this.createLogEntry('INFO', `Vault ${action}: ${success ? 'success' : 'failed'}`, 'Vault', {
      vault_action: action,
      success,
      ...details,
    });
    console.log(`[Vault] ${action}: ${success ? 'success' : 'failed'}`);
    this.sendToLogstash(entry);
  }

  // Custom method for database operations
  logDatabaseOperation(operation: string, table: string, duration?: number): void {
    const entry = this.createLogEntry('DEBUG', `DB ${operation} on ${table}`, 'Database', {
      db_operation: operation,
      table,
      duration_ms: duration,
    });
    this.sendToLogstash(entry);
  }
}
