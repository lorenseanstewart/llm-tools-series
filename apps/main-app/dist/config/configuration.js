"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    SITE_URL: process.env.YOUR_SITE_URL || 'http://localhost:3000',
    MCP_LISTINGS_URL: process.env.MCP_LISTINGS_URL || 'http://localhost:3001',
    MCP_ANALYTICS_URL: process.env.MCP_ANALYTICS_URL || 'http://localhost:3002',
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
});
//# sourceMappingURL=configuration.js.map