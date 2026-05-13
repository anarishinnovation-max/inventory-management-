type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * A lightweight structured logger that provides consistent JSON formatting
 * for logs, making them easier to parse in production environments.
 * Integrates with standard console methods for now.
 */
class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: any) {
    const logObject = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta || {}),
    };

    // In a real production app, you might use a library like 'pino' 
    // to handle the actual stream piping and performance optimization.
    return JSON.stringify(logObject);
  }

  info(message: string, meta?: any) {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, error?: Error | any, meta?: any) {
    const errorDetails = error instanceof Error 
      ? { error: error.message, stack: error.stack }
      : { error: typeof error === 'string' ? error : JSON.stringify(error) };
    
    console.error(this.formatMessage('error', message, { ...errorDetails, ...meta }));
    
    // TODO: Integrate with Sentry in production
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error instanceof Error ? error : new Error(message));
    // }
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new Logger();
export default logger;
