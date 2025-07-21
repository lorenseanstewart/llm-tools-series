import { AppService } from "./app.service";
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHome(): Promise<{
        title: string;
        subtitle: string;
    }>;
    getHealth(): {
        status: string;
        timestamp: string;
        service: string;
    };
}
