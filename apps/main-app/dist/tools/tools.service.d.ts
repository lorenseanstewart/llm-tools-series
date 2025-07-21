import { Logger } from "@nestjs/common";
import { Listing, ListingFilters } from "./listings.types";
export declare class ToolsService {
    constructor();
    logger: Logger;
    findListings(filters: ListingFilters): Promise<Listing[]>;
    sendListingReport(listingIds: string[], recipientEmail: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
