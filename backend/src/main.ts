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

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
