# Nhật ký prompt và nhiệm vụ

Nhật ký phục vụ việc bàn giao giữa các phiên và môn học Prompting AI. Bắt đầu từ yêu cầu chuyển dự án sang **Vercel + Turso**, không hồi dựng toàn bộ lịch sử trước đó.

Đọc [AGENTS.md](../../AGENTS.md) để biết quy trình và [STATUS.md](../STATUS.md) để biết tiến độ hiện tại. Tạo bản ghi mới bằng [_TEMPLATE.md](_TEMPLATE.md).

## Mục lục

| ID | Ngày ghi | Yêu cầu | Trạng thái | Bản ghi |
|---|---|---|---|---|
| 001 | 2026-11-20 | Chuyển sang Vercel + Turso; hướng dẫn người mới | Đã xong mã; chờ triển khai | [001-vercel-turso.md](001-vercel-turso.md) |
| 002 | 2026-11-20 | Hướng dẫn agent và ghi lại mỗi prompt bằng Markdown | Đã hoàn thành | [002-agent-va-nhat-ky-prompt.md](002-agent-va-nhat-ky-prompt.md) |
| 003 | 2026-11-20 | Xem xét nhập MIDI/PDF và chia sẻ bài cho cộng đồng | Đã trả lời; chưa triển khai | [003-nhap-nhac-va-cong-dong.md](003-nhap-nhac-va-cong-dong.md) |
| 004 | 2026-11-20 | Nhập MIDI, cộng đồng và cải thiện chơi đàn | Đã xong mã/kiểm thử; chưa deploy | [004-midi-cong-dong-va-giao-dien.md](004-midi-cong-dong-va-giao-dien.md) |
| 005 | 2026-11-20 | Thay nhập MIDI theo file kiểm tra người dùng gửi | Đã xong mã/kiểm thử 2026-11-21; chưa deploy | [005-midi-theo-ban-kiem-tra.md](005-midi-theo-ban-kiem-tra.md) |
| 006 | 2026-11-21 | Cải tiến giao diện Liquid Glass UI, nền Sky, tùy chọn nền đàn và bố cục tab | Đã hoàn thành | [006-cai-tien-giao-dien-liquid-glass.md](006-cai-tien-giao-dien-liquid-glass.md) |
| 007 | 2026-11-21 | Sửa khung soạn, Dàn nhạc và phản hồi phím trên ảnh nền | Đã hoàn thành tại máy | [007-sua-khung-soan-va-dan-nhac.md](007-sua-khung-soan-va-dan-nhac.md) |

**Số tiếp theo: 008** — đối chiếu các file/mục lục thực tế trước khi dùng số này.

## Quy ước

- Tên: `NNN-ten-ngan.md`, số tăng dần, tên ngắn không dấu.
- Ngày dùng `YYYY-MM-DD`, múi giờ `Asia/Saigon`. Với ghi hồi cứu, ghi ngày tạo bản ghi và nêu nguồn thông tin; không coi đó là ngày đã thực hiện công việc.
- Giữ prompt gốc, các bổ sung và kết quả thực tế. Không sửa prompt gốc thành prompt hay hơn sau khi đã làm xong.
- Một nhiệm vụ đang thực hiện có thể nhận nhiều bổ sung. Ghi bổ sung vào cùng bản ghi; yêu cầu độc lập dùng số mới.
- Phân biệt `đã trả lời`, `đã sửa mã`, `đã kiểm thử`, `đã commit/push`, `đã deploy`. Chưa xác minh thì ghi chưa xác minh.
- Không ghi bí mật, giá trị biến môi trường, cookie hay mật khẩu thật. Dùng `[ĐÃ ẨN]` nếu cần giữ cấu trúc prompt.
- Chỉ thêm nhận xét học prompting khi hữu ích, không cần chấm điểm cho mọi yêu cầu ngắn.
