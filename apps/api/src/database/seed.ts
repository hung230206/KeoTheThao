import dataSource from "./data-source";
import { User } from "../domain/user.entity";
import { Match } from "../domain/match.entity";
import { MatchPositionRequirement } from "../domain/match-position-requirement.entity";
import { JoinRequest } from "../domain/join-request.entity";
import { hashPassword } from "../auth/password";
import type { Sport } from "../domain/constants";

async function seed() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seed is disabled in production.");
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      const passwordHash = await hashPassword(
        process.env.SEED_PASSWORD ?? "TeamKeo2026!",
      );
      const users: User[] = [];
      const names = [
        "Minh Anh",
        "Hoàng Nam",
        "Thảo Nguyễn",
        "Đức Huy",
        "Linh Phạm",
        "Tuấn Trần",
        "Mai Chi",
        "Quốc Bảo",
      ];
      for (let i = 0; i < names.length; i++) {
        const email =
          i === 0
            ? "host@keo.local"
            : i === 1
              ? "player@keo.local"
              : `demo${i}@keo.local`;
        let user = await manager.findOneBy(User, { email });
        if (!user)
          user = await manager.save(
            User,
            manager.create(User, {
              email,
              name: names[i],
              passwordHash,
              city: "TP. Hồ Chí Minh",
              sports: ["football", "badminton"],
              bio: "Thích vận động và làm quen đồng đội mới. Hẹn gặp bạn trên sân!",
            }),
          );
        users.push(user);
      }
      const games: {
        title: string;
        sport: Sport;
        venue: string;
        district: string;
        address: string;
        capacity: number;
        fee: number;
        positions: { name: string; quantity: number }[];
      }[] = [
        {
          title: "Tan làm, ra sân! Bóng đá 5 người",
          sport: "football",
          venue: "Sân bóng Thảo Điền",
          district: "TP. Thủ Đức",
          address: "12 Nguyễn Văn Hưởng, Thảo Điền",
          capacity: 10,
          fee: 70000,
          positions: [
            { name: "Thủ môn", quantity: 1 },
            { name: "Cầu thủ", quantity: 8 },
          ],
        },
        {
          title: "Cầu lông giao lưu, đón bạn mới",
          sport: "badminton",
          venue: "CLB cầu lông Phú Thọ",
          district: "Quận 11",
          address: "219 Lý Thường Kiệt, Phường 15",
          capacity: 8,
          fee: 60000,
          positions: [],
        },
        {
          title: "Hoops cuối tuần · 3 đấu 3",
          sport: "basketball",
          venue: "Sân bóng rổ Rạch Miễu",
          district: "Phú Nhuận",
          address: "1 Hoa Phượng, Phường 2",
          capacity: 6,
          fee: 40000,
          positions: [],
        },
        {
          title: "Pickleball buổi sáng cùng hội mình",
          sport: "pickleball",
          venue: "Sân Happy Pickleball",
          district: "Bình Thạnh",
          address: "25 D5, Phường 25",
          capacity: 4,
          fee: 90000,
          positions: [],
        },
        {
          title: "Bóng chuyền vui, ai cũng được chơi",
          sport: "volleyball",
          venue: "Sân thể thao Tân Bình",
          district: "Tân Bình",
          address: "448 Hoàng Văn Thụ, Phường 4",
          capacity: 12,
          fee: 0,
          positions: [
            { name: "Chuyền hai", quantity: 1 },
            { name: "Đồng đội", quantity: 10 },
          ],
        },
        {
          title: "Tennis đôi · Hẹn nhau trên sân",
          sport: "tennis",
          venue: "Sân tennis Gia Định",
          district: "Gò Vấp",
          address: "2 Nguyễn Kiệm, Phường 3",
          capacity: 4,
          fee: 120000,
          positions: [],
        },
        {
          title: "Bóng đá 7 người tối thứ sáu",
          sport: "football",
          venue: "Sân bóng Thành Phát",
          district: "Tân Bình",
          address: "15 Trường Chinh, Phường 12",
          capacity: 14,
          fee: 80000,
          positions: [],
        },
        {
          title: "Cầu lông sau giờ học tại Hà Nội",
          sport: "badminton",
          venue: "Sân Cầu Giấy",
          district: "Cầu Giấy",
          address: "35 Trần Quý Kiên, Dịch Vọng",
          capacity: 6,
          fee: 50000,
          positions: [],
        },
      ];
      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        if (
          await manager.findOneBy(Match, {
            title: game.title,
            hostId: users[0].id,
          })
        )
          continue;
        const startsAt = new Date();
        startsAt.setUTCDate(startsAt.getUTCDate() + 1 + Math.floor(i / 3));
        startsAt.setUTCHours(i === 3 ? 1 : 11 + (i % 3), 0, 0, 0);
        const { positions, ...data } = game;
        const match = await manager.save(
          Match,
          manager.create(Match, {
            ...data,
            hostId: users[0].id,
            city: i === 7 ? "Hà Nội" : "TP. Hồ Chí Minh",
            startsAt,
            durationMinutes: 90,
            level: i === 5 ? "intermediate" : "all",
            description:
              "Kèo giao lưu thân thiện, cùng vận động sau một ngày bận rộn. Đến sớm 10 phút để khởi động nhé. Mang giày phù hợp và nước uống. Chi phí dự kiến chia đều tại sân, chưa thu tiền trên ứng dụng.\n\nDữ liệu minh họa cho môi trường phát triển; không phải lịch đặt sân thật.",
          }),
        );
        const savedPositions = positions.length
          ? await manager.save(
              MatchPositionRequirement,
              positions.map((p) =>
                manager.create(MatchPositionRequirement, {
                  ...p,
                  matchId: match.id,
                }),
              ),
            )
          : [];
        for (let j = 2; j < Math.min(5, game.capacity); j++) {
          await manager.save(
            JoinRequest,
            manager.create(JoinRequest, {
              matchId: match.id,
              userId: users[j].id,
              status: "accepted",
              positionId:
                savedPositions.find((p) => p.quantity > 1)?.id ?? null,
            }),
          );
        }
        if (i === 0)
          await manager.save(
            JoinRequest,
            manager.create(JoinRequest, {
              matchId: match.id,
              userId: users[1].id,
              positionId: savedPositions[0].id,
              message: "Mình có thể bắt gôn, rất vui được giao lưu!",
              status: "pending",
            }),
          );
      }
    });
    console.log(
      "Demo data ready. Accounts: host@keo.local / player@keo.local. Password: SEED_PASSWORD or the documented development default.",
    );
  } finally {
    await dataSource.destroy();
  }
}
seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
