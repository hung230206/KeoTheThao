import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { LoginDto, ProfileDto, RegisterDto } from "../domain/dto";
import { AuthGuard, CurrentUser } from "./auth";
import { AuthService } from "./auth.service";

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.register(dto);
    response.cookie("kt_session", session.token, {
      ...cookieOptions(),
      maxAge: 86400000,
    });
    return session.user;
  }
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.login(dto);
    response.cookie("kt_session", session.token, {
      ...cookieOptions(),
      maxAge: 86400000,
    });
    return session.user;
  }
  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("kt_session", cookieOptions());
    return { message: "Đã đăng xuất." };
  }
  @Get("me")
  @UseGuards(AuthGuard)
  me(@CurrentUser() id: string) {
    return this.auth.me(id);
  }
  @Patch("me")
  @UseGuards(AuthGuard)
  profile(@CurrentUser() id: string, @Body() dto: ProfileDto) {
    return this.auth.profile(id, dto);
  }
}
