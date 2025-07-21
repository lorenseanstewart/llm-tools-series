"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const tools_config_1 = require("./config/tools-config");
const listings_1 = require("./tools/listings");
// Mock the tool functions
jest.mock('./tools/listings', () => ({
    findListings: jest.fn(),
    sendListingReport: jest.fn()
}));
describe('MCP Listings Server', () => {
    let app;
    beforeAll(async () => {
        app = (0, app_1.build)({ logger: false });
        await app.ready();
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /tools', () => {
        it('should return the list of available tools', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/tools'
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual(tools_config_1.LISTINGS_TOOLS);
        });
    });
    describe('POST /tools/call', () => {
        it('should execute findListings tool successfully', async () => {
            const mockListings = [
                {
                    listingId: '123',
                    address: {
                        street: '123 Main St',
                        city: 'Portland',
                        state: 'OR',
                        zip: '97201'
                    },
                    price: 500000,
                    bedrooms: 3,
                    bathrooms: 2,
                    status: 'Active'
                }
            ];
            listings_1.findListings.mockResolvedValueOnce(mockListings);
            const response = await app.inject({
                method: 'POST',
                url: '/tools/call',
                payload: {
                    name: 'findListings',
                    arguments: { city: 'Portland', maxPrice: 600000 }
                }
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual({ result: mockListings });
            expect(listings_1.findListings).toHaveBeenCalledWith({ city: 'Portland', maxPrice: 600000 });
        });
        it('should execute sendListingReport tool successfully', async () => {
            const mockResult = { success: true, emailId: 'email-123' };
            listings_1.sendListingReport.mockResolvedValueOnce(mockResult);
            const response = await app.inject({
                method: 'POST',
                url: '/tools/call',
                payload: {
                    name: 'sendListingReport',
                    arguments: {
                        listingIds: ['123', '456'],
                        recipientEmail: 'test@example.com'
                    }
                }
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual({ result: mockResult });
            expect(listings_1.sendListingReport).toHaveBeenCalledWith(['123', '456'], 'test@example.com');
        });
        it('should return 400 for unknown tool', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/tools/call',
                payload: {
                    name: 'unknownTool',
                    arguments: {}
                }
            });
            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toEqual({ error: 'Unknown tool: unknownTool' });
        });
        it('should return 500 when tool execution fails', async () => {
            listings_1.findListings.mockRejectedValueOnce(new Error('Database error'));
            const response = await app.inject({
                method: 'POST',
                url: '/tools/call',
                payload: {
                    name: 'findListings',
                    arguments: { city: 'Portland' }
                }
            });
            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body)).toEqual({
                error: 'Tool execution failed: Database error'
            });
        });
    });
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/health'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toMatchObject({
                status: 'ok',
                service: 'mcp-listings'
            });
            expect(body.timestamp).toBeDefined();
        });
    });
});
