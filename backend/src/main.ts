import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: false
  });

  // Raise JSON/urlencoded limits (default ~100kb triggers "Payload Too Large").
  app.useBodyParser("json", { limit: "220mb" });
  app.useBodyParser("urlencoded", { limit: "220mb", extended: true });

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? "*").split(","),
    credentials: true
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const storageDriver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
  const configured = process.env.UPLOAD_DIR;
  const uploadDir = configured
    ? configured.startsWith("/") || /^[A-Za-z]:/.test(configured)
      ? configured
      : join(process.cwd(), configured)
    : join(process.cwd(), "uploads");

  // Keep a local static mount as fallback for older `/api/media/files/...` URLs.
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  app.useStaticAssets(uploadDir, { prefix: "/api/media/files/" });

  const docsConfig = new DocumentBuilder()
    .setTitle("EOF Talent API")
    .setDescription("Backend API for EOF Talent marketplace")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const docs = SwaggerModule.createDocument(app, docsConfig);
  SwaggerModule.setup("docs", app, docs);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, "0.0.0.0");
  console.log(`API running on http://0.0.0.0:${port}/api`);
  if (storageDriver === "s3") {
    const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "eof-talent-images";
    const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
    console.log(`Media storage: S3 (bucket=${bucket}, region=${region})`);
    console.log(`Local static fallback mount: ${uploadDir}`);
  } else {
    console.log(`Media storage: local (${uploadDir})`);
  }
}

void bootstrap();
