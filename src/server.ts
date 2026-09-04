import { createServer, type Server } from 'node:http';
import type { Registry } from '@prometheus-io/client';

export function createHttpServer(registry: Registry): Server {
  return createServer(async (req, res) => {
    if (req.method !== 'GET') {
      res.writeHead(405).end();
    } else if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': registry.contentType }).end(await registry.metrics());
    } else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
    } else {
      res.writeHead(404).end();
    }
  });
}
