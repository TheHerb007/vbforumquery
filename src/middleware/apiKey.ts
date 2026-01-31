import { Request, Response, NextFunction } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

let apiKeys: Set<string> = new Set();

function loadApiKeys(): void {
  // First try environment variable (comma-separated)
  const envKeys = process.env.API_KEYS;
  if (envKeys) {
    apiKeys = new Set(
      envKeys.split(',').map(key => key.trim()).filter(key => key.length > 0)
    );
    console.log(`Loaded ${apiKeys.size} API key(s) from environment`);
    return;
  }

  // Fall back to file
  try {
    const filePath = join(process.cwd(), 'api-keys.txt');
    const content = readFileSync(filePath, 'utf-8');
    apiKeys = new Set(
      content
        .split('\n')
        .map(line => line.split('#')[0].trim())  // Remove inline comments
        .filter(line => line.length > 0)
    );
    console.log(`Loaded ${apiKeys.size} API key(s) from file`);
  } catch (error) {
    console.error('Warning: Could not load api-keys.txt');
    apiKeys = new Set();
  }
}

// Load keys on startup
loadApiKeys();

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('X-API-Key') || req.query.api_key as string;

  if (!apiKey) {
    res.status(401).json({ success: false, error: 'API key required. Provide X-API-Key header or api_key query parameter.' });
    return;
  }

  if (!apiKeys.has(apiKey)) {
    res.status(403).json({ success: false, error: 'Invalid API key' });
    return;
  }

  next();
}

export { loadApiKeys };
