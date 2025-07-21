// Analytics types for real estate listings

/**
 * Metrics data for a single listing
 */
export interface ListingMetrics {
  listingId: string;
  pageViews: number;
  saves: number;
  inquiries: number;
  timeOnMarket: number; // days
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
  priceChange: number; // percentage
  averageTimeOnMarket: number; // days
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
  metrics: ListingMetrics[];
}