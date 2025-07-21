import { FastifyInstance } from 'fastify';
import { MCPTool, MCPToolCallRequest, MCPToolCallResponse } from '@llm-tools/shared-types';
import { getListingMetrics } from '../tools/get-listing-metrics';
import { getMarketAnalysis } from '../tools/get-market-analysis';
import { generatePerformanceReport } from '../tools/generate-performance-report';
import { ANALYTICS_TOOLS } from '../config/tools-config';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

export async function toolsRoutes(fastify: FastifyInstance) {
  // Health check endpoint - no auth required
  fastify.get('/health', async (_, reply) => {
    reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mcp-analytics'
    });
  });

  // Register authenticated routes
  fastify.register(async function (fastify) {
    // Apply auth middleware to all routes in this context
    fastify.addHook('preHandler', authenticateToken);

    // Tool discovery endpoint
    fastify.get<{ Reply: MCPTool[] }>('/tools', async (_, reply) => {
      reply.send(ANALYTICS_TOOLS);
    });

    // Tool execution endpoint
    fastify.post<{ 
      Body: MCPToolCallRequest; 
      Reply: MCPToolCallResponse 
    }>('/tools/call', async (request: AuthenticatedRequest, reply) => {
      const { name, arguments: args } = request.body as MCPToolCallRequest;

      // Log authenticated user/service
      fastify.log.info(`Tool ${name} executed by user: ${request.userId || request.serviceId}`);

      try {
        let result: any;

        switch (name) {
          case 'getListingMetrics':
            result = await getListingMetrics(args.listingIds);
            break;
          case 'getMarketAnalysis':
            result = await getMarketAnalysis(args.area);
            break;
          case 'generatePerformanceReport':
            result = await generatePerformanceReport(args.listingIds);
            break;
          default:
            reply.code(400).send({
              error: `Unknown tool: ${name}`
            });
            return;
        }

        reply.send({ result });
      } catch (error) {
        fastify.log.error(`Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
        reply.code(500).send({
          error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    });
  });
}