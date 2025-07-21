import configuration from './configuration';

describe('Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default configuration when no environment variables are set', () => {
    // Clear relevant environment variables
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.YOUR_SITE_URL;
    delete process.env.PORT;

    const config = configuration();

    expect(config).toEqual({
      PORT: 3000,
      OPENROUTER_API_KEY: undefined,
      SITE_URL: undefined
    });
  });

  it('should use environment variables when provided', () => {
    process.env.OPENROUTER_API_KEY = 'test-api-key';
    process.env.YOUR_SITE_URL = 'https://example.com';
    process.env.PORT = '8080';

    const config = configuration();

    expect(config).toEqual({
      PORT: 8080,
      OPENROUTER_API_KEY: 'test-api-key',
      SITE_URL: 'https://example.com'
    });
  });

  it('should handle partial environment variables', () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    delete process.env.YOUR_SITE_URL;
    delete process.env.PORT;

    const config = configuration();

    expect(config).toEqual({
      PORT: 3000,
      OPENROUTER_API_KEY: 'test-key',
      SITE_URL: undefined
    });
  });

  it('should convert PORT to number', () => {
    process.env.PORT = '9000';

    const config = configuration();

    expect(config.PORT).toBe(9000);
    expect(typeof config.PORT).toBe('number');
  });

  it('should handle invalid PORT values gracefully', () => {
    process.env.PORT = 'invalid';

    const config = configuration();

    // parseInt('invalid', 10) returns NaN, which is the actual behavior
    expect(config.PORT).toBe(NaN);
  });

  it('should handle empty string environment variables', () => {
    process.env.OPENROUTER_API_KEY = '';
    process.env.YOUR_SITE_URL = '';

    const config = configuration();

    expect(config.OPENROUTER_API_KEY).toBe('');
    expect(config.SITE_URL).toBe('');
  });
});