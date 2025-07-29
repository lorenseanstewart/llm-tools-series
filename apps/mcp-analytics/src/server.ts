import 'dotenv/config';
import { build } from './app';

const server = build({
  logger: true
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3002;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`MCP Analytics Server running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();