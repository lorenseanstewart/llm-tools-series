export default () => ({
  // Main App Configuration
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  
  // OpenRouter API Configuration
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  SITE_URL: process.env.YOUR_SITE_URL || 'http://localhost:3000',
  
  // MCP Server URLs
  MCP_LISTINGS_URL: process.env.MCP_LISTINGS_URL || 'http://localhost:3001',
  MCP_ANALYTICS_URL: process.env.MCP_ANALYTICS_URL || 'http://localhost:3002',
  
  // Development Settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
});
