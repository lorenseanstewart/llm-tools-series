"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolsRoutes = toolsRoutes;
const get_listing_metrics_1 = require("../tools/get-listing-metrics");
const get_market_analysis_1 = require("../tools/get-market-analysis");
const generate_performance_report_1 = require("../tools/generate-performance-report");
const tools_config_1 = require("../config/tools-config");
function toolsRoutes(fastify) {
    // Tool discovery endpoint
    fastify.get('/tools', async (_, reply) => {
        reply.send(tools_config_1.ANALYTICS_TOOLS);
    });
    // Tool execution endpoint
    fastify.post('/tools/call', async (request, reply) => {
        const { name, arguments: args } = request.body;
        try {
            let result;
            switch (name) {
                case 'getListingMetrics':
                    result = await (0, get_listing_metrics_1.getListingMetrics)(args.listingIds);
                    break;
                case 'getMarketAnalysis':
                    result = await (0, get_market_analysis_1.getMarketAnalysis)(args.area);
                    break;
                case 'generatePerformanceReport':
                    result = await (0, generate_performance_report_1.generatePerformanceReport)(args.listingIds);
                    break;
                default:
                    reply.code(400).send({
                        error: `Unknown tool: ${name}`
                    });
                    return;
            }
            reply.send({ result });
        }
        catch (error) {
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
