import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsNotEmpty({ message: "Số điện thoại không được để trống" })
  @IsString({ message: "Số điện thoại phải là chuỗi" })
  phoneNumber: string;

  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @IsString({ message: "Mật khẩu phải là chuỗi" })
  password: string;
}
