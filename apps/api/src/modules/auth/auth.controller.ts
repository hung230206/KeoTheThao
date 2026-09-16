import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { PasswordResetConfirmDto } from "./dto/password-reset-confirm.dto";
import { PasswordResetRequestDto } from "./dto/password-reset-request.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { VerifyPhoneDto } from "./dto/verify-phone.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      success: true,
      ...result
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      success: true,
      message: "Đăng nhập thành công",
      data: result
    };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout() {
    return {
      success: true,
      message: "Đăng xuất thành công"
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("verify")
  async verifyPhone(@Body() dto: VerifyPhoneDto) {
    const result = await this.authService.verifyPhone(dto);
    return {
      success: true,
      ...result
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("verify/resend")
  async resendVerification(@Body() dto: ResendVerificationDto) {
    const result = await this.authService.resendVerificationCode(dto);
    return {
      success: true,
      ...result
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("password-reset/request")
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    const result = await this.authService.requestPasswordReset(dto);
    return {
      success: true,
      ...result
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("password-reset/confirm")
  async confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
    const result = await this.authService.confirmPasswordReset(dto);
    return {
      success: true,
      ...result
    };
  }
}
