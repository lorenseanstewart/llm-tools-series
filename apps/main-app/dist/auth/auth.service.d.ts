import { JwtService } from '@nestjs/jwt';
import { User } from './auth.config';
export declare const DATABASE_TOKEN = "DATABASE_CONNECTION";
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
export declare class AuthService {
    private jwtService;
    private db;
    private saltRounds;
    constructor(jwtService: JwtService, db: any);
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    generateId(): string;
    validateUser(email: string, password: string): Promise<User | null>;
    findUserById(id: string): Promise<User | null>;
    findUserByEmail(email: string): Promise<User | null>;
    createUser(createUserDto: CreateUserDto): Promise<User>;
    login(user: User): Promise<LoginResult>;
    signup(createUserDto: CreateUserDto): Promise<LoginResult>;
}
