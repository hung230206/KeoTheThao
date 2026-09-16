import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import {
  AccountStatus,
  Gender,
  PlayerPosition,
  UserRole,
  VerificationStatus
} from "../../../common/enums";
import { VerificationCode } from "../../auth/entities/verification-code.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ type: "bigint", name: "user_id" })
  userId: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 15, name: "phone_number" })
  phoneNumber: string;

  @Column({ type: "varchar", length: 255, name: "password_hash" })
  passwordHash: string;

  @Column({ type: "varchar", length: 100, name: "full_name" })
  fullName: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  gender: Gender | null;

  @Column({ type: "date", name: "date_of_birth", nullable: true })
  dateOfBirth: string | null;

  @Column({ type: "varchar", length: 255, name: "avatar_url", nullable: true })
  avatarUrl: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  bio: string | null;

  @Column({
    type: "varchar",
    length: 10,
    name: "preferred_position",
    nullable: true
  })
  preferredPosition: PlayerPosition | null;

  @Column({
    type: "varchar",
    length: 20,
    default: UserRole.PLAYER
  })
  role: UserRole;

  @Column({
    type: "varchar",
    length: 20,
    name: "account_status",
    default: AccountStatus.ACTIVE
  })
  accountStatus: AccountStatus;

  @Column({
    type: "varchar",
    length: 20,
    name: "verification_status",
    default: VerificationStatus.UNVERIFIED
  })
  verificationStatus: VerificationStatus;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => VerificationCode, (code) => code.user)
  verificationCodes: VerificationCode[];
}
