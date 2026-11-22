# 014 — Tách dự án Sky_Sheet_Piano

- Ngày ghi: **2026-11-22** (`Asia/Saigon`).
- Trạng thái: **Đã xong mã tại máy**.

## 1. Prompt gốc

> vậy làm sang 1 thư mục dự án mới riêng ra cùng thư mục to với dự án này, tên Sky_Sheet_Piano để tôi làm sang 1 repo mới riêng

## 2. Thực hiện

- Sao chép mã nguồn hiện tại sang thư mục cùng cấp `Sky_Sheet_Piano`. Tạo Git mới nhánh `main`, chưa có remote. Tách Git cũ, cấu hình bí mật, database, dependencies và build output khỏi lúc sao chép.
- Triển khai đề xuất [013](013-de-xuat-khung-soan-piano-roll.md) trong thư mục mới. Cột 15 phím cố định, kéo nốt đổi bước/cao độ, zoom ngang, hoàn tác, mở rộng lưới và nút mở đàn từ khung soạn. Vuốt cuộn mặc định trên cảm ứng, bật Sửa nốt trước khi chỉnh.
- Khung soạn chỉ dựng cột đang thấy và vùng đệm. Giữ cách phát, tập, dữ liệu và định dạng chữ cũ. Trường độ riêng chưa thuộc bản đầu.

## 3. Kiểm tra và bàn giao

- `npm test`: 115 kiểm tra qua. Build thành công. Sau chỉnh sửa cuối, đã chạy lại smoke và interface.
- Hai bộ Chromium qua luồng tài khoản, cộng đồng, nhập MIDI, phóng to, kéo nốt, zoom, hoàn tác, chỉnh bằng cảm ứng và cuộn tới cuối bài 1.367 bước. Kiểm tra riêng bài 4.096 bước có dưới 1.000 ô đang dựng ở viewport 1440 px và chuyển từ nốt cuối về bài ngắn. Đã xem ảnh chụp khung soạn trên máy tính.
- Server Piano chạy tại `http://localhost:5174` với SQLite riêng. Chưa commit và chưa nối remote. Mã và dữ liệu dự án gốc được giữ nguyên.
