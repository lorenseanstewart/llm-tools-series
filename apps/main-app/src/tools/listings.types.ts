type ListingStatus = "Active" | "Pending" | "Sold";

/**
 * Defines the search criteria for finding property listings.
 * The LLM will learn to populate this structure from natural language.
 */
export interface ListingFilters {
  status?: ListingStatus;
  city?: string;
  state?: string;
  minBedrooms?: number;
  maxPrice?: number;
}

/**
 * Represents a single property listing.
 * This is the data structure our tool will return.
 */
export interface Listing {
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
  status: ListingStatus;
}
