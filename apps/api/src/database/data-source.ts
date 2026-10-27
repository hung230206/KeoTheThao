import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";

config();

const ssl = ["1", "true", "yes", "on"].includes(
  (process.env.DATABASE_SSL ?? "false").toLowerCase(),
);

export default new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 55432),
  username: process.env.DATABASE_USER ?? "keo_the_thao",
  password: process.env.DATABASE_PASSWORD ?? "keo_the_thao",
  database: process.env.DATABASE_NAME ?? "keo_the_thao",
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
  ssl,
});
