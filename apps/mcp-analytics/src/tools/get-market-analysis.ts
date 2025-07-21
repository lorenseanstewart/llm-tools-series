import { MarketAnalysis } from '@llm-tools/shared-types';
import { mockMarketAnalysis } from '../data/mock-analytics';

export async function getMarketAnalysis(area: string): Promise<MarketAnalysis | null> {
  console.log('--- Calling getMarketAnalysis tool ---');
  console.log('Area:', area);

  // Find market analysis for the requested area
  const analysis = mockMarketAnalysis[area];
  
  if (!analysis) {
    console.log(`No market analysis available for area: ${area}`);
    return null;
  }

  return analysis;
}