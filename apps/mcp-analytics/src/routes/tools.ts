import { FastifyInstance } from 'fastify';
import { MCPTool, MCPToolCallRequest, MCPToolCallResponse } from '@llm-tools/shared-types';
import { getListingMetrics, getMarketAnalysis, generatePerformanceReport } from '../tools/analytics';
import { ANALYTICS_TOOLS } from '../config/tools-config';

export async function toolsRoutes(fastify: FastifyInstance) {
  // Tool discovery endpoint
  fastify.get<{ Reply: MCPTool[] }>('/tools', async (_, reply) => {
    reply.send(ANALYTICS_TOOLS);
  });

  // Tool execution endpoint
  fastify.post<{ 
    Body: MCPToolCallRequest; 
    Reply: MCPToolCallResponse 
  }>('/tools/call', async (request, reply) => {
    const { name, arguments: args } = request.body;

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
      reply.code(500).send({
        error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  // Health check endpoint
  fastify.get('/health', async (_, reply) => {
    reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mcp-analytics'
    });
  });
}