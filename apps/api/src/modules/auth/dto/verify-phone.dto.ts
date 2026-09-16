import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class VerifyPhoneDto {
  @IsNotEmpty({ message: "Số điện thoại không được để trống" })
  @IsString({ message: "Số điện thoại phải là chuỗi" })
  phoneNumber: string;

  @IsNotEmpty({ message: "Mã xác thực không được để trống" })
  @IsString({ message: "Mã xác thực phải là chuỗi" })
  @Length(4, 8, { message: "Mã xác thực từ 4 đến 8 ký tự" })
  @Matches(/^[0-9]+$/, { message: "Mã xác thực chỉ gồm các chữ số" })
  code: string;
}
