import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { CurrentUserPayload } from "../../../common/decorators/current-user.decorator";

export interface JwtPayload {
  sub: string;
  phoneNumber: string;
  role: string;
  verificationStatus: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        "JWT_SECRET",
        "keo-the-thao-jwt-secret-key-fallback"
      )
    });
  }

  validate(payload: JwtPayload): CurrentUserPayload {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException("Token không hợp lệ");
    }

    return {
      userId: payload.sub,
      phoneNumber: payload.phoneNumber,
      role: payload.role,
      verificationStatus: payload.verificationStatus
    };
  }
}
