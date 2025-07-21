"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolsRoutes = toolsRoutes;
const find_listings_1 = require("../tools/find-listings");
const send_listing_report_1 = require("../tools/send-listing-report");
const tools_config_1 = require("../config/tools-config");
const auth_1 = require("../middleware/auth");
async function toolsRoutes(fastify) {
    // Health check endpoint - no auth required
    fastify.get('/health', async (_, reply) => {
        reply.send({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'mcp-listings'
        });
    });
    // Register authenticated routes
    fastify.register(async function (fastify) {
        // Apply auth middleware to all routes in this context
        fastify.addHook('preHandler', auth_1.authenticateToken);
        // Tool discovery endpoint
        fastify.get('/tools', async (_, reply) => {
            reply.send(tools_config_1.LISTINGS_TOOLS);
        });
        // Tool execution endpoint
        fastify.post('/tools/call', async (request, reply) => {
            const { name, arguments: args } = request.body;
            // Log authenticated user/service
            fastify.log.info(`Tool ${name} executed by user: ${request.userId || request.serviceId}`);
            try {
                let result;
                switch (name) {
                    case 'findListings':
                        result = await (0, find_listings_1.findListings)(args);
                        break;
                    case 'sendListingReport':
                        result = await (0, send_listing_report_1.sendListingReport)(args.listingIds, args.recipientEmail);
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
                fastify.log.error(`Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
                reply.code(500).send({
                    error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
                });
            }
        });
    });
}
