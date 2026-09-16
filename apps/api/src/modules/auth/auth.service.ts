import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { IsNull, Repository } from "typeorm";
import {
  AccountStatus,
  UserRole,
  VerificationPurpose,
  VerificationStatus
} from "../../common/enums";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { PasswordResetConfirmDto } from "./dto/password-reset-confirm.dto";
import { PasswordResetRequestDto } from "./dto/password-reset-request.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { VerifyPhoneDto } from "./dto/verify-phone.dto";
import { VerificationCode } from "./entities/verification-code.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {}

  private generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { phoneNumber: dto.phoneNumber.trim() }
    });
    if (existing) {
      throw new ConflictException("Số điện thoại này đã được đăng ký");
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = this.userRepository.create({
      phoneNumber: dto.phoneNumber.trim(),
      passwordHash,
      fullName: dto.fullName.trim(),
      role: dto.role ?? UserRole.PLAYER,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth,
      preferredPosition: dto.preferredPosition,
      bio: dto.bio?.trim(),
      accountStatus: AccountStatus.ACTIVE,
      verificationStatus: VerificationStatus.UNVERIFIED
    });

    const savedUser = await this.userRepository.save(user);

    // Tạo mã xác thực ban đầu (PHONE_VERIFICATION)
    const rawCode = this.generateSixDigitCode();
    const codeHash = await bcrypt.hash(rawCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    const verificationCode = this.verificationCodeRepository.create({
      userId: savedUser.userId,
      codeHash,
      purpose: VerificationPurpose.PHONE_VERIFICATION,
      expiresAt,
      attemptCount: 0
    });
    await this.verificationCodeRepository.save(verificationCode);

    return {
      message: "Đăng ký tài khoản thành công",
      user: this.usersService.sanitizeUser(savedUser),
      // Cung cấp mã xác thực trong response để test nhanh mà không cần SMS Gateway thực tế
      verificationCode: rawCode
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { phoneNumber: dto.phoneNumber.trim() }
    });

    if (!user) {
      throw new UnauthorizedException("Số điện thoại hoặc mật khẩu không đúng");
    }

    if (user.accountStatus === AccountStatus.BLOCKED) {
      throw new ForbiddenException("Tài khoản đã bị khóa do vi phạm chính sách");
    }

    if (user.accountStatus === AccountStatus.DELETED) {
      throw new UnauthorizedException("Tài khoản không tồn tại hoặc đã bị xóa");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Số điện thoại hoặc mật khẩu không đúng");
    }

    const payload = {
      sub: user.userId,
      phoneNumber: user.phoneNumber,
      role: user.role,
      verificationStatus: user.verificationStatus
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.usersService.sanitizeUser(user)
    };
  }

  async verifyPhone(dto: VerifyPhoneDto) {
    const user = await this.userRepository.findOne({
      where: { phoneNumber: dto.phoneNumber.trim() }
    });

    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng với số điện thoại này");
    }

    if (user.verificationStatus === VerificationStatus.VERIFIED) {
      throw new BadRequestException("Tài khoản đã được xác thực trước đó");
    }

    const codes = await this.verificationCodeRepository.find({
      where: {
        userId: user.userId,
        purpose: VerificationPurpose.PHONE_VERIFICATION
      },
      order: { createdAt: "DESC" }
    });

    const activeCode = codes.find(
      (c) => c.usedAt === null && new Date(c.expiresAt).getTime() > Date.now()
    );

    if (!activeCode) {
      throw new BadRequestException(
        "Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới."
      );
    }

    if (activeCode.attemptCount >= 5) {
      throw new BadRequestException(
        "Mã xác thực đã vượt quá số lần thử (5 lần). Vui lòng yêu cầu gửi lại mã mới."
      );
    }

    const isMatch = await bcrypt.compare(dto.code.trim(), activeCode.codeHash);
    if (!isMatch) {
      activeCode.attemptCount += 1;
      await this.verificationCodeRepository.save(activeCode);
      throw new BadRequestException("Mã xác thực không chính xác");
    }

    activeCode.usedAt = new Date();
    await this.verificationCodeRepository.save(activeCode);

    user.verificationStatus = VerificationStatus.VERIFIED;
    const updatedUser = await this.userRepository.save(user);

    return {
      message: "Xác thực số điện thoại thành công",
      user: this.usersService.sanitizeUser(updatedUser)
    };
  }

  async resendVerificationCode(dto: ResendVerificationDto) {
    const user = await this.userRepository.findOne({
      where: { phoneNumber: dto.phoneNumber.trim() }
    });

    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    if (user.verificationStatus === VerificationStatus.VERIFIED) {
      throw new BadRequestException("Tài khoản đã được xác thực trước đó");
    }

    await this.verificationCodeRepository.update(
      {
        userId: user.userId,
        purpose: VerificationPurpose.PHONE_VERIFICATION,
        usedAt: IsNull()
      },
      { usedAt: new Date() }
    );

    const rawCode = this.generateSixDigitCode();
    const codeHash = await bcrypt.hash(rawCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const verificationCode = this.verificationCodeRepository.create({
      userId: user.userId,
      codeHash,
      purpose: VerificationPurpose.PHONE_VERIFICATION,
      expiresAt,
      attemptCount: 0
    });
    await this.verificationCodeRepository.save(verificationCode);

    return {
      message: "Đã gửi lại mã xác thực mới",
      verificationCode: rawCode
    };
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const user = await this.userRepository.findOne({
      where: { phoneNumber: dto.phoneNumber.trim() }
    });

    if (!user) {
      throw new NotFoundException("Số điện thoại chưa được đăng ký trong hệ thống");
    }

    if (user.accountStatus === AccountStatus.BLOCKED) {
      throw new ForbiddenException("Tài khoản đã bị khóa, không thể đặt lại mật khẩu");
    }

    const rawCode = this.generateSixDigitCode();
    const codeHash = await bcrypt.hash(rawCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const verificationCode = this.verificationCodeRepository.create({
      userId: user.userId,
      codeHash,
      purpose: VerificationPurpose.PASSWORD_RESET,
      expiresAt,
      attemptCount: 0
    });
    await this.verificationCodeRepository.save(verificationCode);

    return {
      message: "Mã đặt lại mật khẩu đã được tạo thành công",
      verificationCode: rawCode
    };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto) {
    const user = await this.userRepository.findOne({
      where: { phoneNumber: dto.phoneNumber.trim() }
    });

    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng với số điện thoại này");
    }

    const codes = await this.verificationCodeRepository.find({
      where: {
        userId: user.userId,
        purpose: VerificationPurpose.PASSWORD_RESET
      },
      order: { createdAt: "DESC" }
    });

    const activeCode = codes.find(
      (c) => c.usedAt === null && new Date(c.expiresAt).getTime() > Date.now()
    );

    if (!activeCode) {
      throw new BadRequestException(
        "Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu lại."
      );
    }

    if (activeCode.attemptCount >= 5) {
      throw new BadRequestException(
        "Mã xác thực đã vượt quá số lần thử tối đa. Vui lòng yêu cầu lại."
      );
    }

    const isMatch = await bcrypt.compare(dto.code.trim(), activeCode.codeHash);
    if (!isMatch) {
      activeCode.attemptCount += 1;
      await this.verificationCodeRepository.save(activeCode);
      throw new BadRequestException("Mã xác thực không chính xác");
    }

    activeCode.usedAt = new Date();
    await this.verificationCodeRepository.save(activeCode);

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);

    return {
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới."
    };
  }
}
