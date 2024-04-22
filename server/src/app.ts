import express from 'express';

import winston from 'winston';
import morgan from 'morgan';

import connectBlockchain from './blockchain-connection';
import log from './middlewares/logger';

const app = express();
const PORT = 3000;

let transports: winston.transports.ConsoleTransportInstance[] = [
  new winston.transports.Console(),
];

const bootstrapServer = async () => {
  const { combine, timestamp, json } = winston.format;
  const logger = winston.createLogger({
    level: 'http',
    format: combine(
      timestamp({
        format: 'YYYY-MM-DD hh:mm:ss.SSS A',
      }),
      json()
    ),
    transports,
  });

  const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
      stream: {
        // Configure Morgan to use our custom logger with the http severity
        write: (message: string) => logger.http(message.trim()),
      },
    }
  );

  app.use(morganMiddleware);
  await connectBlockchain().catch((error) => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
  });

  app.get('/', (req, res) => {
    res.send('Hello from TypeScript Node.js server!');
  });

  app.listen(PORT, () => {
    log.info(`Server running on http://localhost:${PORT}`);
  });
};

void bootstrapServer();
