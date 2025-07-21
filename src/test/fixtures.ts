import { Listing, ListingFilters } from "../tools/listings.types";
import { OpenRouterResponse } from "../types/openrouter.types";

/**
 * Common test fixtures for consistent testing
 */
export const testFixtures = {
  // Sample listing filters
  filters: {
    portlandActive: {
      city: "Portland",
      status: "Active" as const,
      minBedrooms: 3,
      maxPrice: 850000
    } as ListingFilters,

    seattleAll: {
      city: "Seattle",
      state: "WA"
    } as ListingFilters,

    luxuryHomes: {
      minBedrooms: 4,
      maxPrice: 2000000
    } as ListingFilters,

    empty: {} as ListingFilters,

    noResults: {
      city: "NonExistentCity",
      maxPrice: 1
    } as ListingFilters
  },

  // Sample listings
  listings: {
    portland: {
      listingId: "L001",
      address: {
        street: "123 Oak Street",
        city: "Portland",
        state: "OR",
        zip: "97201"
      },
      price: 825000,
      bedrooms: 3,
      bathrooms: 2,
      status: "Active" as const
    } as Listing,

    seattle: {
      listingId: "L002",
      address: {
        street: "456 Pine Avenue",
        city: "Seattle",
        state: "WA",
        zip: "98101"
      },
      price: 799000,
      bedrooms: 4,
      bathrooms: 3,
      status: "Active" as const
    } as Listing,

    denver: {
      listingId: "L003",
      address: {
        street: "789 Mountain View Drive",
        city: "Denver",
        state: "CO",
        zip: "80202"
      },
      price: 675000,
      bedrooms: 3,
      bathrooms: 2.5,
      status: "Pending" as const
    } as Listing,

    luxury: {
      listingId: "L004",
      address: {
        street: "1000 Luxury Lane",
        city: "San Francisco",
        state: "CA",
        zip: "94102"
      },
      price: 1850000,
      bedrooms: 5,
      bathrooms: 4,
      status: "Active" as const
    } as Listing,

    sold: {
      listingId: "L005",
      address: {
        street: "555 Sold Street",
        city: "Austin",
        state: "TX",
        zip: "78701"
      },
      price: 550000,
      bedrooms: 2,
      bathrooms: 2,
      status: "Sold" as const
    } as Listing
  },

  // Sample OpenRouter responses
  openRouterResponses: {
    findListingsToolCall: {
      choices: [
        {
          message: {
            tool_calls: [
              {
                id: "call_findListings_123",
                type: "function",
                function: {
                  name: "findListings",
                  arguments: '{"city":"Portland","status":"Active","minBedrooms":3,"maxPrice":850000}'
                }
              }
            ]
          }
        }
      ]
    } as OpenRouterResponse,

    sendReportToolCall: {
      choices: [
        {
          message: {
            tool_calls: [
              {
                id: "call_sendReport_456",
                type: "function",
                function: {
                  name: "sendListingReport",
                  arguments: '{"listingIds":["L001","L002"],"recipientEmail":"client@example.com"}'
                }
              }
            ]
          }
        }
      ]
    } as OpenRouterResponse,

    chatResponse: {
      choices: [
        {
          message: {
            content: "I found 2 properties matching your criteria:\n\n1. **123 Oak Street** - 3 bedrooms, 2 bathrooms - $825,000\n2. **456 Pine Avenue** - 4 bedrooms, 3 bathrooms - $799,000\n\nWould you like more details about either property?"
          }
        }
      ]
    } as OpenRouterResponse,

    conversationalResponse: {
      choices: [
        {
          message: {
            content: "Hello! I'm here to help you with real estate queries. What can I do for you today?"
          }
        }
      ]
    } as OpenRouterResponse,

    errorResponse: {
      choices: [
        {
          message: {
            content: "Sorry, I encountered an error. Please try again."
          }
        }
      ]
    } as OpenRouterResponse
  },

  // Sample user messages
  userMessages: {
    findListings: "Find active listings in Portland, OR with at least 3 bedrooms and under $850,000",
    sendReport: "Send a report of listings L001 and L002 to client@example.com",
    greeting: "Hello, how are you?",
    whatCanYouDo: "What can you help me with?",
    complexQuery: "I'm looking for a 4-bedroom house in Seattle under $900,000 with a good school district",
    invalidRequest: "Do something that doesn't exist",
    longMessage: "a".repeat(1000),
    unicodeMessage: "Find listings in San José, California 🏠",
    specialChars: "Find listings with $500,000 budget & 3+ bedrooms!"
  },

  // Sample API responses
  apiResponses: {
    successfulEmailReport: {
      success: true,
      message: "Report sent successfully to client@example.com."
    },

    failedEmailReport: {
      success: false,
      message: "Invalid email address provided."
    },

    listingsFound: [
      {
        listingId: "L001",
        address: {
          street: "123 Oak Street",
          city: "Portland",
          state: "OR",
          zip: "97201"
        },
        price: 825000,
        bedrooms: 3,
        bathrooms: 2,
        status: "Active"
      },
      {
        listingId: "L002",
        address: {
          street: "456 Pine Avenue",
          city: "Seattle",
          state: "WA",
          zip: "98101"
        },
        price: 799000,
        bedrooms: 4,
        bathrooms: 3,
        status: "Active"
      }
    ] as Listing[],

    noListingsFound: [] as Listing[]
  },

  // Sample email addresses
  emails: {
    valid: [
      "client@example.com",
      "test@test.com",
      "user.name@domain.co.uk",
      "user+tag@example.org"
    ],
    invalid: [
      "invalid-email",
      "missing@",
      "@missing-local.com",
      "spaces in@email.com",
      ""
    ]
  },

  // Sample listing IDs
  listingIds: {
    single: ["L001"],
    multiple: ["L001", "L002", "L003"],
    empty: [] as string[],
    nonExistent: ["L999"]
  },

  // Sample chat request DTOs
  chatRequests: {
    valid: {
      userMessage: "Find me some listings in Portland"
    },
    minimal: {
      userMessage: "Hi"
    },
    long: {
      userMessage: "a".repeat(500) + " Can you help me find a house?"
    },
    unicode: {
      userMessage: "Find listings in San José 🏠"
    }
  },

  // Sample chat responses
  chatResponses: {
    success: {
      success: true,
      message: "I found 2 properties matching your criteria...",
      timestamp: "2024-01-01T12:00:00.000Z"
    },
    empty: {
      success: true,
      message: "",
      timestamp: "2024-01-01T12:00:00.000Z"
    }
  },

  // Sample error messages
  errors: {
    networkError: "Network Error",
    apiError: "API Error",
    serviceError: "Service Error",
    unknownTool: "Unknown tool: unknownTool",
    invalidJson: "Unexpected token in JSON",
    malformedArguments: "invalid json"
  },

  // Sample OpenRouter models
  models: {
    kimi: "moonshotai/kimi-k2",
    gemini: "google/gemini-2.0-flash-001"
  },

  // Sample system prompts
  systemPrompts: {
    toolSelection: "You are a professional real estate assistant. When users ask about properties, use the findListings tool to search.",
    responseGeneration: "You are a professional real estate assistant. Please be professional but friendly."
  }
};

/**
 * Helper function to get a deep copy of fixture data
 */
export function getFixture<T>(fixture: T): T {
  return JSON.parse(JSON.stringify(fixture));
}

/**
 * Helper function to create a custom listing
 */
export function createCustomListing(overrides: Partial<Listing> = {}): Listing {
  return {
    ...testFixtures.listings.portland,
    ...overrides
  };
}

/**
 * Helper function to create a custom filter
 */
export function createCustomFilter(overrides: Partial<ListingFilters> = {}): ListingFilters {
  return {
    ...testFixtures.filters.portlandActive,
    ...overrides
  };
}