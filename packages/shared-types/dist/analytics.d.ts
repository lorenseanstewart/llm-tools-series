/**
 * Metrics data for a single listing
 */
export interface ListingMetrics {
    listingId: string;
    pageViews: number;
    saves: number;
    inquiries: number;
    timeOnMarket: number;
    clickThroughRate: number;
    conversionRate: number;
    lastUpdated: string;
}
/**
 * Market analysis data for a geographic area
 */
export interface MarketAnalysis {
    area: string;
    averagePrice: number;
    priceChange: number;
    averageTimeOnMarket: number;
    totalListings: number;
    soldListings: number;
    pendingListings: number;
    competitionLevel: "Low" | "Medium" | "High";
    trends: {
        priceDirection: "Up" | "Down" | "Stable";
        marketActivity: "Hot" | "Warm" | "Cold";
    };
}
/**
 * Enhanced listing data with both property and analytics information
 */
export interface ListingWithMetrics {
    listingId: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    price: number;
    bedrooms: number;
    bathrooms: number;
    status: string;
    metrics: ListingMetrics;
}
/**
 * Performance report for listings
 */
export interface PerformanceReport {
    reportId: string;
    listingIds: string[];
    generatedAt: string;
    summary: {
        totalViews: number;
        totalInquiries: number;
        averageTimeOnMarket: number;
        topPerformer: string;
        recommendations: string[];
    };
    listings: ListingWithMetrics[];
    metrics: ListingMetrics[];
}
