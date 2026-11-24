# 027 — Ghi tiếp từ cuối lớp

- Ngày ghi: 2026-11-24 (`Asia/Saigon`).
- Trạng thái: Đã xong mã tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [023 — Soạn nhạc mới](023-nut-soan-nhac-moi.md), [026 — Phím tắt và ghi nhanh](026-phim-tat-va-ghi-nhanh.md).

## 1. Prompt gốc

> khi bấm ghi từ đàn được 1 đoạn rồi bấm dừng ghi thì bấm ghi từ đàn tiếp lại về từ đầu, đoạn này đang mập mờ chưa rõ ràng, xử lý cho hợp (đề xuất gắn với nút soạn nhạc mới hay không nữa)

## 2. Bối cảnh và kết quả mong muốn

- Trước đây lượt mới đặt lại vị trí về bước 1 và thay nốt của lớp khi có lần bấm đầu tiên.
- Tách thao tác tiếp tục ghi với thao tác mở bài mới hoặc xóa riêng một lớp.

## 3. Thực hiện và quyết định

- Lớp trống có nút **Ghi từ đàn**. Lớp có nốt hoặc bước nghỉ có nút **Ghi tiếp**; khi bấm thì hiển thị số bước kế tiếp. **Dừng ghi** giữ đoạn đã nhập.
- **Soạn nhạc mới** dùng để bắt đầu bài trống và hỏi nếu có thay đổi chưa lưu. **Xóa lớp này** là thao tác làm lại riêng lớp đang chọn.
- Bản chữ chỉ xuất ký hiệu nghỉ nếu lớp thực sự có bước nghỉ hoặc khoảng trống trong đoạn. Lớp trống được giữ qua tiêu đề lớp. Với bản chữ cũ có dấu gạch trong lớp, dấu gạch được đọc là một bước nghỉ.

## 4. Kiểm tra và bằng chứng

- `npm test` qua 120 kiểm tra. Ca ghi tiếp xác nhận bước đầu của lượt thứ hai là bước 2, nối sau bước nghỉ, và giữ tất cả nốt đã nhập.
- `node tests/features-browser.cjs` qua Chromium desktop và hai hướng điện thoại mô phỏng. Sau khi dừng ở bước 37, nút hiển thị **Ghi tiếp**, báo bước 38 và nối chính xác một nốt.
- Sau khi chỉnh cách xuất lớp trống, chạy lại `node tests/smoke.cjs`, `npm run build` và kiểm tra diff Git. Tất cả qua trên `upgrade3`.

## 5. Kết quả và bàn giao

- Cập nhật hướng dẫn và mục lục prompt. Chưa commit, push hoặc deploy.
