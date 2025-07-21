"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePerformanceReport = generatePerformanceReport;
const mock_analytics_1 = require("../data/mock-analytics");
const axios_1 = __importDefault(require("axios"));
async function fetchListingData(listingIds) {
    try {
        const response = await axios_1.default.post('http://localhost:3001/tools/call', {
            name: 'findListings',
            arguments: {}
        });
        const allListings = response.data.result;
        return allListings.filter((listing) => listingIds.includes(listing.listingId));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('Failed to fetch listing data from listings server:', errorMessage);
        return [];
    }
}
async function generatePerformanceReport(listingIds) {
    console.log('--- Calling generatePerformanceReport tool ---');
    console.log('Listing IDs:', listingIds);
    // Get metrics for the requested listings
    const metrics = mock_analytics_1.mockListingMetrics.filter(metric => listingIds.includes(metric.listingId));
    // Fetch listing data from listings server
    const listingData = await fetchListingData(listingIds);
    // Calculate summary statistics
    const totalViews = metrics.reduce((sum, m) => sum + m.pageViews, 0);
    const totalInquiries = metrics.reduce((sum, m) => sum + m.inquiries, 0);
    const averageTimeOnMarket = metrics.length > 0
        ? Math.round(metrics.reduce((sum, m) => sum + m.timeOnMarket, 0) / metrics.length)
        : 0;
    // Find top performer (highest conversion rate)
    const topPerformer = metrics.reduce((best, current) => current.conversionRate > best.conversionRate ? current : best, metrics[0] || { listingId: 'N/A', conversionRate: 0 });
    // Generate recommendations based on performance
    const recommendations = [];
    if (averageTimeOnMarket > 30) {
        recommendations.push('Consider adjusting pricing strategy for faster sales');
    }
    const avgConversionRate = metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length
        : 0;
    if (avgConversionRate < 0.08) {
        recommendations.push('Improve listing photos and descriptions to increase conversion');
    }
    if (totalViews / metrics.length < 1000) {
        recommendations.push('Increase marketing efforts to boost visibility');
    }
    // Combine listing data with metrics
    const listings = listingData.map((listing) => {
        const listingMetrics = metrics.find(m => m.listingId === listing.listingId);
        return {
            listingId: listing.listingId,
            address: listing.address,
            price: listing.price,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            status: listing.status,
            metrics: listingMetrics || {
                listingId: listing.listingId,
                pageViews: 0,
                saves: 0,
                inquiries: 0,
                timeOnMarket: 0,
                clickThroughRate: 0,
                conversionRate: 0,
                lastUpdated: new Date().toISOString()
            }
        };
    });
    const report = {
        reportId: `RPT-${Date.now()}`,
        listingIds,
        generatedAt: new Date().toISOString(),
        summary: {
            totalViews,
            totalInquiries,
            averageTimeOnMarket,
            topPerformer: topPerformer.listingId,
            recommendations
        },
        listings,
        metrics
    };
    return report;
}
