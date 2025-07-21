"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYTICS_TOOLS = void 0;
exports.ANALYTICS_TOOLS = [
    {
        name: 'getListingMetrics',
        description: 'Get analytics data for specific listings (views, saves, inquiries)',
        inputSchema: {
            type: 'object',
            properties: {
                listingIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of listing IDs to get metrics for'
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
        description: 'Generate performance metrics report for listings',
        inputSchema: {
            type: 'object',
            properties: {
                listingIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of listing IDs to include in performance report'
                }
            },
            required: ['listingIds']
        }
    }
];
