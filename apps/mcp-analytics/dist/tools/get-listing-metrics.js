"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListingMetrics = getListingMetrics;
const mock_analytics_1 = require("../data/mock-analytics");
async function getListingMetrics(listingIds) {
    console.log('--- Calling getListingMetrics tool ---');
    console.log('Listing IDs:', listingIds);
    // Filter mock data to return only requested listings
    const metrics = mock_analytics_1.mockListingMetrics.filter(metric => listingIds.includes(metric.listingId));
    return metrics;
}
