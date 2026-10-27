# KèoThểThao

Web tìm đồng đội và tổ chức kèo thể thao. Monorepo TypeScript: Next.js/React, NestJS REST API, PostgreSQL, TypeORM Migration và JWT.

## Chạy sau khi clone

Yêu cầu Node.js 24 LTS, npm 10+ và Docker Desktop đang chạy (Linux containers).

```bash
npm ci
npm run setup
npm run db:up
npm run api:migration:run
npm run db:seed
npm run dev
```

- Web: [localhost:3000](http://localhost:3000)
- API: [localhost:3001/api/health](http://localhost:3001/api/health)
- PostgreSQL: `localhost:55432`; database/user/password phát triển: `keo_the_thao`.
- `setup` chạy được trên Windows/macOS/Linux, tạo hai file env và JWT secret ngẫu nhiên; không ghi đè cấu hình có sẵn.
- Máy đã có `.env` từ bản scaffold: đối chiếu với `.env.example`, đổi `DATABASE_PORT=55432`, bổ sung `WEB_ORIGIN`, đặt JWT secret ít nhất 32 ký tự. `setup` không tự sửa file env hiện có.
- Nếu cổng 55432 bị chiếm, đổi cả Docker Compose và `apps/api/.env`. Với PostgreSQL tự cài, sửa thông tin `DATABASE_*`; tài khoản cần tạo extension uuid-ossp và migration. Integration test cần quyền CREATE DATABASE.
- `db:seed` là tùy chọn. Chỉ dành cho phát triển, không chạy khi NODE_ENV=production. Dữ liệu sân và lịch là minh họa.

## Tài khoản demo

| Vai trò thử nghiệm                   | Email              | Mật khẩu phát triển mặc định |
| ------------------------------------ | ------------------ | ---------------------------- |
| Chủ các kèo mẫu                      | `host@keo.local`   | `TeamKeo2026!`               |
| Người chơi, có một yêu cầu chờ duyệt | `player@keo.local` | `TeamKeo2026!`               |

Đổi `SEED_PASSWORD` trước lần seed đầu để dùng mật khẩu khác. Seed chạy lại không ghi đè tài khoản/trận đã tồn tại, cũng không đổi mật khẩu hoặc dời lịch cũ. Tạo kèo mới khi lịch demo đã qua.

## Chức năng MVP

- Đăng ký, đăng nhập, đăng xuất; hồ sơ và môn yêu thích.
- Tìm kèo theo môn, thành phố, ngày, trình độ, khu vực và chỗ trống; sắp xếp, phân trang.
- Tạo/sửa kèo, tuyển vị trí có quota, chi phí dự kiến, chia sẻ liên kết chi tiết.
- Xin tham gia, duyệt/từ chối, rút yêu cầu, rời trận; chống duyệt vượt sức chứa và quota khi thao tác đồng thời.
- Quản lý kèo của tôi, đội hình, yêu cầu chờ; hủy và hoàn thành trận.
- Giao diện responsive có loading, lỗi, trạng thái trống và form validation.

Chi phí hiện thanh toán trực tiếp, chưa tích hợp đặt sân, thu tiền, chat, xếp hạng hay danh sách chờ tự động. [Nghiên cứu và roadmap](docs/product-research.md) giải thích phạm vi được chọn từ GoodRec, Playtomic và OpenSports.

## Cấu trúc

```text
apps/api/src/
  auth/          # đăng nhập, cookie, hash mật khẩu, guard
  domain/        # entity, DTO và enum nghiệp vụ
  matches/       # REST controller, nghiệp vụ + transaction
  database/      # cấu hình, migrations, seed
apps/api/test/   # unit và integration HTTP + PostgreSQL thật
apps/web/src/
  app/           # trang chính, layout, CSS responsive
  components/    # khám phá, chi tiết, quản lý, form
  lib/           # API client, types, định dạng giờ Việt Nam
docs/            # nghiên cứu, API, kiến trúc
scripts/         # setup env đa nền tảng
```

## Kiểm tra và phát triển

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

`test:e2e` cần PostgreSQL hoạt động. Nó tạo database tạm, chạy migration, khởi động API trên cổng tạm, kiểm tra HTTP/quyền/quota/duyệt đồng thời rồi xóa database tạm. Không chạy build/test đồng thời với Nest watch vì cùng dùng thư mục dist.

GitHub Actions có workflow chạy các kiểm tra này với PostgreSQL riêng khi push vào main/codex hoặc mở pull request.

```bash
npm run db:down
npm run format
npm run api:migration:generate -- src/database/migrations/TenMigration
npm run api:migration:run
npm run api:migration:revert
```

Không bật `synchronize`. Chạy migration sau khi pull; commit entity và migration cùng thay đổi. `db:down` giữ volume dữ liệu. Không commit `.env`, mật khẩu hoặc dữ liệu người dùng.

[API và quyền truy cập](docs/api.md) · [Kiến trúc và mô hình dữ liệu](docs/architecture.md) · [Nghiên cứu và chia việc nhóm](docs/product-research.md).
