import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@CurrentUser("userId") userId: string) {
    const data = await this.usersService.findMe(userId);
    return {
      success: true,
      data
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  async updateMe(
    @CurrentUser("userId") userId: string,
    @Body() dto: UpdateProfileDto
  ) {
    const data = await this.usersService.updateMe(userId, dto);
    return {
      success: true,
      message: "Cập nhật thông tin thành công",
      data
    };
  }

  @Get(":id")
  async getPublicProfile(@Param("id") id: string) {
    const data = await this.usersService.findPublicById(id);
    return {
      success: true,
      data
    };
  }

  @Get(":id/reviews")
  async getUserReviews(@Param("id") id: string) {
    // Sẽ được tích hợp với Review Module (M1.10)
    await this.usersService.findPublicById(id);
    return {
      success: true,
      data: []
    };
  }
}
