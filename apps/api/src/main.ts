import "reflect-metadata";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());
  // Four separate browser apps call this API with cookies/credentials — the
  // staff admin dashboard, the customer-facing storefront, the driver app,
  // and the sales (prevente) app — so every origin needs to be allowed
  // explicitly (a wildcard can't be combined with credentials: true per the
  // CORS spec).
  app.enableCors({
    origin: [
      process.env.ADMIN_URL ?? "http://localhost:3000",
      process.env.STOREFRONT_URL ?? "http://localhost:3001",
      process.env.DRIVER_URL ?? "http://localhost:3002",
      process.env.SALES_URL ?? "http://localhost:3003",
    ],
    credentials: true,
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Wasla API")
    .setDescription("B2B distribution platform — REST API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;
  await app.listen(port);
}

bootstrap();
