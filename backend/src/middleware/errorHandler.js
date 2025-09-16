import config from '../config/config.js';

// Custom error class for API errors
export class APIError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types
export class ValidationError extends APIError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
    this.type = 'ValidationError';
  }
}

export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
    this.type = 'UnauthorizedError';
  }
}

export class ForbiddenError extends APIError {
  constructor(message = 'Forbidden access') {
    super(message, 403);
    this.type = 'ForbiddenError';
  }
}

export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.type = 'NotFoundError';
  }
}

export class ConflictError extends APIError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.type = 'ConflictError';
  }
}

export class TooManyRequestsError extends APIError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.type = 'TooManyRequestsError';
  }
}

export class InternalServerError extends APIError {
  constructor(message = 'Internal server error') {
    super(message, 500);
    this.type = 'InternalServerError';
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error occurred:', {
    message: err.message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = new ValidationError(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ConflictError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    error = new ValidationError('Validation failed', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new UnauthorizedError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new UnauthorizedError('Token expired');
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ValidationError('File too large');
  }

  // Default to 500 server error
  if (!error.isOperational) {
    error = new InternalServerError();
  }

  const response = {
    success: false,
    error: {
      message: error.message,
      type: error.type || 'APIError',
      timestamp: error.timestamp || new Date().toISOString()
    }
  };

  // Add validation errors if they exist
  if (error.errors) {
    response.error.errors = error.errors;
  }

  // Add stack trace in development
  if (config.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

export default errorHandler;