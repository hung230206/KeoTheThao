# Kết quả kiểm tra MVP

Kiểm tra local ngày 27/10/2026, Windows, Node 24.15.0, npm 11.12.1, PostgreSQL 16 trong Docker.

## Tự động

- `npm ci --offline`: đã cài lại sạch từ lockfile. Sau bản vá dependency cuối, `npm ci --dry-run --offline` tiếp tục hợp lệ.
- Lint hai workspace: qua.
- Build NestJS và Next.js production: qua.
- `npm run dev` khởi động đồng thời hai ứng dụng; web trả HTTP 200, API health OK và Next.js proxy lấy đủ 8 kèo mẫu.
- Unit: 1 test password scrypt và 2 test frontend (giờ Việt Nam, API client/validation).
- Integration: 8 tình huống HTTP và 1 test cha qua trên database PostgreSQL tạm riêng.
- Bao phủ: đăng ký/đăng nhập, hồ sơ riêng, cookie và CSRF, validation, bộ lọc/phân trang, quyền chủ kèo, xin/rút/gửi lại yêu cầu, sửa trận, sức chứa, quota vị trí, hai lượt duyệt đồng thời, đóng trận, rate limit với route khác hoa/thường/dấu slash, rollback/reapply migration.
- Integration xác nhận schema entity và migrations không có chênh lệch; CLI `schema:log` trên database dev cũng không có câu SQL cần áp dụng.
- `npm audit`: 0 vulnerability tại thời điểm kiểm tra.

## Trình duyệt

Đã thử trực tiếp qua Next.js proxy tới NestJS và PostgreSQL:

1. Khám phá hiển thị 8 kèo mẫu; chọn cầu lông còn 2 kèo.
2. Đăng nhập chủ kèo, mở Kèo của tôi, xem yêu cầu đang chờ.
3. Duyệt tài khoản người chơi mẫu: đội hình 4 → 5, thủ môn 0/1 → 1/1.
4. Tạo kèo QA: 1 chủ kèo trong tổng 4, còn 3 chỗ; sửa sân và thấy thông tin mới.
5. Hủy kèo QA qua bước xác nhận; trạng thái đã hủy được lưu.
6. Đăng xuất, đăng nhập người chơi, gửi lời nhắn xin tham gia cầu lông; thấy trạng thái chờ duyệt.
7. Sao chép liên kết kèo, mở trực tiếp URL và vẫn thấy đúng yêu cầu đang chờ của tài khoản.

Kèo QA được hủy và giữ trong lịch sử dev; không xuất hiện trong khám phá. Các thao tác thử nghiệm chỉ dùng tài khoản/dữ liệu demo.

## Giới hạn kiểm tra

- Đã kiểm tra trình duyệt desktop và bố cục ở chiều rộng panel khác nhau; chưa kiểm thử trên thiết bị iOS/Android thật.
- Workflow CI đã được thêm; kết quả local không thay thế kết quả GitHub Actions trên remote.
- Không kiểm thử tải lớn hoặc hạ tầng production. Các phần ngoài MVP và việc cần làm trước khi mở công khai được ghi ở nghiên cứu/kiến trúc.
