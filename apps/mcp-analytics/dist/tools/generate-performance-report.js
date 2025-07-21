"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePerformanceReport = generatePerformanceReport;
const mock_analytics_1 = require("../data/mock-analytics");
async function generatePerformanceReport(listingIds) {
    console.log('--- Calling generatePerformanceReport tool ---');
    console.log('Listing IDs:', listingIds);
    // Get metrics for the requested listings
    const metrics = mock_analytics_1.mockListingMetrics.filter(metric => listingIds.includes(metric.listingId));
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
        metrics
    };
    return report;
}
