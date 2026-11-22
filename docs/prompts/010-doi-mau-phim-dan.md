# 010 — Thay ảnh nền bằng màu phím đàn

- Ngày ghi: **2026-11-22** (`Asia/Saigon`).
- Trạng thái: **Đã xong mã tại máy**.
- Liên quan: [009 — Tối ưu đàn trên điện thoại](009-toi-uu-dan-dien-thoai.md).

## 1. Prompt gốc

> bỏ phần nền ảnh đi thay bằng đổi màu nút đàn, mặc định thì tuỳ bạn quyết định màu cho hợp

## 2. Thực hiện

- Thay bộ tải và chỉnh ảnh nền bằng bảng chọn màu phím. Tím lavender mặc định, có thêm xanh bạc hà, xanh trời và hồng đào. Mỗi màu có phiên bản sáng và tối.
- Màu được lưu theo trình duyệt và áp dụng lên cùng đàn khi phóng to. Phím bấm sáng vàng và phím tập có viền tím. Mã mới chỉ đọc lựa chọn màu, dữ liệu ảnh cũ không còn được hiển thị.

## 3. Kiểm tra và bàn giao

- `npm test`: 115 kiểm tra qua. `npm run build` cũng qua.
- `node tests/features-browser.cjs`: Chromium kiểm tra đổi màu, lưu sau tải lại, đổi màu khi phóng to, phản hồi phím, lưới 3 hàng × 5 phím và các luồng MIDI/cộng đồng.
- Đã cập nhật README, STATUS và mục lục prompt. Chưa triển khai lên Vercel.
