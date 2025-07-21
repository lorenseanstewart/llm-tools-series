import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService, DATABASE_TOKEN } from './auth.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockDb: any;
  let mockStmt: any;

  beforeEach(async () => {
    // Create fresh mocks for each test
    mockStmt = {
      get: jest.fn(),
      run: jest.fn(),
    };

    mockDb = {
      prepare: jest.fn(() => mockStmt),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: DATABASE_TOKEN,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with correct salt rounds', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword';
      
      mockBcrypt.hash.mockResolvedValueOnce(hashedPassword as never);

      const result = await service.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should handle bcrypt errors', async () => {
      const password = 'testPassword123';
      mockBcrypt.hash.mockRejectedValueOnce(new Error('Hashing failed') as never);

      await expect(service.hashPassword(password)).rejects.toThrow('Hashing failed');
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      const password = 'testPassword123';
      const hash = 'hashedPassword';
      
      mockBcrypt.compare.mockResolvedValueOnce(true as never);

      const result = await service.verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'wrongPassword';
      const hash = 'hashedPassword';
      
      mockBcrypt.compare.mockResolvedValueOnce(false as never);

      const result = await service.verifyPassword(password, hash);

      expect(result).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = service.generateId();
      const id2 = service.generateId();

      expect(id1).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(id2).toHaveLength(32);
      expect(id1).not.toBe(id2);
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'testPassword123';
      const mockUser = {
        id: 'user123',
        email,
        password_hash: 'hashedPassword',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };

      mockStmt.get.mockReturnValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValueOnce(true as never);

      const result = await service.validateUser(email, password);

      expect(mockDb.prepare).toHaveBeenCalledWith(`
      SELECT id, email, password_hash, name, role, created_at
      FROM users WHERE email = ?
    `);
      expect(mockStmt.get).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password_hash);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        created_at: mockUser.created_at,
      });
    });

    it('should return null for non-existent user', async () => {
      const email = 'nonexistent@example.com';
      const password = 'testPassword123';

      mockStmt.get.mockReturnValueOnce(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      const email = 'test@example.com';
      const password = 'wrongPassword';
      const mockUser = {
        id: 'user123',
        email,
        password_hash: 'hashedPassword',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };

      mockStmt.get.mockReturnValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValueOnce(false as never);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find user by ID', async () => {
      const userId = 'user123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };

      mockStmt.get.mockReturnValueOnce(mockUser);

      const result = await service.findUserById(userId);

      expect(mockDb.prepare).toHaveBeenCalledWith(`
      SELECT id, email, name, role, created_at
      FROM users WHERE id = ?
    `);
      expect(mockStmt.get).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user ID', async () => {
      const userId = 'nonexistent';

      mockStmt.get.mockReturnValueOnce(null);

      const result = await service.findUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user123',
        email,
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };

      mockStmt.get.mockReturnValueOnce(mockUser);

      const result = await service.findUserByEmail(email);

      expect(mockDb.prepare).toHaveBeenCalledWith(`
      SELECT id, email, name, role, created_at
      FROM users WHERE email = ?
    `);
      expect(mockStmt.get).toHaveBeenCalledWith(email);
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent email', async () => {
      const email = 'nonexistent@example.com';

      mockStmt.get.mockReturnValueOnce(null);

      const result = await service.findUserByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'user',
      };
      const hashedPassword = 'hashedPassword';

      mockBcrypt.hash.mockResolvedValueOnce(hashedPassword as never);
      jest.spyOn(service, 'generateId').mockReturnValueOnce('generatedId');

      const result = await service.createUser(createUserDto);

      expect(service.generateId).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      expect(mockDb.prepare).toHaveBeenCalledWith(`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
    `);
      expect(mockStmt.run).toHaveBeenCalledWith(
        'generatedId',
        createUserDto.email,
        hashedPassword,
        createUserDto.name,
        createUserDto.role,
      );
      expect(result).toEqual({
        id: 'generatedId',
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role,
        created_at: expect.any(String),
      });
    });

    it('should create user with default role when not specified', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };
      const hashedPassword = 'hashedPassword';

      mockBcrypt.hash.mockResolvedValueOnce(hashedPassword as never);
      jest.spyOn(service, 'generateId').mockReturnValueOnce('generatedId');

      const result = await service.createUser(createUserDto);

      expect(mockStmt.run).toHaveBeenCalledWith(
        'generatedId',
        createUserDto.email,
        hashedPassword,
        createUserDto.name,
        'user', // Default role
      );
      expect(result.role).toBe('user');
    });

    it('should handle database errors during user creation', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };
      const hashedPassword = 'hashedPassword';

      mockBcrypt.hash.mockResolvedValueOnce(hashedPassword as never);
      jest.spyOn(service, 'generateId').mockReturnValueOnce('generatedId');
      mockStmt.run.mockImplementationOnce(() => {
        throw new Error('Database constraint violation');
      });

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        'Database constraint violation',
      );
    });
  });

  describe('login', () => {
    it('should generate JWT token for user', async () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };
      const token = 'jwt.token.here';

      (jwtService.sign as jest.Mock).mockReturnValueOnce(token);

      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      expect(result).toEqual({
        user,
        access_token: token,
      });
    });
  });

  describe('signup', () => {
    it('should create user and return login result', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };
      const createdUser = {
        id: 'user123',
        email: createUserDto.email,
        name: createUserDto.name,
        role: 'user',
        created_at: '2023-01-01T00:00:00.000Z',
      };
      const loginResult = {
        user: createdUser,
        access_token: 'jwt.token.here',
      };

      jest.spyOn(service, 'createUser').mockResolvedValueOnce(createdUser);
      jest.spyOn(service, 'login').mockResolvedValueOnce(loginResult);

      const result = await service.signup(createUserDto);

      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
      expect(service.login).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(loginResult);
    });
  });
});