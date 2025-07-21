import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = {
        id: 'user123',
        email,
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when authService throws error', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAuthService.validateUser.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});