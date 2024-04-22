import winston, { format, createLogger } from 'winston';

const loggerInstance = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    // - Write all logs error (and below) to `error.log`.
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'log.log' }),
  ],
});

// If we're not in production then **ALSO** log to the `console`, with the colorized simple format.
loggerInstance.add(
  // - Write to all logs with specified level to console.
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  })
);

export default loggerInstance;
