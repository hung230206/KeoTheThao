import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";
import type { Level, MatchStatus, Sport } from "./constants";

@Entity("matches")
@Index("matches_status_starts_at", ["status", "startsAt"])
@Index("matches_host", ["hostId"])
@Check(
  "matches_sport_check",
  "sport IN ('football','badminton','basketball','volleyball','tennis','pickleball')",
)
@Check(
  "matches_level_check",
  "level IN ('all','beginner','intermediate','advanced')",
)
@Check("matches_status_check", "status IN ('open','cancelled','completed')")
@Check("matches_capacity_check", "capacity BETWEEN 2 AND 100")
@Check("matches_durationMinutes_check", '"durationMinutes" BETWEEN 30 AND 360')
@Check("matches_fee_check", "fee BETWEEN 0 AND 10000000")
export class Match {
  @PrimaryGeneratedColumn("uuid", { primaryKeyConstraintName: "matches_pkey" })
  id: string;
  @Column({ type: "uuid" }) hostId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "hostId",
    foreignKeyConstraintName: "matches_hostId_fkey",
  })
  host: User;
  @Column({ length: 120 }) title: string;
  @Column({ type: "varchar", length: 20 }) sport: Sport;
  @Column({ type: "varchar", length: 20, default: "all" }) level: Level;
  @Column({ length: 80 }) city: string;
  @Column({ length: 80 }) district: string;
  @Column({ length: 160 }) venue: string;
  @Column({ length: 240 }) address: string;
  @Column({ type: "timestamptz" }) startsAt: Date;
  @Column({ type: "integer" }) durationMinutes: number;
  @Column({ type: "integer" }) capacity: number;
  @Column({ type: "integer", default: 0 }) fee: number;
  @Column({ type: "text", default: "" }) description: string;
  @Column({ type: "varchar", length: 20, default: "open" }) status: MatchStatus;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}
