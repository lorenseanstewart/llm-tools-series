"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYTICS_TOOLS = void 0;
exports.ANALYTICS_TOOLS = [
    {
        name: 'getListingMetrics',
        description: 'Get analytics data for specific listings (views, saves, inquiries). IMPORTANT: Use listing IDs returned from findListings tool (e.g., L001, L002, etc.), not generated IDs.',
        inputSchema: {
            type: 'object',
            properties: {
                listingIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of listing IDs from findListings results (format: L001, L002, etc.)'
                }
            },
            required: ['listingIds']
        }
    },
    {
        name: 'getMarketAnalysis',
        description: 'Get market trends and comparison data for a specific area',
        inputSchema: {
            type: 'object',
            properties: {
                area: {
                    type: 'string',
                    description: 'Geographic area (e.g., "Portland, OR", "Seattle, WA")'
                }
            },
            required: ['area']
        }
    },
    {
        name: 'generatePerformanceReport',
        description: 'Generate performance metrics report for listings. IMPORTANT: Use listing IDs returned from findListings tool (e.g., L001, L002, etc.), not generated IDs.',
        inputSchema: {
            type: 'object',
            properties: {
                listingIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of listing IDs from findListings results (format: L001, L002, etc.)'
                }
            },
            required: ['listingIds']
        }
    }
];
