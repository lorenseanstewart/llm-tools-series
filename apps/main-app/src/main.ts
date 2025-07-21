import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { join } from "path";
import { Eta } from "eta";
import fastifyStatic from "@fastify/static";

const eta: Eta = new Eta({
  cache: process.env.NODE_ENV === "production",
  useWith: false, // Better performance
  rmWhitespace: process.env.NODE_ENV === "production", // Remove whitespace in production
});

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

  // Set up ETA view engine
  app.setViewEngine({
    engine: {
      eta,
    },
    templates: join(__dirname, '..', 'views'),
  });

  // Register static assets
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void (async () => {
  try {
    await bootstrap();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
