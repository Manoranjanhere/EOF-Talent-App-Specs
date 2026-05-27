import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
}

void bootstrap();
