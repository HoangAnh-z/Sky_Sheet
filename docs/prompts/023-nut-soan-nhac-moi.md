# 023 — Nút Soạn nhạc mới

- Ngày ghi: 2026-11-24 (`Asia/Saigon`).
- Trạng thái: Đã xong mã tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.

## 1. Prompt gốc

> hiện tại trang soạn nhạc là trang tự soạn nhạc mới luôn đúng ko, vẫn nên thêm 1 nút soạn nhạc mới để người dùng thấy rõ ràng, ko phải tự xóa hết lớp

## 2. Bối cảnh và kết quả mong muốn

- Tab Soạn nhạc chỉnh bài hiện tại. Khi mới mở trang, ứng dụng nạp một bài mẫu. Người dùng muốn bắt đầu bài trống ngay từ khung soạn.

## 3. Thực hiện và quyết định

- Thêm nút **Soạn nhạc mới** cạnh **Mở rộng lưới**. Mở bản chưa đặt tên, 100 BPM, một lớp đàn hạc trống; xóa liên kết với bài đang mở. Bài đã lưu vẫn có thể mở từ Thư viện.
- Dùng hộp xác nhận khi có thay đổi chưa lưu. Đối chiếu bản chữ hiện tại với trạng thái mở/lưu gần nhất, kể cả bản chữ được áp dụng hoặc còn trong ô nhập. Khóa nút trong lúc ghi.

## 4. Kiểm tra và bằng chứng

- `npm test` qua 119 kiểm tra trên `main`, gồm kiểm tra bản ghi 022.
- `node tests/features-browser.cjs` qua trên Chromium desktop và hai hướng điện thoại mô phỏng. Hủy xác nhận giữ nguyên bản chữ. Chấp nhận mở đúng một lớp đàn hạc trống, xóa tiêu đề cũ và đặt lại hoàn tác.
- `npm run build` và kiểm tra diff Git qua tại máy.

## 5. Kết quả và bàn giao

- Cập nhật README, tiến độ và mục lục. Chưa commit, push hoặc deploy trong phiên này.
