import express from "express";

import winston from "winston";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import routers from "./controllers";
import cors from "cors";

import connectBlockchain from "./blockchain-connection";
import log from "./middlewares/logger";

const app = express();
const PORT = process.env.PORT;

export const prisma = new PrismaClient();

let transports: winston.transports.ConsoleTransportInstance[] = [
  new winston.transports.Console(),
];

const bootstrapServer = async () => {
  try {
    const { combine, timestamp, json } = winston.format;
    const logger = winston.createLogger({
      level: "http",
      format: combine(
        timestamp({
          format: "YYYY-MM-DD hh:mm:ss.SSS A",
        }),
        json(),
      ),
      transports,
    });

    const morganMiddleware = morgan(
      ":method :url :status :res[content-length] - :response-time ms",
      {
        stream: {
          // Configure Morgan to use our custom logger with the http severity
          write: (message: string) => logger.http(message.trim()),
        },
      },
    );

    app.use(morganMiddleware);
    await connectBlockchain().catch((error) => {
      console.error("******** FAILED to run the application:", error);
      process.exitCode = 1;
    });

    app.use(cors());
    app.use(express.json());
    app.use(
      express.urlencoded({
        extended: true,
      }),
    );

    app.get("/", (req, res) => {
      res.send("Hello from TypeScript Node.js server!");
    });

    app.use("/api", routers);

    app.listen(PORT, () => {
      log.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

void bootstrapServer().finally(async () => {
  await prisma.$disconnect();
});
