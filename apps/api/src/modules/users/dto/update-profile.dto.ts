import { IsEnum, IsOptional, IsString, Length } from "class-validator";
import { Gender, PlayerPosition } from "../../../common/enums";

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: "Họ và tên phải là chuỗi" })
  @Length(2, 100, { message: "Họ và tên từ 2 đến 100 ký tự" })
  fullName?: string;

  @IsOptional()
  @IsEnum(Gender, { message: "Giới tính không hợp lệ (MALE, FEMALE, OTHER)" })
  gender?: Gender;

  @IsOptional()
  @IsString({ message: "Ngày sinh phải là chuỗi ngày (YYYY-MM-DD)" })
  dateOfBirth?: string;

  @IsOptional()
  @IsString({ message: "Link ảnh đại diện phải là chuỗi" })
  @Length(0, 255, { message: "Link ảnh đại diện tối đa 255 ký tự" })
  avatarUrl?: string;

  @IsOptional()
  @IsString({ message: "Tiểu sử phải là chuỗi" })
  @Length(0, 500, { message: "Tiểu sử tối đa 500 ký tự" })
  bio?: string;

  @IsOptional()
  @IsEnum(PlayerPosition, {
    message: "Vị trí thi đấu không hợp lệ (GK, DF, MF, FW)"
  })
  preferredPosition?: PlayerPosition;
}
