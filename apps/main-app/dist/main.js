"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const eta_1 = require("eta");
const static_1 = require("@fastify/static");
const eta = new eta_1.Eta({
    cache: process.env.NODE_ENV === "production",
    useWith: false,
    rmWhitespace: process.env.NODE_ENV === "production",
});
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setViewEngine({
        engine: {
            eta,
        },
        templates: (0, path_1.join)(__dirname, '..', 'views'),
    });
    await app.register(static_1.default, {
        root: (0, path_1.join)(__dirname, '..', 'public'),
        prefix: '/public/',
    });
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void (async () => {
    try {
        await bootstrap();
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
//# sourceMappingURL=main.js.map