# 025 — Ghi hợp âm với Shift và hộp thoại bài soạn dở

- Ngày ghi: 2026-11-24 (`Asia/Saigon`).
- Trạng thái: Đã xong mã tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [023 — Soạn nhạc mới](023-nut-soan-nhac-moi.md), [024 — Ghi theo từng bước](024-ghi-tu-dan-tung-buoc.md).

## 1. Prompt gốc

> sao có nhiều lúc bấm bị khựng ko hiện ngay, về nhịp nào ko có đã có nút riêng chưa, hợp âm (nhiều nút trên 1 cột) có thể kết hợp nhấn giữ shift hoặc alt gì đó đi, thông báo đang có bài soạn dở nên dùng pop up

## 2. Bối cảnh và kết quả mong muốn

- Mã ghi từng bước và nút Nghỉ trong 024 đã có ở thư mục làm việc. Nhánh hiện hành là `upgrade3`.
- Giảm công việc đồng bộ trên mỗi lần bấm, hỗ trợ Shift và dùng hộp thoại trong trang để chuyển bài.

## 3. Thực hiện và quyết định

- Khi ghi, tránh gọi dừng trình nghe thử trên từng nốt, dựng lại lưới khi thêm cột và vẽ lại cột trước. Cập nhật phần hiển thị cần thiết cho nốt vừa nhập.
- Giữ Shift trong khi bấm các phím để gom cùng một bước, thả để chốt. Giữ nút **Hợp âm** cho cảm ứng, **Nghỉ** cho bước trống.
- Khi bấm **Soạn nhạc mới** trên bản chưa lưu, hiển thị hộp thoại có **Tiếp tục soạn** và **Bắt đầu bài mới**. Escape giữ bản nháp.

## 4. Kiểm tra và bằng chứng

- `npm test` qua 120 kiểm tra tại máy.
- `node tests/features-browser.cjs` qua trên Chromium desktop và hai hướng điện thoại mô phỏng. Kiểm tra giữ và thả Shift, nốt hợp âm hiện chung cột trước khi thả, cuộn qua 37 bước, hủy hộp thoại bằng nút hoặc Escape và mở bài mới khi xác nhận. Chưa đo độ trễ trên thiết bị thật.
- `npm run build` và kiểm tra diff Git qua trên `upgrade3`.

## 5. Kết quả và bàn giao

- Giữ các thay đổi đang có của 024. Chưa commit, push hoặc deploy. Đã cập nhật README, tiến độ và mục lục.
