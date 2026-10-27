import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard, CurrentUser } from "../auth/auth";
import {
  DecisionDto,
  EditMatchDto,
  JoinDto,
  ListMatchesDto,
  MatchDto,
  StatusDto,
} from "../domain/dto";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}
  @Get() list(@Query() query: ListMatchesDto) {
    return this.matches.list(query);
  }
  @Get("mine") @UseGuards(AuthGuard) mine(@CurrentUser() userId: string) {
    return this.matches.mine(userId);
  }
  @Get(":id") detail(@Param("id", ParseUUIDPipe) id: string) {
    return this.matches.detail(id);
  }
  @Post() @UseGuards(AuthGuard) create(
    @CurrentUser() userId: string,
    @Body() dto: MatchDto,
  ) {
    return this.matches.create(userId, dto);
  }
  @Patch(":id") @UseGuards(AuthGuard) edit(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
    @Body() dto: EditMatchDto,
  ) {
    return this.matches.edit(id, userId, dto);
  }
  @Patch(":id/status") @UseGuards(AuthGuard) status(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
    @Body() dto: StatusDto,
  ) {
    return this.matches.status(id, userId, dto.status);
  }
  @Post(":id/requests") @UseGuards(AuthGuard) join(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
    @Body() dto: JoinDto,
  ) {
    return this.matches.join(id, userId, dto);
  }
  @Delete(":id/requests/me") @UseGuards(AuthGuard) withdraw(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ) {
    return this.matches.withdraw(id, userId);
  }
  @Get(":id/requests") @UseGuards(AuthGuard) requests(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ) {
    return this.matches.requests(id, userId);
  }
  @Patch(":id/requests/:requestId") @UseGuards(AuthGuard) decide(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("requestId", ParseUUIDPipe) requestId: string,
    @CurrentUser() userId: string,
    @Body() dto: DecisionDto,
  ) {
    return this.matches.decide(id, requestId, userId, dto.status);
  }
}
