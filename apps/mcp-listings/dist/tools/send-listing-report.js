"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendListingReport = sendListingReport;
async function sendListingReport(listingIds, recipientEmail) {
    console.log('--- Calling sendListingReport tool ---');
    console.log('Listing IDs:', listingIds);
    console.log('Recipient:', recipientEmail);
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        success: true,
        message: `Report with ${listingIds.length} listings sent to ${recipientEmail}`
    };
}
