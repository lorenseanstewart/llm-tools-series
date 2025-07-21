"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ToolsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolsService = void 0;
const common_1 = require("@nestjs/common");
const mock_data_1 = require("./mock.data");
let ToolsService = ToolsService_1 = class ToolsService {
    constructor() { }
    logger = new common_1.Logger(ToolsService_1.name);
    async findListings(filters) {
        let listings = mock_data_1.mockListings;
        this.logger.log("--- Calling 'findListings' tool ---");
        this.logger.log("Filters:", filters);
        const { city, state, minBedrooms, maxPrice, status } = filters;
        if (city) {
            listings = listings.filter((listing) => listing.address.city.toLowerCase() === city.toLowerCase());
        }
        if (state) {
            listings = listings.filter((listing) => listing.address.state.toLowerCase() === state.toLowerCase());
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
    async sendListingReport(listingIds, recipientEmail) {
        this.logger.log(`--- Calling 'sendListingReport' tool ---`);
        this.logger.log(`Emailing report for listings ${listingIds.join(", ")} to ${recipientEmail}`);
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
};
exports.ToolsService = ToolsService;
exports.ToolsService = ToolsService = ToolsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ToolsService);
//# sourceMappingURL=tools.service.js.map