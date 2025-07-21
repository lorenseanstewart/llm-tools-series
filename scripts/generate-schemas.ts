import * as TJS from "typescript-json-schema";
import fs from "fs";
import path from "path";

// Configure the schema generator
const program = TJS.getProgramFromFiles(["src/tools/listings.types.ts"], {
  strictNullChecks: true,
});

// Generate schema for ListingFilters
const schema = TJS.generateSchema(program, "ListingFilters", {
  required: false,
  ref: false,
});

// Save to file for use in other parts of the app
const schemasDir = path.join(__dirname, "../schemas");
console.log(schemasDir);
if (!fs.existsSync(schemasDir)) {
  fs.mkdirSync(schemasDir, { recursive: true });
}

fs.writeFileSync(
  path.join(schemasDir, "listing-filters.schema.json"),
  JSON.stringify(schema, null, 2),
);

console.log("✅ Generated schema for ListingFilters");