import { Router, Request, Response } from 'express';
import { query } from '../db/connection';

const router = Router();

interface QueryRequest {
  sql: string;
  params?: unknown[];
}

// Execute a query and return results
router.post('/', async (req: Request, res: Response) => {
  try {
    const { sql, params } = req.body as QueryRequest;

    if (!sql) {
      res.status(400).json({ error: 'SQL query is required' });
      return;
    }

    const results = await query(sql, params);
    res.json({
      success: true,
      data: results,
      rowCount: Array.isArray(results) ? results.length : 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// Get list of tables in the database
router.get('/tables', async (_req: Request, res: Response) => {
  try {
    const results = await query<Array<{ Tables_in_database: string }>>(
      'SHOW TABLES'
    );
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// Describe a specific table
router.get('/tables/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const results = await query(`DESCRIBE \`${tableName}\``);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
