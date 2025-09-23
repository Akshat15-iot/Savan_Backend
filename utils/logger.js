const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom format for console
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  }`;
});

// Custom format for files
const fileFormat = printf(({ level, message, timestamp, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...meta
  });
});

// Create logger instance
const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'real-estate-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        align(),
        consoleFormat
      )
    }),
    // Error file transport
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat
    }),
    // Combined file transport
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat
    })
  ]
});

// Add request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
    headers: {
      'user-agent': req.get('user-agent'),
      referer: req.get('referer')
    }
  });

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
      contentType: res.get('content-type')
    });
  });

  // Capture response errors
  res.on('error', (error) => {
    logger.error('Response error', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
  });

  next();
};

// Error handling middleware
const errorLogger = (error, req, res, next) => {
  logger.error('Unhandled error', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers
  });

  // Send error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};
