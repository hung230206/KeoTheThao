import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Match } from "./match.entity";
import { User } from "./user.entity";
import { MatchPositionRequirement } from "./match-position-requirement.entity";
import type { RequestStatus } from "./constants";

@Entity("join_requests")
@Unique("join_requests_matchId_userId_key", ["matchId", "userId"])
@Index("requests_match_status", ["matchId", "status"])
@Index("requests_user", ["userId"])
@Check(
  "join_requests_status_check",
  "status IN ('pending','accepted','rejected','cancelled')",
)
export class JoinRequest {
  @PrimaryGeneratedColumn("uuid", {
    primaryKeyConstraintName: "join_requests_pkey",
  })
  id: string;
  @Column({ type: "uuid" }) matchId: string;
  @ManyToOne(() => Match, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "matchId",
    foreignKeyConstraintName: "join_requests_matchId_fkey",
  })
  match: Match;
  @Column({ type: "uuid" }) userId: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "userId",
    foreignKeyConstraintName: "join_requests_userId_fkey",
  })
  user: User;
  @Column({ type: "uuid", nullable: true }) positionId: string | null;
  @ManyToOne(() => MatchPositionRequirement, {
    onDelete: "RESTRICT",
    nullable: true,
  })
  @JoinColumn([
    {
      name: "positionId",
      referencedColumnName: "id",
      foreignKeyConstraintName: "join_requests_positionId_matchId_fkey",
    },
    {
      name: "matchId",
      referencedColumnName: "matchId",
      foreignKeyConstraintName: "join_requests_positionId_matchId_fkey",
    },
  ])
  position: MatchPositionRequirement | null;
  @Column({ type: "varchar", length: 20, default: "pending" })
  status: RequestStatus;
  @Column({ length: 500, default: "" }) message: string;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
}
