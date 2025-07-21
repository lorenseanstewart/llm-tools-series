"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolsRoutes = toolsRoutes;
const find_listings_1 = require("../tools/find-listings");
const send_listing_report_1 = require("../tools/send-listing-report");
const tools_config_1 = require("../config/tools-config");
function toolsRoutes(fastify) {
    // Tool discovery endpoint
    fastify.get('/tools', async (_, reply) => {
        reply.send(tools_config_1.LISTINGS_TOOLS);
    });
    // Tool execution endpoint
    fastify.post('/tools/call', async (request, reply) => {
        const { name, arguments: args } = request.body;
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
            service: 'mcp-listings'
        });
    });
}
