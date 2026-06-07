import { toast } from 'sonner';

export class AppError extends Error {
  code?: number;
  details?: Record<string, any>;

  constructor(
    message: string, 
    code?: number, 
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

interface ErrorLogEntry {
  timestamp: number;
  message: string;
  code?: number;
  details?: Record<string, any>;
  stack?: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errorLog: ErrorLogEntry[] = [];
  private MAX_LOG_ENTRIES = 50;

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  logError(error: Error | AppError) {
    const entry: ErrorLogEntry = {
      timestamp: Date.now(),
      message: error.message,
      code: error instanceof AppError ? error.code : undefined,
      details: error instanceof AppError ? error.details : undefined,
      stack: error.stack
    };

    // Add to log, maintaining max entries
    this.errorLog.push(entry);
    if (this.errorLog.length > this.MAX_LOG_ENTRIES) {
      this.errorLog.shift();
    }

    // Optional: Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Logged Error:', entry);
    }
  }

  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  clearErrorLog() {
    this.errorLog = [];
  }
}

export const handleError = (error: unknown) => {
  const logger = ErrorLogger.getInstance();

  if (error instanceof AppError) {
    logger.logError(error);
    toast.error(error.message, {
      description: error.details 
        ? JSON.stringify(error.details) 
        : 'An unexpected error occurred',
      duration: 4000
    });
  } else if (error instanceof Error) {
    const appError = new AppError(error.message);
    logger.logError(appError);
    toast.error('An unexpected error occurred', {
      description: error.message,
      duration: 4000
    });
  } else {
    const genericError = new AppError('An unknown error occurred');
    logger.logError(genericError);
    toast.error('An unknown error occurred');
  }
};

export const createAppError = (
  message: string, 
  code?: number, 
  details?: Record<string, any>
): AppError => new AppError(message, code, details);

export const getErrorLog = () => {
  const logger = ErrorLogger.getInstance();
  return logger.getErrorLog();
};

export const clearErrorLog = () => {
  const logger = ErrorLogger.getInstance();
  logger.clearErrorLog();
};