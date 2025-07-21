export default () => ({
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  SITE_URL: process.env.YOUR_SITE_URL,
});
