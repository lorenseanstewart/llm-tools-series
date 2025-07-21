import { MCPTool } from '@llm-tools/shared-types';

export const LISTINGS_TOOLS: MCPTool[] = [
  {
    name: 'findListings',
    description: 'Find property listings based on search criteria',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' },
        state: { type: 'string', description: 'State name' },
        minBedrooms: { type: 'number', description: 'Minimum number of bedrooms' },
        maxPrice: { type: 'number', description: 'Maximum price' },
        status: { 
          type: 'string', 
          enum: ['Active', 'Pending', 'Sold'],
          description: 'Listing status' 
        }
      }
    }
  },
  {
    name: 'sendListingReport',
    description: 'Send email report of property listings',
    inputSchema: {
      type: 'object',
      properties: {
        listingIds: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Array of listing IDs to include in report'
        },
        recipientEmail: { 
          type: 'string', 
          description: 'Email address to send report to' 
        }
      },
      required: ['listingIds', 'recipientEmail']
    }
  }
];