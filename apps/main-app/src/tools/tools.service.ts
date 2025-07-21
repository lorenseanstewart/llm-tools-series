import { Injectable, Logger } from "@nestjs/common";
import { Listing, ListingFilters } from "./listings.types";
import { mockListings } from "./mock.data";

@Injectable()
export class ToolsService {
  constructor() {}

  logger = new Logger(ToolsService.name);

  /**
   * Finds listings based on the provided filters.
   * @param filters - The filters to apply to the listings.
   * @returns A promise that resolves to an array of listings.
   */
  async findListings(filters: ListingFilters): Promise<Listing[]> {
    let listings = mockListings;

    this.logger.log("--- Calling 'findListings' tool ---");
    this.logger.log("Filters:", filters);

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

    return Promise.resolve(listings);
  }

  /**
   * A tool that sends an email report of specified listings.
   * In a real application, this would trigger an email service.
   */
  async sendListingReport(
    listingIds: string[],
    recipientEmail: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`--- Calling 'sendListingReport' tool ---`);
    this.logger.log(
      `Emailing report for listings ${listingIds.join(", ")} to ${recipientEmail}`,
    );
    // Mock implementation
    if (!recipientEmail.includes("@")) {
      return Promise.resolve({
        success: false,
        message: "Invalid email address provided.",
      });
    }
    return Promise.resolve({
      success: true,
      message: `Report sent successfully to ${recipientEmail}.`,
    });
  }
}
