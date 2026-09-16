import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersAndVerificationCodes1700000001000
  implements MigrationInterface
{
  name = "CreateUsersAndVerificationCodes1700000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "user_id" BIGSERIAL PRIMARY KEY,
        "phone_number" VARCHAR(15) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "full_name" VARCHAR(100) NOT NULL,
        "gender" VARCHAR(10) NULL,
        "date_of_birth" DATE NULL,
        "avatar_url" VARCHAR(255) NULL,
        "bio" VARCHAR(500) NULL,
        "preferred_position" VARCHAR(10) NULL,
        "role" VARCHAR(20) NOT NULL DEFAULT 'PLAYER',
        "account_status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "verification_status" VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "chk_user_role" CHECK ("role" IN ('PLAYER', 'FIELD_OWNER', 'ADMIN')),
        CONSTRAINT "chk_user_account_status" CHECK ("account_status" IN ('ACTIVE', 'BLOCKED', 'DELETED')),
        CONSTRAINT "chk_user_verification_status" CHECK ("verification_status" IN ('UNVERIFIED', 'VERIFIED'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verification_codes" (
        "verification_code_id" BIGSERIAL PRIMARY KEY,
        "user_id" BIGINT NOT NULL,
        "code_hash" VARCHAR(255) NOT NULL,
        "purpose" VARCHAR(30) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP NULL,
        "attempt_count" SMALLINT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_verification_codes_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE,
        CONSTRAINT "chk_verification_codes_purpose" CHECK ("purpose" IN ('PHONE_VERIFICATION', 'PASSWORD_RESET')),
        CONSTRAINT "chk_verification_codes_attempt_count" CHECK ("attempt_count" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_account_status" ON "users" ("account_status");
      CREATE INDEX IF NOT EXISTS "idx_verification_codes_user_id" ON "verification_codes" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_verification_codes_expires_at" ON "verification_codes" ("expires_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "verification_codes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
