import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class PasswordResetConfirmDto {
  @IsNotEmpty({ message: "Số điện thoại không được để trống" })
  @IsString({ message: "Số điện thoại phải là chuỗi" })
  phoneNumber: string;

  @IsNotEmpty({ message: "Mã xác nhận không được để trống" })
  @IsString({ message: "Mã xác nhận phải là chuỗi" })
  @Length(4, 8, { message: "Mã xác nhận từ 4 đến 8 ký tự" })
  @Matches(/^[0-9]+$/, { message: "Mã xác nhận chỉ gồm các chữ số" })
  code: string;

  @IsNotEmpty({ message: "Mật khẩu mới không được để trống" })
  @IsString({ message: "Mật khẩu mới phải là chuỗi" })
  @Length(6, 100, { message: "Mật khẩu mới phải từ 6 đến 100 ký tự" })
  newPassword: string;
}
