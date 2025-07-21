import { ListingFilters, Listing } from './listings.types';

describe('Listings Types', () => {
  describe('ListingFilters', () => {
    it('should allow all properties to be optional', () => {
      const filters: ListingFilters = {};
      expect(filters).toBeDefined();
    });

    it('should accept valid status values', () => {
      const activeFilter: ListingFilters = { status: 'Active' };
      const pendingFilter: ListingFilters = { status: 'Pending' };
      const soldFilter: ListingFilters = { status: 'Sold' };

      expect(activeFilter.status).toBe('Active');
      expect(pendingFilter.status).toBe('Pending');
      expect(soldFilter.status).toBe('Sold');
    });

    it('should accept string values for city and state', () => {
      const filters: ListingFilters = {
        city: 'Portland',
        state: 'OR'
      };

      expect(filters.city).toBe('Portland');
      expect(filters.state).toBe('OR');
    });

    it('should accept numeric values for bedrooms and price', () => {
      const filters: ListingFilters = {
        minBedrooms: 3,
        maxPrice: 800000
      };

      expect(filters.minBedrooms).toBe(3);
      expect(filters.maxPrice).toBe(800000);
    });

    it('should accept all properties together', () => {
      const filters: ListingFilters = {
        status: 'Active',
        city: 'Seattle',
        state: 'WA',
        minBedrooms: 2,
        maxPrice: 750000
      };

      expect(filters.status).toBe('Active');
      expect(filters.city).toBe('Seattle');
      expect(filters.state).toBe('WA');
      expect(filters.minBedrooms).toBe(2);
      expect(filters.maxPrice).toBe(750000);
    });

    it('should handle edge case values', () => {
      const filters: ListingFilters = {
        minBedrooms: 0,
        maxPrice: 0
      };

      expect(filters.minBedrooms).toBe(0);
      expect(filters.maxPrice).toBe(0);
    });
  });

  describe('Listing', () => {
    it('should enforce required properties', () => {
      const listing: Listing = {
        listingId: 'L001',
        address: {
          street: '123 Main St',
          city: 'Portland',
          state: 'OR',
          zip: '97201'
        },
        price: 500000,
        bedrooms: 3,
        bathrooms: 2,
        status: 'Active'
      };

      expect(listing.listingId).toBe('L001');
      expect(listing.address.street).toBe('123 Main St');
      expect(listing.address.city).toBe('Portland');
      expect(listing.address.state).toBe('OR');
      expect(listing.address.zip).toBe('97201');
      expect(listing.price).toBe(500000);
      expect(listing.bedrooms).toBe(3);
      expect(listing.bathrooms).toBe(2);
      expect(listing.status).toBe('Active');
    });

    it('should accept all valid status values', () => {
      const baseListing = {
        listingId: 'L001',
        address: {
          street: '123 Main St',
          city: 'Portland',
          state: 'OR',
          zip: '97201'
        },
        price: 500000,
        bedrooms: 3,
        bathrooms: 2
      };

      const activeListing: Listing = { ...baseListing, status: 'Active' };
      const pendingListing: Listing = { ...baseListing, status: 'Pending' };
      const soldListing: Listing = { ...baseListing, status: 'Sold' };

      expect(activeListing.status).toBe('Active');
      expect(pendingListing.status).toBe('Pending');
      expect(soldListing.status).toBe('Sold');
    });

    it('should handle various address formats', () => {
      const listing: Listing = {
        listingId: 'L002',
        address: {
          street: '456 Oak Avenue Unit 2B',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102-1234'
        },
        price: 1200000,
        bedrooms: 1,
        bathrooms: 1,
        status: 'Active'
      };

      expect(listing.address.street).toBe('456 Oak Avenue Unit 2B');
      expect(listing.address.zip).toBe('94102-1234');
    });

    it('should handle various price ranges', () => {
      const affordableListing: Listing = {
        listingId: 'L003',
        address: { street: '789 Pine St', city: 'Portland', state: 'OR', zip: '97201' },
        price: 300000,
        bedrooms: 2,
        bathrooms: 1,
        status: 'Active'
      };

      const luxuryListing: Listing = {
        listingId: 'L004',
        address: { street: '321 Luxury Ave', city: 'Seattle', state: 'WA', zip: '98101' },
        price: 2500000,
        bedrooms: 5,
        bathrooms: 4,
        status: 'Active'
      };

      expect(affordableListing.price).toBe(300000);
      expect(luxuryListing.price).toBe(2500000);
    });

    it('should handle fractional bathrooms', () => {
      const listing: Listing = {
        listingId: 'L005',
        address: { street: '555 Test St', city: 'Test City', state: 'TS', zip: '12345' },
        price: 400000,
        bedrooms: 2,
        bathrooms: 1.5, // Half bath
        status: 'Active'
      };

      expect(listing.bathrooms).toBe(1.5);
    });

    it('should be serializable to JSON', () => {
      const listing: Listing = {
        listingId: 'L006',
        address: {
          street: '123 JSON St',
          city: 'Data City',
          state: 'DC',
          zip: '00000'
        },
        price: 600000,
        bedrooms: 3,
        bathrooms: 2,
        status: 'Active'
      };

      const json = JSON.stringify(listing);
      const parsed = JSON.parse(json);

      expect(parsed.listingId).toBe('L006');
      expect(parsed.address.street).toBe('123 JSON St');
      expect(parsed.price).toBe(600000);
      expect(parsed.status).toBe('Active');
    });
  });

  describe('Type compatibility', () => {
    it('should ensure ListingFilters matches Listing properties for filtering', () => {
      // This test ensures our filter interface can properly filter Listing objects
      const listing: Listing = {
        listingId: 'L007',
        address: { street: '999 Test Ave', city: 'Portland', state: 'OR', zip: '97201' },
        price: 750000,
        bedrooms: 4,
        bathrooms: 3,
        status: 'Active'
      };

      const filters: ListingFilters = {
        city: 'Portland',    // matches listing.address.city
        state: 'OR',         // matches listing.address.state
        status: 'Active',    // matches listing.status
        minBedrooms: 3,      // should match listing.bedrooms (4 >= 3)
        maxPrice: 800000     // should match listing.price (750000 <= 800000)
      };

      // Simulate filtering logic
      const cityMatch = !filters.city || listing.address.city.toLowerCase() === filters.city.toLowerCase();
      const stateMatch = !filters.state || listing.address.state.toLowerCase() === filters.state.toLowerCase();
      const statusMatch = !filters.status || listing.status === filters.status;
      const bedroomsMatch = !filters.minBedrooms || listing.bedrooms >= filters.minBedrooms;
      const priceMatch = !filters.maxPrice || listing.price <= filters.maxPrice;

      expect(cityMatch).toBe(true);
      expect(stateMatch).toBe(true);
      expect(statusMatch).toBe(true);
      expect(bedroomsMatch).toBe(true);
      expect(priceMatch).toBe(true);
    });
  });
});