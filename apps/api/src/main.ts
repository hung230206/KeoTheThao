import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ExpressAdapter } from "@nestjs/platform-express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>("API_PREFIX", "api");
  const port = config.get<number>("PORT", 3001);

  const webOrigin = config.get<string>("WEB_ORIGIN", "http://localhost:3000");
  const loginAttempts = new Map<string, { count: number; until: number }>();
  app.use(
    (
      req: import("express").Request,
      res: import("express").Response,
      next: import("express").NextFunction,
    ) => {
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        if (req.headers.origin && req.headers.origin !== webOrigin)
          return res.status(403).json({ message: "Origin không được phép." });
        if (
          req.headers["x-kt-client"] !== "web" &&
          !req.headers.authorization?.startsWith("Bearer ")
        )
          return res.status(403).json({ message: "Thiếu header X-KT-Client." });
      }
      if (
        req.method === "POST" &&
        /\/auth\/(login|register)\/?$/i.test(req.path)
      ) {
        const key = req.ip ?? "unknown";
        const now = Date.now();
        for (const [ip, attempt] of loginAttempts)
          if (attempt.until < now) loginAttempts.delete(ip);
        const attempt = loginAttempts.get(key) ?? {
          count: 0,
          until: now + 60000,
        };
        attempt.count++;
        loginAttempts.set(key, attempt);
        if (attempt.count > 30)
          return res
            .status(429)
            .json({ message: "Thử quá nhiều lần. Vui lòng chờ một phút." });
      }
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-store");
      next();
    },
  );

  app.setGlobalPrefix(apiPrefix);
  app.enableCors({
    origin: webOrigin,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
}

void bootstrap();
