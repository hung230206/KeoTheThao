import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

export interface AuthRequest extends Request {
  userId: string;
}
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthRequest>().userId,
);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const cookie = request.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("kt_session="))
      ?.slice("kt_session=".length);
    const bearer = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(
        bearer ?? cookie ?? "",
        { algorithms: ["HS256"] },
      );
      if (!payload.sub || typeof payload.sub !== "string")
        throw new Error("Invalid session");
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException("Vui lòng đăng nhập để tiếp tục.");
    }
  }
}
