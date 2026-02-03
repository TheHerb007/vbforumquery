import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const apiKey = req.header('X-API-Key') || req.query.api_key as string || 'none';
  const query = req.query.q || req.body?.sql || req.path;

  console.log(`[${timestamp}] - [${ip}] - [${apiKey}] - [${query}]`);

  next();
}
