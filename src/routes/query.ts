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

// Search topics and posts by keyword
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!q || q.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Search query "q" is required' });
      return;
    }

    const searchPattern = `%${q}%`;

    // Search topics
    const topicsQuery = `
      SELECT
        t.topic_id, t.topic_title, t.forum_id, f.forum_name,
        t.topic_first_poster_name as author, t.topic_time,
        t.topic_views, t.topic_posts_approved as post_count
      FROM phpbb_topics t
      JOIN phpbb_forums f ON t.forum_id = f.forum_id
      WHERE t.topic_visibility = 1
        AND t.topic_title LIKE ?
      ORDER BY t.topic_time DESC
      LIMIT ? OFFSET ?
    `;

    // Search posts
    const postsQuery = `
      SELECT
        p.post_id, p.topic_id, t.topic_title, p.forum_id, f.forum_name,
        p.post_username as author, p.post_subject,
        SUBSTRING(p.post_text, 1, 200) as post_text_preview,
        p.post_time
      FROM phpbb_posts p
      JOIN phpbb_topics t ON p.topic_id = t.topic_id
      JOIN phpbb_forums f ON p.forum_id = f.forum_id
      WHERE p.post_visibility = 1
        AND (p.post_subject LIKE ? OR p.post_text LIKE ?)
      ORDER BY p.post_time DESC
      LIMIT ? OFFSET ?
    `;

    const [topics, posts] = await Promise.all([
      query<Array<Record<string, unknown>>>(topicsQuery, [searchPattern, limit, offset]),
      query<Array<Record<string, unknown>>>(postsQuery, [searchPattern, searchPattern, limit, offset]),
    ]);

    // Convert Unix timestamps to ISO dates
    const formatResults = (rows: Array<Record<string, unknown>>, timeField: string) =>
      rows.map((row) => ({
        ...row,
        created_at: new Date((row[timeField] as number) * 1000).toISOString(),
      }));

    res.json({
      success: true,
      query: q,
      data: {
        topics: formatResults(topics, 'topic_time'),
        posts: formatResults(posts, 'post_time'),
      },
      pagination: {
        limit,
        offset,
        topic_count: topics.length,
        post_count: posts.length,
      },
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
