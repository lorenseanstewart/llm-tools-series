"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendListingReport = exports.findListings = exports.toolFunctions = exports.tools = void 0;
const find_listings_1 = require("./find-listings");
Object.defineProperty(exports, "findListings", { enumerable: true, get: function () { return find_listings_1.findListings; } });
const send_listing_report_1 = require("./send-listing-report");
Object.defineProperty(exports, "sendListingReport", { enumerable: true, get: function () { return send_listing_report_1.sendListingReport; } });
// Tool registry for MCP server
exports.tools = [
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
exports.toolFunctions = {
    findListings: find_listings_1.findListings,
    sendListingReport: send_listing_report_1.sendListingReport
};
