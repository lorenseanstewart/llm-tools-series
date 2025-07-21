import { MCPTool } from "@llm-tools/shared-types";
import { findListings } from "./find-listings";
import { sendListingReport } from "./send-listing-report";

// Tool registry for MCP server
export const tools: MCPTool[] = [
  {
    name: "findListings",
    description: "Find real estate listings based on filters like city, state, bedrooms, price, and status",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "Filter by city name"
        },
        state: {
          type: "string", 
          description: "Filter by state abbreviation (e.g., 'OR', 'WA')"
        },
        minBedrooms: {
          type: "number",
          description: "Minimum number of bedrooms"
        },
        maxPrice: {
          type: "number",
          description: "Maximum price in dollars"
        },
        status: {
          type: "string",
          enum: ["Active", "Pending", "Sold"],
          description: "Listing status"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "sendListingReport",
    description: "Send an email report with specified listings to a recipient",
    inputSchema: {
      type: "object",
      properties: {
        listingIds: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of listing IDs to include in the report"
        },
        recipientEmail: {
          type: "string",
          format: "email",
          description: "Email address to send the report to"
        }
      },
      required: ["listingIds", "recipientEmail"],
      additionalProperties: false
    }
  }
];

// Tool execution functions
export const toolFunctions = {
  findListings,
  sendListingReport
};

export { findListings, sendListingReport };