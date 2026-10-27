import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Match } from "./match.entity";

@Entity("match_positions")
@Unique("match_positions_id_matchId_key", ["id", "matchId"])
@Index("positions_match", ["matchId"])
@Check("match_positions_quantity_check", "quantity BETWEEN 1 AND 99")
export class MatchPositionRequirement {
  @PrimaryGeneratedColumn("uuid", {
    primaryKeyConstraintName: "match_positions_pkey",
  })
  id: string;
  @Column({ type: "uuid" }) matchId: string;
  @ManyToOne(() => Match, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "matchId",
    foreignKeyConstraintName: "match_positions_matchId_fkey",
  })
  match: Match;
  @Column({ length: 60 }) name: string;
  @Column({ type: "integer" }) quantity: number;
}
