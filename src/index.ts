import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import queryRoutes from './routes/query';
import healthRoutes from './routes/health';
import { closePool } from './db/connection';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/query', queryRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'vbforumquery',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      query: '/api/query',
      tables: '/api/query/tables',
      describeTable: '/api/query/tables/:tableName',
    },
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await closePool();
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await closePool();
    console.log('Server closed');
    process.exit(0);
  });
});
