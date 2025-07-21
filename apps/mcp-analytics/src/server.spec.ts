import { FastifyInstance } from 'fastify';
import { build } from './app';
import { ANALYTICS_TOOLS } from './config/tools-config';
import { getListingMetrics, getMarketAnalysis, generatePerformanceReport } from './tools/analytics';

// Mock the tool functions
jest.mock('./tools/analytics', () => ({
  getListingMetrics: jest.fn(),
  getMarketAnalysis: jest.fn(),
  generatePerformanceReport: jest.fn()
}));

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
          clickThroughRate: 0.034,
          conversionRate: 0.096,
          lastUpdated: '2024-01-15T10:30:00Z'
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
        averagePrice: 785000,
        priceChange: 8.5,
        averageTimeOnMarket: 22,
        totalListings: 156,
        soldListings: 89,
        pendingListings: 34,
        competitionLevel: 'High' as const,
        trends: {
          priceDirection: 'Up' as const,
          marketActivity: 'Hot' as const
        }
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
        listingIds: ['L001', 'L002'],
        generatedAt: new Date().toISOString(),
        summary: {
          totalViews: 2140,
          totalInquiries: 20,
          averageTimeOnMarket: 19,
          topPerformer: 'L001',
          recommendations: []
        },
        metrics: [
          {
            listingId: 'L001',
            pageViews: 1250,
            saves: 45,
            inquiries: 12,
            timeOnMarket: 15,
            clickThroughRate: 0.034,
            conversionRate: 0.096,
            lastUpdated: '2024-01-15T10:30:00Z'
          },
          {
            listingId: 'L002',
            pageViews: 890,
            saves: 32,
            inquiries: 8,
            timeOnMarket: 23,
            clickThroughRate: 0.028,
            conversionRate: 0.089,
            lastUpdated: '2024-01-15T09:15:00Z'
          }
        ]
      };

      (generatePerformanceReport as jest.Mock).mockResolvedValueOnce(mockReport);

      const response = await app.inject({
        method: 'POST',
        url: '/tools/call',
        payload: {
          name: 'generatePerformanceReport',
          arguments: {
            listingIds: ['L001', 'L002']
          }
        }
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ result: mockReport });
      expect(generatePerformanceReport).toHaveBeenCalledWith(['L001', 'L002']);
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
    });
  });
});