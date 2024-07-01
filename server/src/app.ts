import express from 'express';

import winston from 'winston';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import routers from './controllers';
import cors from 'cors';
import log from './middlewares/logger';
import connectBlockchain from './blockchain-connection';

const app = express();
const PORT = process.env.PORT;

export const prisma = new PrismaClient();

let transports: winston.transports.ConsoleTransportInstance[] = [
	new winston.transports.Console(),
];

const bootstrapServer = async () => {
	let HLFClient;
	let HLFGateway;

	try {
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

		await prisma.$connect();

		app.use(morganMiddleware);
		const { contract, client, gateway } = await connectBlockchain();

		HLFClient = client;
		HLFGateway = gateway;

		app.use(cors());
		app.set('contract', contract);
		app.use(
			express.urlencoded({
				extended: true,
			})
		);
		app.use(express.json());

		app.get('/', (req, res) => {
			res.send('Hello from TypeScript Node.js server!');
		});

		app.use('/api', routers);

		app.listen(PORT, () => {
			log.info(`Server running on http://localhost:${PORT}`);
		});
	} catch (e) {
		void prisma.$disconnect();
		console.error(e);

		HLFClient?.close();
		HLFGateway?.close();
		process.exit(1);
	}
};

void bootstrapServer();
