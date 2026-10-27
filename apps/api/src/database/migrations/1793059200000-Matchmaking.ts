import { MigrationInterface, QueryRunner } from "typeorm";

export class Matchmaking1793059200000 implements MigrationInterface {
  name = "Matchmaking1793059200000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email varchar(254) NOT NULL UNIQUE CHECK (email = lower(email)),
        "passwordHash" varchar NOT NULL,
        name varchar(80) NOT NULL,
        city varchar(80) NOT NULL DEFAULT 'TP. Hồ Chí Minh',
        bio varchar(500) NOT NULL DEFAULT '',
        sports text NOT NULL DEFAULT '',
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE matches (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "hostId" uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        title varchar(120) NOT NULL,
        sport varchar(20) NOT NULL CHECK (sport IN ('football','badminton','basketball','volleyball','tennis','pickleball')),
        level varchar(20) NOT NULL DEFAULT 'all' CHECK (level IN ('all','beginner','intermediate','advanced')),
        city varchar(80) NOT NULL, district varchar(80) NOT NULL,
        venue varchar(160) NOT NULL, address varchar(240) NOT NULL,
        "startsAt" timestamptz NOT NULL,
        "durationMinutes" integer NOT NULL CHECK ("durationMinutes" BETWEEN 30 AND 360),
        capacity integer NOT NULL CHECK (capacity BETWEEN 2 AND 100),
        fee integer NOT NULL DEFAULT 0 CHECK (fee BETWEEN 0 AND 10000000),
        description text NOT NULL DEFAULT '',
        status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','cancelled','completed')),
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX matches_status_starts_at ON matches(status, "startsAt");
      CREATE INDEX matches_host ON matches("hostId");
      CREATE TABLE match_positions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "matchId" uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        name varchar(60) NOT NULL,
        quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
        UNIQUE(id, "matchId")
      );
      CREATE INDEX positions_match ON match_positions("matchId");
      CREATE TABLE join_requests (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "matchId" uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "positionId" uuid NULL REFERENCES match_positions(id) ON DELETE RESTRICT,
        status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
        message varchar(500) NOT NULL DEFAULT '',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE("matchId", "userId"),
        FOREIGN KEY ("positionId", "matchId") REFERENCES match_positions(id, "matchId")
      );
      CREATE INDEX requests_match_status ON join_requests("matchId", status);
      CREATE INDEX requests_user ON join_requests("userId");
    `);
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query(
      "DROP TABLE join_requests; DROP TABLE match_positions; DROP TABLE matches; DROP TABLE users;",
    );
  }
}
