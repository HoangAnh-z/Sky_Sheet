# 022 — Tiêu đề bản ghi và nút Chơi đàn

- Ngày ghi: 2026-11-24 (`Asia/Saigon`).
- Trạng thái: Đã xong mã tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [021 — Tích hợp bản Piano](021-tich-hop-ban-piano-vao-upgrade2.md).

## 1. Prompt gốc

> i bỏ cái nút chơi đàn cạnh chỗ mở rộng lưới do Ấn vào phải ấn thêm Esc nũa nó mới hoạt động; ghi từ đàn thì lúc sinh chữ vào bản nhạc và AI bị dính tiêu đề cũ của bài trước, xử lý đi

## 2. Bối cảnh và kết quả mong muốn

- `main` đang ở commit merge `a127c8f`. Bản trước có hai điểm mở đàn phóng to. Người dùng muốn bỏ nút cạnh lưới.
- Luồng ghi sửa nốt của lớp đã chọn nhưng tuần tự hóa tiêu đề và giữ ID của bài đang mở. Cần tách bản thu mới khỏi tiêu đề cũ.

## 3. Thực hiện và quyết định

- Bỏ nút cạnh lưới và điểm nối sự kiện của nút. Điểm mở phóng to nằm ở nút **Phóng to** của bàn đàn.
- Khi đánh nốt đầu tiên của bản ghi từ bài đã mở hoặc vừa lưu, tách ID bài lưu, xóa tên trong ô **Tên bài** và dùng tiêu đề tạm **Bài chưa đặt tên** cho bản chữ. Dừng khi chưa đánh nốt giữ nguyên tên và nốt. Ghi thêm lớp trước khi lưu giữ tên đã đặt cho bản nháp.

## 4. Kiểm tra và bằng chứng

- `npm test` qua 119 kiểm tra, gồm ca mở bài đã lưu, hủy khi chưa ghi nốt, ghi mới, đặt tên, ghi thêm lớp và lưu thành bài riêng trên SQLite tạm.
- `node tests/features-browser.cjs` qua Chromium desktop và hai hướng điện thoại mô phỏng. Dùng nút **Phóng to** của bàn đàn để kiểm tra kích thước, chế độ dự phòng và giữ tiến độ tập.
- `npm run build` và kiểm tra diff Git đều qua.

## 5. Kết quả và bàn giao

- Cập nhật README, tiến độ và mục lục prompt. Chưa commit, push hoặc deploy trong phiên này.
