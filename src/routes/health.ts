import { Router, Request, Response } from 'express';
import { getPool } from '../db/connection';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
