type ListingStatus = "Active" | "Pending" | "Sold";
export interface ListingFilters {
    status?: ListingStatus;
    city?: string;
    state?: string;
    minBedrooms?: number;
    maxPrice?: number;
}
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
export {};
