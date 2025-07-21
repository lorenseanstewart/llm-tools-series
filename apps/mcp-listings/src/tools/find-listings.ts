import { Listing, ListingFilters } from "@llm-tools/shared-types";
import { mockListings } from "../data/mock-listings";

export async function findListings(filters: ListingFilters): Promise<Listing[]> {
  let listings = mockListings;

  console.log("--- Calling 'findListings' tool ---");
  console.log("Filters:", filters);

  const { city, state, minBedrooms, maxPrice, status } = filters;

  if (city) {
    listings = listings.filter(
      (listing) => listing.address.city.toLowerCase() === city.toLowerCase(),
    );
  }

  if (state) {
    listings = listings.filter(
      (listing) =>
        listing.address.state.toLowerCase() === state.toLowerCase(),
    );
  }

  if (minBedrooms) {
    listings = listings.filter((listing) => listing.bedrooms >= minBedrooms);
  }

  if (maxPrice) {
    listings = listings.filter((listing) => listing.price <= maxPrice);
  }

  if (status) {
    listings = listings.filter((listing) => listing.status === status);
  }

  return listings;
}