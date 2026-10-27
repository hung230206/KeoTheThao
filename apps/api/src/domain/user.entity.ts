import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

@Entity("users")
@Unique("users_email_key", ["email"])
@Check("users_email_check", "email = lower(email)")
export class User {
  @PrimaryGeneratedColumn("uuid", { primaryKeyConstraintName: "users_pkey" })
  id: string;
  @Column({ length: 254 }) email: string;
  @Column({ select: false }) passwordHash: string;
  @Column({ length: 80 }) name: string;
  @Column({ length: 80, default: "TP. Hồ Chí Minh" }) city: string;
  @Column({ length: 500, default: "" }) bio: string;
  @Column({ type: "simple-array", default: "" }) sports: string[];
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}
