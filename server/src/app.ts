import express from 'express';
import connectBlockchain from './blockchain-connection';

const app = express();
const PORT = 3000;

const bootstrapServer = async () => {
  await connectBlockchain().catch((error) => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
  });

  app.get('/', (req, res) => {
    res.send('Hello from TypeScript Node.js server!');
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

void bootstrapServer();
