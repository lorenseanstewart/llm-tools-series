import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that don't have decorators
    forbidNonWhitelisted: true, // Throw error for extra properties
    transform: true, // Transform payloads to DTO instances
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
void (async () => {
  try {
    await bootstrap();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
