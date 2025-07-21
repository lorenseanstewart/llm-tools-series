"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketAnalysis = getMarketAnalysis;
const mock_analytics_1 = require("../data/mock-analytics");
async function getMarketAnalysis(area) {
    console.log('--- Calling getMarketAnalysis tool ---');
    console.log('Area:', area);
    // Find market analysis for the requested area
    const analysis = mock_analytics_1.mockMarketAnalysis[area];
    if (!analysis) {
        console.log(`No market analysis available for area: ${area}`);
        return null;
    }
    return analysis;
}
