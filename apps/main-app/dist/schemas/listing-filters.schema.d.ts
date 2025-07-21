export declare const listingFiltersSchema: {
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly definitions: {
        readonly ListingStatus: {
            readonly enum: readonly ["Active", "Pending", "Sold"];
            readonly type: "string";
        };
    };
    readonly description: "Defines the search criteria for finding property listings.\nThe LLM will learn to populate this structure from natural language.";
    readonly properties: {
        readonly city: {
            readonly type: "string";
        };
        readonly maxPrice: {
            readonly type: "number";
        };
        readonly minBedrooms: {
            readonly type: "number";
        };
        readonly state: {
            readonly type: "string";
        };
        readonly status: {
            readonly $ref: "#/definitions/ListingStatus";
        };
    };
    readonly type: "object";
};
export default listingFiltersSchema;
