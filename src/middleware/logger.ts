import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const apiKey = req.header('X-API-Key') || req.query.api_key as string || 'none';
  const query = req.query.q || req.body?.sql || req.path;

  console.log(`[${timestamp}] - [${ip}] - [${apiKey}] - [${query}]`);

  next();
}
