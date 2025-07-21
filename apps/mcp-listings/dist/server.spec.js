"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const tools_config_1 = require("./config/tools-config");
const jwt = __importStar(require("jsonwebtoken"));
// Mock the specific tool files that are imported by the routes
jest.mock('./tools/find-listings', () => ({
    findListings: jest.fn()
}));
jest.mock('./tools/send-listing-report', () => ({
    sendListingReport: jest.fn()
}));
const find_listings_1 = require("./tools/find-listings");
const send_listing_report_1 = require("./tools/send-listing-report");
describe('MCP Listings Server', () => {
    let app;
    let authToken;
    beforeAll(async () => {
        // Generate test JWT token
        authToken = jwt.sign({
            serviceId: 'test-service',
            userId: 'test-user',
            iat: Date.now()
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
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
                url: '/tools',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
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
            find_listings_1.findListings.mockResolvedValueOnce(mockListings);
            const response = await app.inject({
                method: 'POST',
                url: '/tools/call',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                payload: {
                    name: 'findListings',
                    arguments: { city: 'Portland', maxPrice: 600000 }
                }
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual({ result: mockListings });
            expect(find_listings_1.findListings).toHaveBeenCalledWith({ city: 'Portland', maxPrice: 600000 });
        });
        it('should execute sendListingReport tool successfully', async () => {
            const mockResult = { success: true, message: 'Report with 2 listings sent to test@example.com' };
            send_listing_report_1.sendListingReport.mockResolvedValueOnce(mockResult);
            const response = await app.inject({
                method: 'POST',
                url: '/tools/call',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
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
            expect(send_listing_report_1.sendListingReport).toHaveBeenCalledWith(['123', '456'], 'test@example.com');
        });
        it('should return 400 for unknown tool', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/tools/call',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                payload: {
                    name: 'unknownTool',
                    arguments: {}
                }
            });
            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toEqual({ error: 'Unknown tool: unknownTool' });
        });
        it('should return 500 when tool execution fails', async () => {
            find_listings_1.findListings.mockRejectedValueOnce(new Error('Database error'));
            const response = await app.inject({
                method: 'POST',
                url: '/tools/call',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
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
