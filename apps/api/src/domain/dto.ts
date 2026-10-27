import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { LEVELS, SPORTS, type Level, type Sport } from "./constants";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;
  @IsString() @MinLength(8) @MaxLength(128) password: string;
}
export class RegisterDto extends LoginDto {
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) name: string;
}
export class ProfileDto {
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) name: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) city: string;
  @Transform(trim) @IsString() @MaxLength(500) bio: string;
  @IsArray()
  @ArrayMaxSize(6)
  @ArrayUnique()
  @IsIn(SPORTS, { each: true })
  sports: Sport[];
}
export class PositionDto {
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(60) name: string;
  @IsInt() @Min(1) @Max(99) quantity: number;
}
export class MatchDto {
  @Transform(trim) @IsString() @MinLength(5) @MaxLength(120) title: string;
  @IsIn(SPORTS) sport: Sport;
  @IsIn(LEVELS) level: Level;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) city: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) district: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(160) venue: string;
  @Transform(trim) @IsString() @MinLength(5) @MaxLength(240) address: string;
  @IsISO8601({ strict: true }) startsAt: string;
  @IsInt() @Min(30) @Max(360) durationMinutes: number;
  @IsInt() @Min(2) @Max(100) capacity: number;
  @IsInt() @Min(0) @Max(10000000) fee: number;
  @Transform(trim) @IsString() @MaxLength(3000) description: string;
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PositionDto)
  positions: PositionDto[];
}
export class EditMatchDto {
  @Transform(trim) @IsString() @MinLength(5) @MaxLength(120) title: string;
  @IsIn(LEVELS) level: Level;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) city: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) district: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(160) venue: string;
  @Transform(trim) @IsString() @MinLength(5) @MaxLength(240) address: string;
  @IsISO8601({ strict: true }) startsAt: string;
  @IsInt() @Min(30) @Max(360) durationMinutes: number;
  @IsInt() @Min(0) @Max(10000000) fee: number;
  @Transform(trim) @IsString() @MaxLength(3000) description: string;
}
export class JoinDto {
  @IsOptional() @IsUUID() positionId?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(500) message?: string;
}
export class DecisionDto {
  @IsIn(["accepted", "rejected"]) status: "accepted" | "rejected";
}
export class StatusDto {
  @IsIn(["cancelled", "completed"]) status: "cancelled" | "completed";
}
export class ListMatchesDto {
  @IsOptional() @IsIn(SPORTS) sport?: Sport;
  @IsOptional() @IsIn(LEVELS) level?: Level;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) city?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) q?: string;
  @IsOptional() @IsISO8601({ strict: true }) from?: string;
  @IsOptional() @IsISO8601({ strict: true }) to?: string;
  @IsOptional() @IsIn(["true", "false"]) available?: string;
  @IsOptional() @IsIn(["soonest", "newest", "fee"]) sort?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(30) limit = 12;
}
