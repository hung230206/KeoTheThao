import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { QueryFailedError, Repository } from "typeorm";
import { User } from "../domain/user.entity";
import { LoginDto, ProfileDto, RegisterDto } from "../domain/dto";
import { hashPassword, verifyPassword } from "./password";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    const user = this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash: await hashPassword(dto.password),
      sports: [],
    });
    try {
      await this.users.save(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === "23505"
      )
        throw new ConflictException("Email này đã được đăng ký.");
      throw error;
    }
    return this.session(user);
  }
  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email: dto.email })
      .getOne();
    // Use the same expensive operation for unknown accounts to avoid a cheap email timing probe.
    const valid = user
      ? await verifyPassword(dto.password, user.passwordHash)
      : (await hashPassword(dto.password), false);
    if (!user || !valid)
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng.");
    return this.session(user);
  }
  private async session(user: User) {
    return {
      token: await this.jwt.signAsync({ sub: user.id }),
      user: this.safe(user),
    };
  }
  private safe(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      city: user.city,
      bio: user.bio,
      sports: user.sports,
      createdAt: user.createdAt,
    };
  }
  async me(id: string) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException("Tài khoản không còn tồn tại.");
    return this.safe(user);
  }
  async profile(id: string, dto: ProfileDto) {
    if (!(await this.users.update(id, dto)).affected)
      throw new NotFoundException("Tài khoản không còn tồn tại.");
    return this.me(id);
  }
}
