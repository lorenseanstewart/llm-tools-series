"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listingFiltersSchema = void 0;
exports.listingFiltersSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "ListingStatus": {
            "enum": [
                "Active",
                "Pending",
                "Sold"
            ],
            "type": "string"
        }
    },
    "description": "Defines the search criteria for finding property listings.\nThe LLM will learn to populate this structure from natural language.",
    "properties": {
        "city": {
            "type": "string"
        },
        "maxPrice": {
            "type": "number"
        },
        "minBedrooms": {
            "type": "number"
        },
        "state": {
            "type": "string"
        },
        "status": {
            "$ref": "#/definitions/ListingStatus"
        }
    },
    "type": "object"
};
exports.default = exports.listingFiltersSchema;
//# sourceMappingURL=listing-filters.schema.js.map