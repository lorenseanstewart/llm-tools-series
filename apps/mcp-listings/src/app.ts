import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { toolsRoutes } from './routes/tools';

export function build(opts = {}) {
  const app: FastifyInstance = Fastify(opts);

  // Register plugins
  app.register(cors, { origin: true });

  // Register routes
  app.register(toolsRoutes);

  return app;
}