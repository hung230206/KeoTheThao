import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import { User } from "../domain/user.entity";
import { Match } from "../domain/match.entity";
import { JoinRequest } from "../domain/join-request.entity";
import { MatchPositionRequirement } from "../domain/match-position-requirement.entity";
import { EditMatchDto, JoinDto, ListMatchesDto, MatchDto } from "../domain/dto";

const publicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  city: user.city,
  sports: user.sports,
});

@Injectable()
export class MatchesService {
  constructor(private readonly db: DataSource) {}

  private async cards(matches: Match[], manager = this.db.manager) {
    if (!matches.length) return [];
    const ids = matches.map((m) => m.id);
    const [positions, accepted] = await Promise.all([
      manager.find(MatchPositionRequirement, {
        where: { matchId: In(ids) },
        order: { name: "ASC" },
      }),
      manager.find(JoinRequest, {
        where: { matchId: In(ids), status: "accepted" },
        relations: { user: true },
        order: { createdAt: "ASC" },
      }),
    ]);
    return matches.map((match) => {
      const members = accepted.filter((r) => r.matchId === match.id);
      const playerCount = members.length + 1;
      return {
        ...match,
        host: publicUser(match.host),
        playerCount,
        spotsLeft: Math.max(0, match.capacity - playerCount),
        positions: positions
          .filter((p) => p.matchId === match.id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            filled: members.filter((r) => r.positionId === p.id).length,
          })),
        participants: [
          publicUser(match.host),
          ...members.map((r) => publicUser(r.user)),
        ],
      };
    });
  }
  async list(query: ListMatchesDto) {
    const qb = this.db
      .getRepository(Match)
      .createQueryBuilder("m")
      .leftJoinAndSelect("m.host", "host")
      .where("m.status = :status", { status: "open" })
      .andWhere("m.startsAt > :now", { now: new Date() });
    if (query.sport) qb.andWhere("m.sport = :sport", { sport: query.sport });
    if (query.level) qb.andWhere("m.level = :level", { level: query.level });
    if (query.city) qb.andWhere("m.city = :city", { city: query.city });
    if (query.q)
      qb.andWhere(
        "(m.title ILIKE :q OR m.venue ILIKE :q OR m.district ILIKE :q OR m.address ILIKE :q)",
        { q: `%${query.q.replace(/[%_\\]/g, "\\$&")}%` },
      );
    if (query.from) qb.andWhere("m.startsAt >= :from", { from: query.from });
    if (query.to) qb.andWhere("m.startsAt <= :to", { to: query.to });
    if (query.available === "true")
      qb.andWhere(
        `m.capacity > 1 + (SELECT COUNT(*) FROM join_requests j WHERE j."matchId" = m.id AND j.status = 'accepted')`,
      );
    const sort =
      query.sort === "newest"
        ? "m.createdAt"
        : query.sort === "fee"
          ? "m.fee"
          : "m.startsAt";
    const [matches, total] = await qb
      .orderBy(sort, query.sort === "newest" ? "DESC" : "ASC")
      .addOrderBy("m.id", "ASC")
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      items: await this.cards(matches),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
  async detail(id: string) {
    const match = await this.db.manager.findOne(Match, {
      where: { id },
      relations: { host: true },
    });
    if (!match) throw new NotFoundException("Không tìm thấy kèo.");
    return (await this.cards([match]))[0];
  }
  private future(startsAt: string) {
    if (new Date(startsAt).getTime() <= Date.now())
      throw new BadRequestException("Thời gian bắt đầu phải ở tương lai.");
  }
  private assertOpen(match: Match) {
    if (match.status !== "open" || match.startsAt.getTime() <= Date.now())
      throw new ConflictException("Kèo đã đóng hoặc đã bắt đầu.");
  }
  private async locked(manager: EntityManager, id: string) {
    const match = await manager.findOne(Match, {
      where: { id },
      lock: { mode: "pessimistic_write" },
    });
    if (!match) throw new NotFoundException("Không tìm thấy kèo.");
    return match;
  }
  private owner(match: Match, userId: string) {
    if (match.hostId !== userId)
      throw new ForbiddenException("Chỉ chủ kèo được thực hiện thao tác này.");
  }
  async create(userId: string, dto: MatchDto) {
    this.future(dto.startsAt);
    if (
      dto.positions.reduce((sum, p) => sum + p.quantity, 0) >
      dto.capacity - 1
    )
      throw new BadRequestException(
        "Số vị trí tuyển không được vượt số chỗ, đã tính một suất chủ kèo.",
      );
    if (
      new Set(dto.positions.map((p) => p.name.toLocaleLowerCase("vi"))).size !==
      dto.positions.length
    )
      throw new BadRequestException("Tên vị trí không được trùng nhau.");
    const id = await this.db.transaction(async (manager) => {
      const { positions, ...data } = dto;
      const match = await manager.save(
        Match,
        manager.create(Match, {
          ...data,
          startsAt: new Date(data.startsAt),
          hostId: userId,
        }),
      );
      if (positions.length)
        await manager.save(
          MatchPositionRequirement,
          positions.map((p) =>
            manager.create(MatchPositionRequirement, {
              ...p,
              matchId: match.id,
            }),
          ),
        );
      return match.id;
    });
    return this.detail(id);
  }
  async edit(id: string, userId: string, dto: EditMatchDto) {
    this.future(dto.startsAt);
    await this.db.transaction(async (manager) => {
      const match = await this.locked(manager, id);
      this.owner(match, userId);
      this.assertOpen(match);
      await manager.update(Match, id, {
        ...dto,
        startsAt: new Date(dto.startsAt),
      });
    });
    return this.detail(id);
  }
  async status(id: string, userId: string, status: "completed" | "cancelled") {
    await this.db.transaction(async (manager) => {
      const match = await this.locked(manager, id);
      this.owner(match, userId);
      if (match.status !== "open")
        throw new ConflictException("Kèo đã được đóng.");
      if (status === "completed" && match.startsAt.getTime() > Date.now())
        throw new BadRequestException("Chỉ hoàn thành kèo sau giờ bắt đầu.");
      await manager.update(Match, id, { status });
      await manager.update(
        JoinRequest,
        { matchId: id, status: "pending" },
        { status: "cancelled" },
      );
    });
    return this.detail(id);
  }
  private async checkSpace(
    manager: EntityManager,
    match: Match,
    positionId: string | null,
    approving = false,
  ) {
    const accepted = await manager.findBy(JoinRequest, {
      matchId: match.id,
      status: "accepted",
    });
    if (accepted.length + 1 >= match.capacity)
      throw new ConflictException("Kèo đã đủ người.");
    if (positionId) {
      const position = await manager.findOneBy(MatchPositionRequirement, {
        id: positionId,
        matchId: match.id,
      });
      if (!position)
        throw new BadRequestException("Vị trí không thuộc kèo này.");
      if (
        accepted.filter((r) => r.positionId === positionId).length >=
        position.quantity
      )
        throw new ConflictException("Vị trí này đã đủ người.");
    }
    // Unspecified positions may only occupy the unallocated portion of the roster.
    if (!positionId && approving) {
      const positions = await manager.findBy(MatchPositionRequirement, {
        matchId: match.id,
      });
      const generalSlots =
        match.capacity - 1 - positions.reduce((sum, p) => sum + p.quantity, 0);
      if (accepted.filter((r) => !r.positionId).length >= generalSlots)
        throw new ConflictException(
          "Các suất còn lại dành cho vị trí đang tuyển.",
        );
    }
  }
  async join(id: string, userId: string, dto: JoinDto) {
    return this.db.transaction(async (manager) => {
      const match = await this.locked(manager, id);
      this.assertOpen(match);
      if (match.hostId === userId)
        throw new BadRequestException(
          "Bạn là chủ kèo và đã có trong đội hình.",
        );
      await this.checkSpace(manager, match, dto.positionId ?? null, true);
      const existing = await manager.findOneBy(JoinRequest, {
        matchId: id,
        userId,
      });
      if (existing && ["pending", "accepted"].includes(existing.status))
        throw new ConflictException("Bạn đã gửi yêu cầu hoặc đã tham gia kèo.");
      return manager.save(
        JoinRequest,
        manager.create(JoinRequest, {
          ...(existing ?? {}),
          matchId: id,
          userId,
          positionId: dto.positionId ?? null,
          message: dto.message ?? "",
          status: "pending",
        }),
      );
    });
  }
  async withdraw(id: string, userId: string) {
    return this.db.transaction(async (manager) => {
      const match = await this.locked(manager, id);
      this.assertOpen(match);
      const request = await manager.findOneBy(JoinRequest, {
        matchId: id,
        userId,
      });
      if (!request || !["pending", "accepted"].includes(request.status))
        throw new ConflictException(
          "Không có yêu cầu hay suất tham gia để hủy.",
        );
      request.status = "cancelled";
      return manager.save(request);
    });
  }
  async requests(id: string, userId: string) {
    const match = await this.db.manager.findOneBy(Match, { id });
    if (!match) throw new NotFoundException("Không tìm thấy kèo.");
    this.owner(match, userId);
    const requests = await this.db.manager.find(JoinRequest, {
      where: { matchId: id },
      relations: { user: true, position: true },
      order: { createdAt: "ASC" },
    });
    return requests.map((r) => ({
      ...r,
      user: publicUser(r.user),
      position: r.position
        ? { id: r.position.id, name: r.position.name }
        : null,
    }));
  }
  async decide(
    id: string,
    requestId: string,
    userId: string,
    status: "accepted" | "rejected",
  ) {
    return this.db.transaction(async (manager) => {
      const match = await this.locked(manager, id);
      this.owner(match, userId);
      this.assertOpen(match);
      const request = await manager.findOneBy(JoinRequest, {
        id: requestId,
        matchId: id,
      });
      if (!request) throw new NotFoundException("Không tìm thấy yêu cầu.");
      if (request.status !== "pending")
        throw new ConflictException("Yêu cầu đã được xử lý.");
      if (status === "accepted")
        await this.checkSpace(manager, match, request.positionId, true);
      request.status = status;
      return manager.save(request);
    });
  }
  async mine(userId: string) {
    const [hosted, requests] = await Promise.all([
      this.db.manager.find(Match, {
        where: { hostId: userId },
        relations: { host: true },
        order: { startsAt: "DESC" },
      }),
      this.db.manager.find(JoinRequest, {
        where: { userId },
        relations: { match: { host: true }, position: true },
        order: { updatedAt: "DESC" },
      }),
    ]);
    const hostedCards = await this.cards(hosted);
    const joinedCards = await this.cards(requests.map((r) => r.match));
    const pending = hosted.length
      ? await this.db.manager.findBy(JoinRequest, {
          matchId: In(hosted.map((m) => m.id)),
          status: "pending",
        })
      : [];
    return {
      hosted: hostedCards.map((m) => ({
        ...m,
        pendingCount: pending.filter((r) => r.matchId === m.id).length,
      })),
      requests: requests.map((r, index) => ({
        id: r.id,
        status: r.status,
        message: r.message,
        positionId: r.positionId,
        position: r.position?.name ?? null,
        match: joinedCards[index],
      })),
    };
  }
}
