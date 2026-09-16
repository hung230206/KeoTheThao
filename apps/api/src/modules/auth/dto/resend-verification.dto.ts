import { IsNotEmpty, IsString, Matches } from "class-validator";

export class ResendVerificationDto {
  @IsNotEmpty({ message: "Số điện thoại không được để trống" })
  @IsString({ message: "Số điện thoại phải là chuỗi" })
  @Matches(/^[0-9+]{9,15}$/, {
    message: "Số điện thoại không hợp lệ"
  })
  phoneNumber: string;
}
