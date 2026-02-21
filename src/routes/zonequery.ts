import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import { apiKeyAuth } from '../middleware/apiKey';

const router = Router();

// Search posts by forum name (regular API keys allowed)
router.get('/search', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 200, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!q || q.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Forum name search query "q" is required' });
      return;
    }

    const searchPattern = `%${q.toLowerCase()}%`;

    const postsQuery = `
      SELECT
        t.topic_title, f.forum_name, p.post_subject, p.post_text, p.forum_id, p.topic_id
      FROM phpbb_posts p
      JOIN phpbb_topics t ON p.topic_id = t.topic_id
      JOIN phpbb_forums f ON p.forum_id = f.forum_id
      WHERE p.post_visibility = 1
        AND p.forum_id NOT IN (197, 196, 192, 149, 150)
        AND (
          LOWER(f.forum_name) LIKE ?
          OR f.parent_id IN (
            SELECT forum_id FROM phpbb_forums WHERE LOWER(forum_name) LIKE ?
          )
        )
      ORDER BY p.post_time DESC
      LIMIT ? OFFSET ?
    `;

    const posts = await query<Array<Record<string, unknown>>>(postsQuery, [searchPattern, searchPattern, limit, offset]);

    const postsWithUrls = posts.map(post => ({
      ...post,
      url: `https://valkurianblades.info/viewtopic.php?t=${post.topic_id}`,
    }));

    res.json({
      success: true,
      query: q,
      data: {
        posts: postsWithUrls,
      },
      pagination: {
        limit,
        offset,
        post_count: posts.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
