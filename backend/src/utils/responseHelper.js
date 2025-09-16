// Response helper utilities for consistent API responses

class ResponseHelper {
  // Success response
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  // Error response
  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      error: {
        message,
        timestamp: new Date().toISOString()
      }
    };

    if (errors) {
      response.error.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  // Validation error response
  static validationError(res, errors, message = 'Validation failed') {
    return this.error(res, message, 400, errors);
  }

  // Unauthorized error response
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  // Forbidden error response
  static forbidden(res, message = 'Forbidden access') {
    return this.error(res, message, 403);
  }

  // Not found error response
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  // Conflict error response
  static conflict(res, message = 'Resource conflict') {
    return this.error(res, message, 409);
  }

  // Too many requests error response
  static tooManyRequests(res, message = 'Too many requests') {
    return this.error(res, message, 429);
  }

  // Created response
  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  // No content response
  static noContent(res) {
    return res.status(204).send();
  }

  // Paginated response
  static paginated(res, data, pagination, message = 'Data retrieved successfully') {
    const response = {
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        itemsPerPage: pagination.itemsPerPage,
        hasNext: pagination.hasNext,
        hasPrev: pagination.hasPrev
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(response);
  }

  // File response helper
  static file(res, filePath, fileName = null, mimeType = null) {
    if (fileName) {
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    }
    
    if (mimeType) {
      res.setHeader('Content-Type', mimeType);
    }

    return res.sendFile(filePath);
  }

  // Redirect response
  static redirect(res, url, permanent = false) {
    const statusCode = permanent ? 301 : 302;
    return res.redirect(statusCode, url);
  }

  // Cache response helper
  static cached(res, data, cacheControl = 'public, max-age=3600', message = 'Success') {
    res.setHeader('Cache-Control', cacheControl);
    return this.success(res, data, message);
  }

  // API rate limit info helper
  static withRateLimit(res, data, rateLimitInfo, message = 'Success') {
    if (rateLimitInfo) {
      res.setHeader('X-RateLimit-Limit', rateLimitInfo.limit);
      res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimitInfo.reset);
    }
    
    return this.success(res, data, message);
  }
}

// Export for ES modules
export default ResponseHelper;

// Individual exports for convenience
export const {
  success,
  error,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  created,
  noContent,
  paginated,
  file,
  redirect,
  cached,
  withRateLimit
} = ResponseHelper;