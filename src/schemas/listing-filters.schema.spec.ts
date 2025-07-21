import { listingFiltersSchema } from './listing-filters.schema';

describe('Listing Filters Schema', () => {
  it('should be defined', () => {
    expect(listingFiltersSchema).toBeDefined();
  });

  it('should have correct structure for JSON schema', () => {
    expect(listingFiltersSchema).toHaveProperty('type', 'object');
    expect(listingFiltersSchema).toHaveProperty('properties');
    expect(listingFiltersSchema).toHaveProperty('$schema');
    expect(listingFiltersSchema).toHaveProperty('definitions');
  });

  it('should include all expected properties', () => {
    const properties = listingFiltersSchema.properties;
    
    expect(properties).toHaveProperty('status');
    expect(properties).toHaveProperty('city');
    expect(properties).toHaveProperty('state');
    expect(properties).toHaveProperty('minBedrooms');
    expect(properties).toHaveProperty('maxPrice');
  });

  it('should have correct property types', () => {
    const properties = listingFiltersSchema.properties;

    expect(properties.status).toEqual({
      $ref: '#/definitions/ListingStatus'
    });

    expect(properties.city).toEqual({
      type: 'string'
    });

    expect(properties.state).toEqual({
      type: 'string'
    });

    expect(properties.minBedrooms).toEqual({
      type: 'number'
    });

    expect(properties.maxPrice).toEqual({
      type: 'number'
    });
  });

  it('should have no required properties', () => {
    // All properties should be optional for flexible filtering
    // The schema doesn't include a required array, which means all properties are optional
    expect('required' in listingFiltersSchema).toBe(false);
  });

  it('should match TypeScript interface structure', () => {
    // This ensures our schema stays in sync with TypeScript types
    const expectedProperties = ['status', 'city', 'state', 'minBedrooms', 'maxPrice'];
    const actualProperties = Object.keys(listingFiltersSchema.properties);
    
    expect(actualProperties.sort()).toEqual(expectedProperties.sort());
  });

  it('should validate status enum values correctly', () => {
    const statusDefinition = listingFiltersSchema.definitions.ListingStatus;
    
    expect(statusDefinition.enum).toContain('Active');
    expect(statusDefinition.enum).toContain('Pending');
    expect(statusDefinition.enum).toContain('Sold');
    expect(statusDefinition.enum).toHaveLength(3);
  });

  it('should use appropriate data types for filtering', () => {
    const properties = listingFiltersSchema.properties;

    // String types for text-based filters
    expect(properties.city.type).toBe('string');
    expect(properties.state.type).toBe('string');
    expect(properties.status.$ref).toBe('#/definitions/ListingStatus');

    // Number types for numeric filters
    expect(properties.minBedrooms.type).toBe('number');
    expect(properties.maxPrice.type).toBe('number');
  });

  it('should have meaningful description for the schema', () => {
    expect(listingFiltersSchema.description).toBeDefined();
    expect(typeof listingFiltersSchema.description).toBe('string');
    expect(listingFiltersSchema.description.length).toBeGreaterThan(0);
    expect(listingFiltersSchema.description).toContain('search criteria');
  });
});