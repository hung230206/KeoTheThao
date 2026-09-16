import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccountStatus } from "../../common/enums";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  sanitizeUser(user: User) {
    const { passwordHash, ...sanitized } = user;
    void passwordHash;
    return sanitized;
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { userId } });
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phoneNumber } });
  }

  async findMe(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }
    if (user.accountStatus === AccountStatus.DELETED) {
      throw new BadRequestException("Tài khoản đã bị xóa");
    }
    return this.sanitizeUser(user);
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new BadRequestException("Tài khoản không ở trạng thái hoạt động");
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName?.trim() ?? user.fullName;
if (dto.gender !== undefined) user.gender = dto.gender;
if (dto.dateOfBirth !== undefined) user.dateOfBirth = dto.dateOfBirth;
if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl?.trim() || null;
if (dto.bio !== undefined) user.bio = dto.bio?.trim() || null;
if (dto.preferredPosition !== undefined)
  user.preferredPosition = dto.preferredPosition;
    const saved = await this.userRepository.save(user);
    return this.sanitizeUser(saved);
  }

  async findPublicById(userId: string) {
    const user = await this.findById(userId);
    if (!user || user.accountStatus === AccountStatus.DELETED) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    return {
      userId: user.userId,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      preferredPosition: user.preferredPosition,
      role: user.role,
      verificationStatus: user.verificationStatus,
      createdAt: user.createdAt
    };
  }
}
