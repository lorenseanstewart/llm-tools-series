import { ListingMetrics } from '@llm-tools/shared-types';
import { mockListingMetrics } from '../data/mock-analytics';

export async function getListingMetrics(listingIds: string[]): Promise<ListingMetrics[]> {
  console.log('--- Calling getListingMetrics tool ---');
  console.log('Listing IDs:', listingIds);

  // Filter mock data to return only requested listings
  const metrics = mockListingMetrics.filter(metric => 
    listingIds.includes(metric.listingId)
  );

  return metrics;
}