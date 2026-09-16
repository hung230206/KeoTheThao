import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { VerificationPurpose } from "../../../common/enums";
import { User } from "../../users/entities/user.entity";

@Entity("verification_codes")
export class VerificationCode {
  @PrimaryGeneratedColumn({ type: "bigint", name: "verification_code_id" })
  verificationCodeId: string;

  @Index()
  @Column({ type: "bigint", name: "user_id" })
  userId: string;

  @Column({ type: "varchar", length: 255, name: "code_hash" })
  codeHash: string;

  @Column({ type: "varchar", length: 30 })
  purpose: VerificationPurpose;

  @Index()
  @Column({ type: "timestamp", name: "expires_at" })
  expiresAt: Date;

  @Column({ type: "timestamp", name: "used_at", nullable: true })
  usedAt: Date | null;

  @Column({ type: "smallint", name: "attempt_count", default: 0 })
  attemptCount: number;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.verificationCodes, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "user_id" })
  user: User;
}
