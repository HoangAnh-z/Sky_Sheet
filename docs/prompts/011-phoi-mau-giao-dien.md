# 011 — Phối nền gradient và màu phím

- Ngày ghi: **2026-11-22** (`Asia/Saigon`).
- Trạng thái: **Đã xong mã tại máy**.

## 1. Prompt gốc

> có bộ chọn màu được không, chọn cả màu nền cả trang nữa, vấn gradient như cũ, hoặc xây dựng vài bộ(khớp nhau, thay đổi theo cả sáng cả tối ) để tùy chọn

## 2. Thực hiện

- Mở rộng hộp chọn màu phím thành bảng Màu sắc có mẫu xem trước, bốn bộ phối nền gradient và phím, cùng hai bộ chọn màu riêng.
- Giữ gradient Sky cũ cho bộ tím lavender mặc định. Màu tự chọn được phối sắc độ riêng cho chế độ sáng và tối. Lựa chọn được lưu theo trình duyệt và áp dụng ở cả chế độ phóng to.
- Người dùng có thể chọn lại một bộ hoặc bấm Dùng màu của bộ để bỏ màu tùy chỉnh.

## 3. Kiểm tra và bàn giao

- `npm test`: 115 kiểm tra qua. Build thành công.
- Chromium kiểm tra màu tự chọn ở cả hai chế độ, lưu qua tải lại, khôi phục, truy cập từ phóng to và bố cục 3 hàng × 5 phím. Đã xem bảng màu cả sáng và tối ở 390 px.
- Bản sửa có tại máy. Chưa triển khai lên Vercel.
