# REST API MVP

Base URL: `http://localhost:3001/api`. Trình duyệt gọi `/api` cùng origin của Next.js; rewrite chuyển tiếp đến NestJS để cookie dùng cùng origin.

Các request ghi dữ liệu cần `Content-Type: application/json` và `X-KT-Client: web`. API kiểm tra Origin (khi có), chỉ cho phép `WEB_ORIGIN`; JWT cookie có HttpOnly, SameSite=Lax, Secure khi production, hết hạn 1 ngày. CLI có thể dùng Bearer JWT thay cookie. Không lưu JWT vào localStorage.

| Method | Endpoint                           | Quyền         | Kết quả                                                   |
| ------ | ---------------------------------- | ------------- | --------------------------------------------------------- |
| GET    | `/health`                          | Công khai     | Kiểm tra tiến trình API; không phải readiness database    |
| POST   | `/auth/register`                   | Công khai     | `{name,email,password}` → hồ sơ riêng + session cookie    |
| POST   | `/auth/login`                      | Công khai     | `{email,password}` → hồ sơ riêng + session cookie         |
| POST   | `/auth/logout`                     | Công khai     | Xóa cookie trình duyệt                                    |
| GET    | `/auth/me`                         | Đăng nhập     | Hồ sơ riêng                                               |
| PATCH  | `/auth/me`                         | Đăng nhập     | `{name,city,bio,sports}` → hồ sơ đã lưu                   |
| GET    | `/matches`                         | Công khai     | `{items,total,page,limit}`                                |
| GET    | `/matches/mine`                    | Đăng nhập     | `{hosted,requests}`; hosted có pendingCount               |
| GET    | `/matches/:id`                     | Công khai     | Chi tiết, host công khai, đội hình đã duyệt, quota vị trí |
| POST   | `/matches`                         | Đăng nhập     | Tạo kèo                                                   |
| PATCH  | `/matches/:id`                     | Chủ kèo       | Sửa thông tin trước giờ bắt đầu                           |
| PATCH  | `/matches/:id/status`              | Chủ kèo       | `{status:"cancelled"\|"completed"}`                       |
| POST   | `/matches/:id/requests`            | Đăng nhập     | `{positionId?,message?}` → yêu cầu pending                |
| DELETE | `/matches/:id/requests/me`         | Người yêu cầu | Rút yêu cầu hoặc rời trận                                 |
| GET    | `/matches/:id/requests`            | Chủ kèo       | Danh sách yêu cầu, người gửi, lời nhắn và vị trí          |
| PATCH  | `/matches/:id/requests/:requestId` | Chủ kèo       | `{status:"accepted"\|"rejected"}`                         |

GET `/matches` nhận: `sport`, `city` (đúng tên), `level`, `q`, `from`, `to` (ISO8601), `available=true`, `sort=soonest|newest|fee`, `page` (1..10000), `limit` (1..30, mặc định 12). Chỉ trả trận open chưa bắt đầu. `q` tìm tên kèo, tên sân, địa chỉ hoặc quận bằng ILIKE; ký tự wildcard được escape. Trình độ là bộ lọc chính xác; bỏ bộ lọc để bao gồm mọi trình độ.

POST `/matches` ví dụ:

```json
{
  "title": "Bóng đá sau giờ làm",
  "sport": "football",
  "level": "all",
  "city": "TP. Hồ Chí Minh",
  "district": "Bình Thạnh",
  "venue": "Sân thể thao",
  "address": "12 Nguyễn Văn A, Phường 1",
  "startsAt": "2030-01-20T19:00:00+07:00",
  "durationMinutes": 90,
  "capacity": 10,
  "fee": 70000,
  "description": "Đến sớm 10 phút để khởi động.",
  "positions": [{ "name": "Thủ môn", "quantity": 1 }]
}
```

PATCH `/matches/:id` nhận các trường trên trừ `sport`, `capacity`, `positions` (phải bỏ 3 trường đó). `startsAt` luôn cần ở tương lai. Sức chứa 2..100; thời lượng 30..360 phút; phí nguyên 0..10.000.000 VNĐ. ID dùng UUID. Không nhận các trường ngoài DTO.

Mã lỗi: 400 dữ liệu không hợp lệ; 401 chưa đăng nhập; 403 thiếu quyền/Origin/header; 404 không tìm thấy; 409 yêu cầu trùng, hết chỗ, quota đầy hoặc trạng thái không cho phép; 429 vượt 30 lần đăng ký/đăng nhập trong 1 phút/IP/tiến trình.

Hồ sơ công khai chỉ có id, tên, thành phố, môn yêu thích. Email chỉ trả cho chính tài khoản; hash mật khẩu không được trả qua API.

Đăng xuất chỉ xóa cookie hiện tại, chưa có danh sách thu hồi JWT phía server. Rate limit hiện ở bộ nhớ của một tiến trình; khi triển khai nhiều instance cần kho dùng chung và cấu hình proxy tin cậy. Đổi `WEB_ORIGIN` và `API_INTERNAL_URL` theo môi trường triển khai.
