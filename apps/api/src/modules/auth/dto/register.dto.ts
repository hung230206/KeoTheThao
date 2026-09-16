import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches
} from "class-validator";
import { Gender, PlayerPosition, UserRole } from "../../../common/enums";

export class RegisterDto {
  @IsNotEmpty({ message: "Số điện thoại không được để trống" })
  @IsString({ message: "Số điện thoại phải là chuỗi" })
  @Matches(/^[0-9+]{9,15}$/, {
    message: "Số điện thoại không hợp lệ (chỉ gồm chữ số, 9-15 ký tự)"
  })
  phoneNumber: string;

  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @IsString({ message: "Mật khẩu phải là chuỗi" })
  @Length(6, 100, { message: "Mật khẩu phải có từ 6 đến 100 ký tự" })
  password: string;

  @IsNotEmpty({ message: "Họ và tên không được để trống" })
  @IsString({ message: "Họ và tên phải là chuỗi" })
  @Length(2, 100, { message: "Họ và tên phải từ 2 đến 100 ký tự" })
  fullName: string;

  @IsOptional()
  @IsIn([UserRole.PLAYER, UserRole.FIELD_OWNER], {
    message: "Vai trò chỉ có thể là PLAYER hoặc FIELD_OWNER"
  })
  role?: UserRole.PLAYER | UserRole.FIELD_OWNER;

  @IsOptional()
  @IsEnum(Gender, { message: "Giới tính không hợp lệ (MALE, FEMALE, OTHER)" })
  gender?: Gender;

  @IsOptional()
  @IsString({ message: "Ngày sinh phải là chuỗi ngày (YYYY-MM-DD)" })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(PlayerPosition, {
    message: "Vị trí thi đấu không hợp lệ (GK, DF, MF, FW)"
  })
  preferredPosition?: PlayerPosition;

  @IsOptional()
  @IsString({ message: "Tiểu sử phải là chuỗi" })
  @Length(0, 500, { message: "Tiểu sử tối đa 500 ký tự" })
  bio?: string;
}
