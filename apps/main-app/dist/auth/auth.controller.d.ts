import { AuthService, CreateUserDto } from './auth.service';
import { User } from './auth.config';
export declare class AuthController {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    signup(createUserDto: CreateUserDto): Promise<{
        success: boolean;
        user: User;
        access_token: string;
    }>;
    signin(req: {
        user: User;
    }): Promise<{
        success: boolean;
        user: User;
        access_token: string;
    }>;
    login(req: {
        user: User;
    }): Promise<{
        success: boolean;
        user: User;
        access_token: string;
    }>;
    signout(req: {
        user: User;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getProfile(req: {
        user: User;
    }): {
        success: boolean;
        user: User;
    };
}
