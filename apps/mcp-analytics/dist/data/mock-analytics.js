"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockMarketAnalysis = exports.mockListingMetrics = void 0;
exports.mockListingMetrics = [
    {
        listingId: 'L001',
        pageViews: 1250,
        saves: 45,
        inquiries: 12,
        timeOnMarket: 15,
        clickThroughRate: 0.034,
        conversionRate: 0.096,
        lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
        listingId: 'L002',
        pageViews: 890,
        saves: 32,
        inquiries: 8,
        timeOnMarket: 23,
        clickThroughRate: 0.028,
        conversionRate: 0.089,
        lastUpdated: '2024-01-15T09:15:00Z'
    },
    {
        listingId: 'L003',
        pageViews: 2100,
        saves: 78,
        inquiries: 25,
        timeOnMarket: 8,
        clickThroughRate: 0.041,
        conversionRate: 0.119,
        lastUpdated: '2024-01-15T11:45:00Z'
    },
    {
        listingId: 'L004',
        pageViews: 650,
        saves: 18,
        inquiries: 4,
        timeOnMarket: 45,
        clickThroughRate: 0.022,
        conversionRate: 0.061,
        lastUpdated: '2024-01-15T08:20:00Z'
    },
    {
        listingId: 'L005',
        pageViews: 1580,
        saves: 62,
        inquiries: 18,
        timeOnMarket: 12,
        clickThroughRate: 0.039,
        conversionRate: 0.114,
        lastUpdated: '2024-01-15T14:30:00Z'
    },
    {
        listingId: 'L006',
        pageViews: 920,
        saves: 28,
        inquiries: 7,
        timeOnMarket: 31,
        clickThroughRate: 0.025,
        conversionRate: 0.076,
        lastUpdated: '2024-01-15T12:10:00Z'
    },
    {
        listingId: 'L007',
        pageViews: 1750,
        saves: 55,
        inquiries: 16,
        timeOnMarket: 19,
        clickThroughRate: 0.037,
        conversionRate: 0.091,
        lastUpdated: '2024-01-15T13:45:00Z'
    },
    {
        listingId: 'L008',
        pageViews: 1100,
        saves: 41,
        inquiries: 11,
        timeOnMarket: 27,
        clickThroughRate: 0.032,
        conversionRate: 0.100,
        lastUpdated: '2024-01-15T09:30:00Z'
    },
    {
        listingId: 'L009',
        pageViews: 2350,
        saves: 89,
        inquiries: 28,
        timeOnMarket: 6,
        clickThroughRate: 0.043,
        conversionRate: 0.126,
        lastUpdated: '2024-01-15T15:20:00Z'
    },
    {
        listingId: 'L010',
        pageViews: 780,
        saves: 24,
        inquiries: 5,
        timeOnMarket: 38,
        clickThroughRate: 0.021,
        conversionRate: 0.064,
        lastUpdated: '2024-01-15T07:45:00Z'
    }
];
exports.mockMarketAnalysis = {
    'Portland, OR': {
        area: 'Portland, OR',
        averagePrice: 785000,
        priceChange: 8.5,
        averageTimeOnMarket: 22,
        totalListings: 156,
        soldListings: 89,
        pendingListings: 34,
        competitionLevel: 'High',
        trends: {
            priceDirection: 'Up',
            marketActivity: 'Hot'
        }
    },
    'Seattle, WA': {
        area: 'Seattle, WA',
        averagePrice: 920000,
        priceChange: 12.3,
        averageTimeOnMarket: 18,
        totalListings: 234,
        soldListings: 145,
        pendingListings: 52,
        competitionLevel: 'High',
        trends: {
            priceDirection: 'Up',
            marketActivity: 'Hot'
        }
    },
    'Bellevue, WA': {
        area: 'Bellevue, WA',
        averagePrice: 1150000,
        priceChange: 6.7,
        averageTimeOnMarket: 25,
        totalListings: 87,
        soldListings: 48,
        pendingListings: 19,
        competitionLevel: 'Medium',
        trends: {
            priceDirection: 'Up',
            marketActivity: 'Warm'
        }
    },
    'Kirkland, WA': {
        area: 'Kirkland, WA',
        averagePrice: 985000,
        priceChange: 4.2,
        averageTimeOnMarket: 28,
        totalListings: 65,
        soldListings: 34,
        pendingListings: 15,
        competitionLevel: 'Medium',
        trends: {
            priceDirection: 'Stable',
            marketActivity: 'Warm'
        }
    },
    'Redmond, WA': {
        area: 'Redmond, WA',
        averagePrice: 1075000,
        priceChange: 9.1,
        averageTimeOnMarket: 21,
        totalListings: 92,
        soldListings: 56,
        pendingListings: 22,
        competitionLevel: 'High',
        trends: {
            priceDirection: 'Up',
            marketActivity: 'Hot'
        }
    }
};
