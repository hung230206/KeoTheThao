import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { typeOrmModuleOptions } from "./database/typeorm.config";
import { JwtModule } from "@nestjs/jwt";
import { User } from "./domain/user.entity";
import { Match } from "./domain/match.entity";
import { JoinRequest } from "./domain/join-request.entity";
import { MatchPositionRequirement } from "./domain/match-position-requirement.entity";
import { AuthService } from "./auth/auth.service";
import { AuthGuard } from "./auth/auth";
import { AuthController } from "./auth/auth.controller";
import { MatchesController } from "./matches/matches.controller";
import { MatchesService } from "./matches/matches.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32)
          throw new Error(
            "JWT_SECRET must contain at least 32 characters. Run npm run setup.",
          );
        return { secret, signOptions: { expiresIn: "1d", algorithm: "HS256" } };
      },
    }),
    TypeOrmModule.forFeature([
      User,
      Match,
      JoinRequest,
      MatchPositionRequirement,
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmModuleOptions,
    }),
  ],
  controllers: [AppController, AuthController, MatchesController],
  providers: [AppService, AuthService, AuthGuard, MatchesService],
})
export class AppModule {}
