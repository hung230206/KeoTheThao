import { TypeOrmModuleOptions } from "@nestjs/typeorm";

function toBool(value: string | undefined, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function typeOrmModuleOptions(): TypeOrmModuleOptions {
  return {
    type: "postgres",
    host: process.env.DATABASE_HOST ?? "localhost",
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER ?? "keo_the_thao",
    password: process.env.DATABASE_PASSWORD ?? "keo_the_thao",
    database: process.env.DATABASE_NAME ?? "keo_the_thao",
    autoLoadEntities: true,
    synchronize: false,
    ssl: toBool(process.env.DATABASE_SSL)
  };
}

