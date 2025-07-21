import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from './auth.config';

export const DATABASE_TOKEN = 'DATABASE_CONNECTION';

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export interface LoginResult {
  user: User;
  access_token: string;
}

@Injectable()
export class AuthService {
  private saltRounds = 12;

  constructor(
    private jwtService: JwtService,
    @Inject(DATABASE_TOKEN) private db: any
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateId(): string {
    return randomBytes(16).toString('hex');
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const stmt = this.db.prepare(`
      SELECT id, email, password_hash, name, role, created_at
      FROM users WHERE email = ?
    `);
    
    const user = stmt.get(email) as (User & { password_hash: string }) | null;
    
    if (!user) {
      return null;
    }

    const passwordValid = await this.verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at
    };
  }

  async findUserById(id: string): Promise<User | null> {
    const stmt = this.db.prepare(`
      SELECT id, email, name, role, created_at
      FROM users WHERE id = ?
    `);
    
    const user = stmt.get(id) as User | null;
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const stmt = this.db.prepare(`
      SELECT id, email, name, role, created_at
      FROM users WHERE email = ?
    `);
    
    const user = stmt.get(email) as User | null;
    return user;
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name, role = 'user' } = createUserDto;
    const id = this.generateId();
    const passwordHash = await this.hashPassword(password);
    
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, email, passwordHash, name || null, role);
    
    return {
      id,
      email,
      name,
      role,
      created_at: new Date().toISOString()
    };
  }

  async login(user: User): Promise<LoginResult> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      user,
      access_token
    };
  }

  async signup(createUserDto: CreateUserDto): Promise<LoginResult> {
    const user = await this.createUser(createUserDto);
    return this.login(user);
  }
}