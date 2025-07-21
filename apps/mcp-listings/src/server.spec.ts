import { FastifyInstance } from 'fastify';
import { build } from './app';
import { LISTINGS_TOOLS } from './config/tools-config';

// Mock the specific tool files that are imported by the routes
jest.mock('./tools/find-listings', () => ({
  findListings: jest.fn()
}));

jest.mock('./tools/send-listing-report', () => ({
  sendListingReport: jest.fn()
}));

import { findListings } from './tools/find-listings';
import { sendListingReport } from './tools/send-listing-report';

describe('MCP Listings Server', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = build({ logger: false });
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
      expect(JSON.parse(response.body)).toEqual(LISTINGS_TOOLS);
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

      (findListings as jest.Mock).mockResolvedValueOnce(mockListings);

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
      expect(findListings).toHaveBeenCalledWith({ city: 'Portland', maxPrice: 600000 });
    });

    it('should execute sendListingReport tool successfully', async () => {
      const mockResult = { success: true, message: 'Report with 2 listings sent to test@example.com' };
      (sendListingReport as jest.Mock).mockResolvedValueOnce(mockResult);

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
      expect(sendListingReport).toHaveBeenCalledWith(['123', '456'], 'test@example.com');
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
      (findListings as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

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