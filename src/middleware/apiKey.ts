import { Request, Response, NextFunction } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

let apiKeys: Set<string> = new Set();
let adminApiKeys: Set<string> = new Set();

function loadApiKeys(): void {
  // Load regular API keys
  const envKeys = process.env.API_KEYS;
  if (envKeys) {
    apiKeys = new Set(
      envKeys.split(',').map(key => key.trim()).filter(key => key.length > 0)
    );
    console.log(`Loaded ${apiKeys.size} API key(s) from environment`);
  } else {
    try {
      const filePath = join(process.cwd(), 'api-keys.txt');
      const content = readFileSync(filePath, 'utf-8');
      apiKeys = new Set(
        content
          .split('\n')
          .map(line => line.split('#')[0].trim())
          .filter(line => line.length > 0)
      );
      console.log(`Loaded ${apiKeys.size} API key(s) from file`);
    } catch (error) {
      console.error('Warning: Could not load api-keys.txt');
      apiKeys = new Set();
    }
  }

  // Load admin API keys
  const envAdminKeys = process.env.ADMIN_API_KEYS;
  if (envAdminKeys) {
    adminApiKeys = new Set(
      envAdminKeys.split(',').map(key => key.trim()).filter(key => key.length > 0)
    );
    console.log(`Loaded ${adminApiKeys.size} admin API key(s) from environment`);
  } else {
    try {
      const filePath = join(process.cwd(), 'admin-api-keys.txt');
      const content = readFileSync(filePath, 'utf-8');
      adminApiKeys = new Set(
        content
          .split('\n')
          .map(line => line.split('#')[0].trim())
          .filter(line => line.length > 0)
      );
      console.log(`Loaded ${adminApiKeys.size} admin API key(s) from file`);
    } catch (error) {
      console.error('Warning: Could not load admin-api-keys.txt');
      adminApiKeys = new Set();
    }
  }
}

// Load keys on startup
loadApiKeys();

function getApiKey(req: Request): string | undefined {
  return req.header('X-API-Key') || req.query.api_key as string;
}

// Middleware for regular API access (allows both regular and admin keys)
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = getApiKey(req);

  if (!apiKey) {
    res.status(401).json({ success: false, error: 'API key required. Provide X-API-Key header or api_key query parameter.' });
    return;
  }

  if (!apiKeys.has(apiKey) && !adminApiKeys.has(apiKey)) {
    res.status(403).json({ success: false, error: 'Invalid API key' });
    return;
  }

  next();
}

// Middleware for admin-only API access
export function adminApiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = getApiKey(req);

  if (!apiKey) {
    res.status(401).json({ success: false, error: 'API key required. Provide X-API-Key header or api_key query parameter.' });
    return;
  }

  if (!adminApiKeys.has(apiKey)) {
    res.status(403).json({ success: false, error: 'Admin API key required' });
    return;
  }

  next();
}

export { loadApiKeys };
