import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  // Mock Logger to suppress expected error logs in tests
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    
    // Replace the logger with our mock to suppress error logs
    (controller as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and return success response', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockResult = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          created_at: '2023-01-01T00:00:00.000Z',
        },
        access_token: 'jwt.token.here',
      };

      mockAuthService.signup.mockResolvedValue(mockResult);

      const result = await controller.signup(createUserDto);

      expect(authService.signup).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual({
        success: true,
        user: mockResult.user,
        access_token: mockResult.access_token,
      });
    });

    it('should handle signup errors', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const error = new Error('Email already exists');
      mockAuthService.signup.mockRejectedValue(error);

      await expect(controller.signup(createUserDto)).rejects.toThrow('Email already exists');
      expect(authService.signup).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('signin', () => {
    it('should sign in user and return success response', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };

      const mockResult = {
        user: mockUser,
        access_token: 'jwt.token.here',
      };

      const req = { user: mockUser };
      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await controller.signin(req);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        success: true,
        user: mockResult.user,
        access_token: mockResult.access_token,
      });
    });

    it('should handle signin errors', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };

      const req = { user: mockUser };
      const error = new Error('Authentication failed');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.signin(req)).rejects.toThrow('Authentication failed');
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('login', () => {
    it('should login user and return success response', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };

      const mockResult = {
        user: mockUser,
        access_token: 'jwt.token.here',
      };

      const req = { user: mockUser };
      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await controller.login(req);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        success: true,
        user: mockResult.user,
        access_token: mockResult.access_token,
      });
    });

    it('should handle login errors', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };

      const req = { user: mockUser };
      const error = new Error('Login failed');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(req)).rejects.toThrow('Login failed');
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };

      const req = { user: mockUser };

      const result = await controller.getProfile(req);

      expect(result).toEqual({
        success: true,
        user: mockUser,
      });
    });
  });
});