"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.DATABASE_TOKEN = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
exports.DATABASE_TOKEN = 'DATABASE_CONNECTION';
let AuthService = class AuthService {
    jwtService;
    db;
    saltRounds = 12;
    constructor(jwtService, db) {
        this.jwtService = jwtService;
        this.db = db;
    }
    async hashPassword(password) {
        return bcrypt.hash(password, this.saltRounds);
    }
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    generateId() {
        return (0, crypto_1.randomBytes)(16).toString('hex');
    }
    async validateUser(email, password) {
        const stmt = this.db.prepare(`
      SELECT id, email, password_hash, name, role, created_at
      FROM users WHERE email = ?
    `);
        const user = stmt.get(email);
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
    async findUserById(id) {
        const stmt = this.db.prepare(`
      SELECT id, email, name, role, created_at
      FROM users WHERE id = ?
    `);
        const user = stmt.get(id);
        return user;
    }
    async findUserByEmail(email) {
        const stmt = this.db.prepare(`
      SELECT id, email, name, role, created_at
      FROM users WHERE email = ?
    `);
        const user = stmt.get(email);
        return user;
    }
    async createUser(createUserDto) {
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
    async login(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const access_token = this.jwtService.sign(payload);
        return {
            user,
            access_token
        };
    }
    async signup(createUserDto) {
        const user = await this.createUser(createUserDto);
        return this.login(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(exports.DATABASE_TOKEN)),
    __metadata("design:paramtypes", [jwt_1.JwtService, Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map