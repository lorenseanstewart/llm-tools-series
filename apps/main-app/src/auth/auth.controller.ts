import { Controller, Post, Get, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { AuthService, CreateUserDto } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './auth.config';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    try {
      this.logger.log(`Signup attempt for email: ${createUserDto.email}`);
      
      const result = await this.authService.signup(createUserDto);
      
      this.logger.log(`Signup successful for user: ${result.user.id}`);
      
      return {
        success: true,
        user: result.user,
        access_token: result.access_token
      };
    } catch (error) {
      this.logger.error(`Signup failed for ${createUserDto.email}:`, error);
      throw error;
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  async signin(@Request() req: { user: User }) {
    try {
      this.logger.log(`Signin successful for user: ${req.user.id}`);
      
      const result = await this.authService.login(req.user);
      
      return {
        success: true,
        user: result.user,
        access_token: result.access_token
      };
    } catch (error) {
      this.logger.error('Signin error:', error);
      throw error;
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: { user: User }) {
    try {
      this.logger.log(`Login successful for user: ${req.user.id}`);
      
      const result = await this.authService.login(req.user);
      
      return {
        success: true,
        user: result.user,
        access_token: result.access_token
      };
    } catch (error) {
      this.logger.error('Login error:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  async signout(@Request() req: { user: User }) {
    this.logger.log(`User ${req.user.email} signed out`);
    return {
      success: true,
      message: 'Signed out successfully'
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: User }) {
    return {
      success: true,
      user: req.user
    };
  }
}