# Nghiên cứu và phạm vi MVP

Ngày nghiên cứu: 27/10/2026. Nguồn: trang sản phẩm và hướng dẫn chính thức. Đây là đề xuất triển khai từ nghiên cứu, chưa thay thế tài liệu yêu cầu được nhóm duyệt.

| Hệ thống                                                                                                        | Chức năng quan sát được                                                                   | Áp dụng cho KèoThểThao                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [GoodRec](https://www.goodrec.com/)                                                                             | Tìm trận theo thành phố/môn; thông tin giờ, sân, thể thức và chỗ trống; tham gia một mình | Trang khám phá ưu tiên môn, thành phố, thời gian, chi phí và số chỗ còn lại                                                                            |
| [Playtomic](https://helpmanager.playtomic.com/hc/en-gb/articles/20535718052241-Request-a-spot-in-an-Open-Match) | Người ngoài mức trình độ có thể xin suất; người đang tham gia duyệt trước khi xác nhận    | MVP dùng yêu cầu chờ duyệt và chủ kèo quyết định; trình độ là thông tin tham khảo. Không triển khai cơ chế toàn đội đồng thuận hay thuật toán xếp hạng |
| [OpenSports](https://opensports.net/waitlist)                                                                   | Danh sách chờ có thứ tự, thông báo khi có chỗ, thời hạn nhận suất                         | MVP kiểm soát sức chứa và cho phép rời kèo; tự động xếp hàng và gửi thông báo để giai đoạn sau                                                         |

Thiết kế giao diện và mã nguồn được viết cho dự án này; không sao chép thương hiệu hay tài sản của các nền tảng tham khảo.

## Người dùng và mục tiêu

- Khách: xem và tìm trận, mở liên kết chi tiết được chia sẻ.
- Người chơi: quản lý hồ sơ, gửi/rút yêu cầu, xem kết quả duyệt, rời trận trước giờ bắt đầu.
- Chủ kèo: tạo/sửa trận, tuyển theo vị trí, duyệt/từ chối yêu cầu, hủy hoặc hoàn thành trận.
- Một tài khoản có thể vừa là chủ kèo vừa là người chơi ở trận khác. Quyền chủ kèo gắn với từng trận.

## Phần đã triển khai

1. Đăng ký, đăng nhập, đăng xuất bằng JWT trong cookie HttpOnly; hồ sơ và môn yêu thích.
2. Khám phá 6 môn: bóng đá, cầu lông, bóng rổ, bóng chuyền, tennis, pickleball.
3. Tìm theo tên kèo/sân/khu vực; lọc thành phố, ngày theo giờ Việt Nam, trình độ, còn chỗ; sắp xếp và phân trang.
4. Tạo trận: tên, môn, trình độ, địa điểm, giờ, thời lượng, tổng người, chi phí dự kiến và lời nhắn.
5. Tuyển vị trí với số lượng riêng, hỗ trợ cả suất tự do chưa phân vị trí.
6. Yêu cầu tham gia có lời nhắn, duyệt/từ chối, gửi lại sau khi bị từ chối/rút.
7. Đội hình chỉ gồm chủ kèo và người được duyệt; yêu cầu chờ chưa giữ chỗ.
8. Trang kèo của tôi: kèo tổ chức, số yêu cầu cần duyệt, kèo xin tham gia và trạng thái.
9. Sửa thông tin trận, hủy trận, đánh dấu hoàn thành sau giờ bắt đầu.
10. Chia sẻ liên kết chi tiết `/?match=<uuid>`; giao diện responsive, loading, lỗi và danh sách trống.

## Quy tắc nghiệp vụ

- Sức chứa bao gồm 1 suất chủ kèo. Tổng số lượng vị trí tuyển không vượt `capacity - 1`.
- Suất tự do bằng `capacity - 1 - tổng quota vị trí`. Không dùng suất tự do để chiếm vị trí đang tuyển.
- Chủ kèo đã ở đội hình, không gửi yêu cầu cho chính mình. Mỗi người chỉ có một bản ghi yêu cầu cho mỗi trận.
- Chỉ duyệt yêu cầu đang `pending`. Việc duyệt, rời trận, tạo yêu cầu, sửa và đóng trận dùng transaction khóa bản ghi trận.
- Không tham gia/rút/sửa/duyệt sau giờ bắt đầu hoặc khi trận đã đóng. Có thể xem lịch sử.
- Chủ kèo có thể hủy trận; các yêu cầu đang chờ chuyển `cancelled`, người đã nhận vẫn lưu trong lịch sử đội hình. Trạng thái trận là nguồn quyết định trận có diễn ra không.
- Chỉ đánh dấu hoàn thành sau giờ bắt đầu. Không mở lại trận đã hủy/hoàn thành trong MVP.
- Môn, sức chứa và cấu hình vị trí không sửa sau khi tạo; các thông tin khác được sửa trước giờ bắt đầu.
- Chi phí là số VNĐ dự kiến/người, trả trực tiếp. Dữ liệu sân do chủ kèo nhập; không xác nhận việc đặt sân.

## Giai đoạn tiếp theo

| Ưu tiên | Công việc                                              | Cần chốt trước khi làm                          |
| ------- | ------------------------------------------------------ | ----------------------------------------------- |
| P1      | Email xác minh, quên mật khẩu, thu hồi phiên đăng nhập | Nhà cung cấp email và thời hạn lưu token        |
| P1      | Thông báo duyệt/hủy/đổi giờ, danh sách chờ             | Kênh thông báo, chính sách nhận suất và hết hạn |
| P1      | Báo cáo, quản trị, xử lý vắng mặt                      | Vai trò quản trị, tiêu chí và quyền khiếu nại   |
| P2      | Nhóm chơi cố định, chat theo trận                      | Quyền truy cập, kiểm duyệt, thời hạn lưu tin    |
| P2      | Bản đồ, sân đã xác minh, đặt sân                       | Nguồn dữ liệu sân và đơn vị tích hợp            |
| P2      | Thu phí và hoàn tiền                                   | Cổng thanh toán, chính sách hủy và đối soát     |
| P3      | Xếp hạng trình độ và đề xuất đồng đội                  | Quy tắc tính điểm, dữ liệu đủ để đánh giá       |

## Gợi ý chia việc cho nhóm

- Tài khoản và hồ sơ: `apps/api/src/auth`, `apps/web/src/components/forms.tsx`.
- Khám phá và chi tiết: `matches.service.ts` (list/detail), `dashboard.tsx`, `match-card.tsx`.
- Đăng và quản lý kèo: MatchForm, edit/status API.
- Tuyển vị trí và yêu cầu: JoinRequest/MatchPositionRequirement, join/decide/withdraw API, MatchDetail.
- Database và QA: migrations, seed, tests và kiểm tra quyền/sức chứa.
