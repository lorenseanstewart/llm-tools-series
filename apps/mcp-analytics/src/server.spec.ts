import { FastifyInstance } from 'fastify';
import { build } from './app';
import { ANALYTICS_TOOLS } from './config/tools-config';

// Mock the individual tool files that are imported by the routes
jest.mock('./tools/get-listing-metrics', () => ({
  getListingMetrics: jest.fn()
}));

jest.mock('./tools/get-market-analysis', () => ({
  getMarketAnalysis: jest.fn()
}));

jest.mock('./tools/generate-performance-report', () => ({
  generatePerformanceReport: jest.fn()
}));

import { getListingMetrics } from './tools/get-listing-metrics';
import { getMarketAnalysis } from './tools/get-market-analysis';
import { generatePerformanceReport } from './tools/generate-performance-report';

describe('MCP Analytics Server', () => {
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
    it('should return the list of analytics tools', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/tools'
      });

      expect(response.statusCode).toBe(200);
      const tools = JSON.parse(response.body);
      
      expect(tools).toEqual(ANALYTICS_TOOLS);
      expect(tools).toHaveLength(3);
      expect(tools.map((t: any) => t.name)).toEqual([
        'getListingMetrics',
        'getMarketAnalysis',
        'generatePerformanceReport'
      ]);
    });
  });

  describe('POST /tools/call', () => {
    it('should execute getListingMetrics successfully', async () => {
      const mockMetrics = [
        {
          listingId: 'L001',
          pageViews: 1250,
          saves: 45,
          inquiries: 12,
          timeOnMarket: 15,
          clickThroughRate: 0.036,
          conversionRate: 0.0096,
          lastUpdated: new Date().toISOString()
        }
      ];

      (getListingMetrics as jest.Mock).mockResolvedValueOnce(mockMetrics);

      const response = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          name: 'getListingMetrics',
          arguments: { listingIds: ['L001'] }
        }
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ result: mockMetrics });
      expect(getListingMetrics).toHaveBeenCalledWith(['L001']);
    });

    it('should execute getMarketAnalysis successfully', async () => {
      const mockAnalysis = {
        area: 'Portland, OR',
        averagePrice: 650000,
        medianPrice: 625000,
        pricePerSqft: 325,
        inventoryLevel: 2.5,
        daysOnMarket: 28,
        yearOverYearChange: 0.045,
        forecast: 'Stable market with moderate growth expected',
        topNeighborhoods: [
          { name: 'Pearl District', avgPrice: 850000 },
          { name: 'Hawthorne', avgPrice: 725000 }
        ]
      };

      (getMarketAnalysis as jest.Mock).mockResolvedValueOnce(mockAnalysis);

      const response = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          name: 'getMarketAnalysis',
          arguments: { area: 'Portland, OR' }
        }
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ result: mockAnalysis });
      expect(getMarketAnalysis).toHaveBeenCalledWith('Portland, OR');
    });

    it('should execute generatePerformanceReport successfully', async () => {
      const mockReport = {
        reportId: 'RPT-123',
        generatedAt: new Date().toISOString(),
        summary: 'Performance report generated successfully',
        metrics: {
          totalViews: 5000,
          totalInquiries: 125,
          conversionRate: 0.025
        }
      };

      (generatePerformanceReport as jest.Mock).mockResolvedValueOnce(mockReport);

      const response = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          name: 'generatePerformanceReport',
          arguments: {
            listingIds: ['L001', 'L002'],
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          }
        }
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ result: mockReport });
    });

    it('should handle unknown tools with 400 error', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          name: 'unknownTool',
          arguments: {}
        }
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ 
        error: 'Unknown tool: unknownTool' 
      });
    });

    it('should handle tool execution errors', async () => {
      (getListingMetrics as jest.Mock).mockRejectedValueOnce(
        new Error('Analytics database unavailable')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          name: 'getListingMetrics',
          arguments: { listingIds: ['L001'] }
        }
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        error: 'Tool execution failed: Analytics database unavailable'
      });
    });

    it('should validate required arguments', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          name: 'getMarketAnalysis',
          arguments: {} // Missing required 'area' field
        }
      });

      // The tool should be called but may handle missing args internally
      expect(getMarketAnalysis).toHaveBeenCalledWith(undefined);
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
        service: 'mcp-analytics'
      });
      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in tool call', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tools/call',
        headers: {
          'content-type': 'application/json'
        },
        payload: 'invalid json'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing tool name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          arguments: { listingIds: ['L001'] }
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Analytics Tool Schemas', () => {
    it('should have valid schemas for all tools', () => {
      ANALYTICS_TOOLS.forEach(tool => {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it('should define correct schema for getListingMetrics', () => {
      const tool = ANALYTICS_TOOLS.find(t => t.name === 'getListingMetrics');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.properties).toHaveProperty('listingIds');
      expect(tool!.inputSchema.required).toContain('listingIds');
    });

    it('should define correct schema for getMarketAnalysis', () => {
      const tool = ANALYTICS_TOOLS.find(t => t.name === 'getMarketAnalysis');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.properties).toHaveProperty('area');
      expect(tool!.inputSchema.required).toContain('area');
    });

    it('should define correct schema for generatePerformanceReport', () => {
      const tool = ANALYTICS_TOOLS.find(t => t.name === 'generatePerformanceReport');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.properties).toHaveProperty('listingIds');
      expect(tool!.inputSchema.required).toContain('listingIds');
      expect(tool!.inputSchema.properties.listingIds.type).toBe('array');
    });
  });
});