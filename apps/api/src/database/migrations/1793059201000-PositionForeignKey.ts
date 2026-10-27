import { MigrationInterface, QueryRunner } from "typeorm";

export class PositionForeignKey1793059201000 implements MigrationInterface {
  name = "PositionForeignKey1793059201000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
      ALTER TABLE join_requests DROP CONSTRAINT "join_requests_positionId_fkey";
      ALTER TABLE join_requests DROP CONSTRAINT "join_requests_positionId_matchId_fkey";
      ALTER TABLE join_requests ADD CONSTRAINT "join_requests_positionId_matchId_fkey"
        FOREIGN KEY ("positionId", "matchId") REFERENCES match_positions(id, "matchId") ON DELETE RESTRICT;
    `);
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`
      ALTER TABLE join_requests DROP CONSTRAINT "join_requests_positionId_matchId_fkey";
      ALTER TABLE join_requests ADD CONSTRAINT "join_requests_positionId_fkey"
        FOREIGN KEY ("positionId") REFERENCES match_positions(id) ON DELETE RESTRICT;
      ALTER TABLE join_requests ADD CONSTRAINT "join_requests_positionId_matchId_fkey"
        FOREIGN KEY ("positionId", "matchId") REFERENCES match_positions(id, "matchId");
    `);
  }
}
