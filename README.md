# LLM Tools Real Estate Agent - Part 3: MCP Security

A production-ready AI real estate agent with **enterprise-grade security** using JWT authentication. This implementation adds authentication and authorization layers to the MCP microservices architecture from Part 2.

> **📍 Current Branch: `part-3-mcp-security`**
> 
> This is Part 3 of a 4-part series showing the evolution from a simple chatbot to a production-ready AI agent system. This part adds JWT authentication and security features while maintaining the **frontend UI at localhost:3000**.

## What's New in Part 3: Security Implementation

Building on the MCP microservices architecture from Part 2, this branch adds comprehensive security features:

### Key Security Additions
- **🔐 JWT Authentication**: Secure token-based authentication with Passport.js
- **🛡️ Protected Routes**: Authentication required for agent interactions
- **👤 User Management**: Registration, login, and session handling
- **🔒 Secure MCP Communication**: Auth tokens passed to MCP servers
- **🎨 Auth UI Flow**: Login/logout interface with session persistence
- **🍪 Secure Cookies**: HttpOnly cookies for token storage
- **⚡ CORS Protection**: Configured for production security

### Complete Feature Set
- All features from Part 2 (MCP microservices, analytics tools)
- JWT-based authentication system
- User registration and login endpoints
- Protected agent chat endpoints
- Session management with secure cookies
- Frontend auth UI components
- Comprehensive auth testing

## Architecture

The project maintains the **monorepo microservices architecture** from Part 2 with added security layers:

### Security Components

#### Authentication Module (`apps/main-app/src/auth/`)
- **Auth Controller**: Handles registration, login, logout
- **Auth Service**: User management and JWT operations
- **JWT Strategy**: Passport.js JWT authentication
- **Auth Guards**: Protect sensitive endpoints

#### User Model
```typescript
interface User {
  id: string;
  email: string;
  password: string; // Hashed with bcrypt
  createdAt: Date;
}
```

#### Protected Endpoints
- `/agents/chat` - Requires valid JWT token
- `/auth/profile` - Get current user info
- `/auth/logout` - Clear authentication

#### Public Endpoints
- `/auth/register` - Create new user account
- `/auth/login` - Authenticate and receive JWT

## Frontend Authentication Flow

The chat interface includes a complete authentication system:

### Login Screen
- Email and password form
- Registration link for new users
- Error handling for invalid credentials
- Automatic redirect after successful login

### Authenticated Experience
- User email displayed in header
- Logout button
- Session persistence across page refreshes
- Automatic token refresh

### Security Features
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 24-hour expiration
- HttpOnly cookies prevent XSS attacks
- CORS configured for production use

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- OpenRouter API key

### Quick Setup

1. **Clone the repository:**
```bash
git clone git@github.com:lorenseanstewart/llm-tools-series.git
cd llm-tools-series
git checkout part-3-mcp-security
npm run install-all  # Installs dependencies for all workspaces
```

2. **Setup environment:**
```bash
npm run setup
```

**Important: You need to configure THREE .env files with matching JWT_SECRET:**
- `apps/main-app/.env` - Set your OpenRouter API key and JWT_SECRET
- `apps/mcp-listings/.env` - Add the same JWT_SECRET
- `apps/mcp-analytics/.env` - Add the same JWT_SECRET

The JWT_SECRET must be identical across all services for authentication to work.

3. **Start all services:**
```bash
npm run dev
```

This starts:
- **Main app with auth UI**: http://localhost:3000
- **MCP Listings server**: http://localhost:3001  
- **MCP Analytics server**: http://localhost:3002

4. **Register and use the app:**
- Visit http://localhost:3000
- Click "Sign up" to create an account
- Login with your credentials
- Start chatting with the AI agent!

## API Usage

### Authentication Endpoints

**Register a new user:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

**Protected agent chat:**
```bash
# First login to get the JWT token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}' \
  | jq -r '.access_token')

# Use the token for authenticated requests
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userMessage": "Find me homes in Portland"}'
```

## Security Configuration

### JWT Settings
```typescript
// Default configuration (can be customized via environment)
{
  secret: process.env.JWT_SECRET || 'your-secret-key',
  signOptions: { expiresIn: '24h' }
}
```

### Password Requirements
- Minimum 6 characters
- Hashed using bcrypt with 10 salt rounds
- Never stored in plain text

### CORS Configuration
```typescript
{
  origin: process.env.YOUR_SITE_URL || 'http://localhost:3000',
  credentials: true
}
```

## Testing

The test suite includes comprehensive auth testing:

```bash
# Run all tests including auth tests
npm run test

# Run auth-specific tests
npm run test -w apps/main-app -- auth

# Test coverage
npm run test:cov
```

Auth test coverage includes:
- User registration validation
- Login flow testing
- JWT token generation
- Protected route access
- Invalid credential handling

## Development Tips

### Testing Auth Locally
1. Register a test user via the UI or API
2. Use browser dev tools to inspect JWT cookies
3. Test protected endpoints with/without auth

### Common Issues
- **"Unauthorized" errors**: Check JWT token expiration
- **Login fails**: Verify password meets requirements
- **Cookie not set**: Ensure CORS credentials are enabled

## Next Steps

Ready for real-time features? Check out the other parts:

- **Part 1**: `part-1-chatbot-to-agent` - Foundation with direct tool integration
- **Part 2**: `part-2-mcp-scaling` - Microservices with MCP
- **Part 4**: `part-4-sse` - Real-time streaming with Server-Sent Events

Each part builds on the previous one, adding production-ready features.

## License

MIT