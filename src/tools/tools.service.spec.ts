import { Test, TestingModule } from "@nestjs/testing";
import { ToolsService } from "./tools.service";
import { ListingFilters } from "./listings.types";

describe("ToolsService", () => {
  let service: ToolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ToolsService],
    }).compile();

    service = module.get<ToolsService>(ToolsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findListings", () => {
    it("should return all listings when no filters are provided", async () => {
      const filters: ListingFilters = {};
      const result = await service.findListings(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should filter listings by city", async () => {
      const filters: ListingFilters = { city: "Portland" };
      const result = await service.findListings(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach(listing => {
        expect(listing.address.city.toLowerCase()).toBe("portland");
      });
    });

    it("should filter listings by state", async () => {
      const filters: ListingFilters = { state: "WA" };
      const result = await service.findListings(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach(listing => {
        expect(listing.address.state.toLowerCase()).toBe("wa");
      });
    });

    it("should filter listings by status", async () => {
      const filters: ListingFilters = { status: "Active" };
      const result = await service.findListings(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach(listing => {
        expect(listing.status).toBe("Active");
      });
    });

    it("should filter listings by minimum bedrooms", async () => {
      const filters: ListingFilters = { minBedrooms: 4 };
      const result = await service.findListings(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach(listing => {
        expect(listing.bedrooms).toBeGreaterThanOrEqual(4);
      });
    });

    it("should filter listings by maximum price", async () => {
      const filters: ListingFilters = { maxPrice: 800000 };
      const result = await service.findListings(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach(listing => {
        expect(listing.price).toBeLessThanOrEqual(800000);
      });
    });

    it("should apply multiple filters correctly", async () => {
      const filters: ListingFilters = {
        city: "Portland",
        status: "Active",
        minBedrooms: 3,
        maxPrice: 850000
      };
      const result = await service.findListings(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach(listing => {
        expect(listing.address.city.toLowerCase()).toBe("portland");
        expect(listing.status).toBe("Active");
        expect(listing.bedrooms).toBeGreaterThanOrEqual(3);
        expect(listing.price).toBeLessThanOrEqual(850000);
      });
    });

    it("should return empty array when no listings match filters", async () => {
      const filters: ListingFilters = {
        city: "NonExistentCity",
        maxPrice: 1
      };
      const result = await service.findListings(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should handle case insensitive city filtering", async () => {
      const filters: ListingFilters = { city: "PORTLAND" };
      const result = await service.findListings(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach(listing => {
        expect(listing.address.city.toLowerCase()).toBe("portland");
      });
    });

    it("should handle case insensitive state filtering", async () => {
      const filters: ListingFilters = { state: "or" };
      const result = await service.findListings(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach(listing => {
        expect(listing.address.state.toLowerCase()).toBe("or");
      });
    });
  });

  describe("sendListingReport", () => {
    it("should successfully send report with valid email", async () => {
      const listingIds = ["L001", "L002"];
      const recipientEmail = "test@example.com";
      
      const result = await service.sendListingReport(listingIds, recipientEmail);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain("Report sent successfully");
      expect(result.message).toContain(recipientEmail);
    });

    it("should handle single listing ID", async () => {
      const listingIds = ["L001"];
      const recipientEmail = "test@example.com";
      
      const result = await service.sendListingReport(listingIds, recipientEmail);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain("Report sent successfully");
    });

    it("should handle multiple listing IDs", async () => {
      const listingIds = ["L001", "L002", "L003"];
      const recipientEmail = "test@example.com";
      
      const result = await service.sendListingReport(listingIds, recipientEmail);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain("Report sent successfully");
    });

    it("should fail with invalid email format", async () => {
      const listingIds = ["L001"];
      const recipientEmail = "invalid-email";
      
      const result = await service.sendListingReport(listingIds, recipientEmail);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid email address");
    });

    it("should fail with empty email", async () => {
      const listingIds = ["L001"];
      const recipientEmail = "";
      
      const result = await service.sendListingReport(listingIds, recipientEmail);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid email address");
    });

    it("should handle empty listing IDs array", async () => {
      const listingIds: string[] = [];
      const recipientEmail = "test@example.com";
      
      const result = await service.sendListingReport(listingIds, recipientEmail);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain("Report sent successfully");
    });

    it("should validate email contains @ symbol", async () => {
      const listingIds = ["L001"];
      const recipientEmail = "testexample.com";
      
      const result = await service.sendListingReport(listingIds, recipientEmail);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid email address");
    });
  });
});
