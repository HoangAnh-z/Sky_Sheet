# 018 — Công tắc lớp và độ rộng lưới cố định

- Ngày ghi: 2026-11-22 (`Asia/Saigon`).
- Trạng thái: Đã hoàn thành tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [017 — Phát nền, tua theo bước và xem nhiều lớp](017-phat-nen-va-xem-nhieu-lop.md).

## 1. Prompt gốc

> **Hiện tất cả lớp: chuyển thành dạng toggle đi, chỗ khung soạn nhạc dài lên 213% luôn ko cần + - từ 60% nữa**

## 2. Bối cảnh và kết quả mong muốn

- Bản Piano dùng nút để đổi giữa xem lớp đang chọn và xem tất cả lớp. Lưới mặc định 30 px mỗi bước và có nút điều chỉnh từ 60% đến 213%.
- Đổi sang công tắc gạt và dùng cố định mức cao nhất cũ.

## 3. Thực hiện và quyết định

- Dùng checkbox có vai trò công tắc, nhãn cố định **Hiện tất cả lớp**, mặc định tắt. Bật để xem mọi lớp, tắt để xem lớp đang chọn.
- Dùng 64 px cho mỗi cột, mức được hiển thị là 213% ở trình chỉnh zoom cũ. Bỏ điều khiển và logic zoom. Cuộn, tua, bài chạy về cột trái và kéo nốt dùng chung độ rộng.

## 4. Kiểm tra và bằng chứng

| Lệnh / thao tác | Kết quả | Giới hạn |
|---|---|---|
| `node tests/interface.cjs` | 13 kiểm tra qua, gồm màu nhiều lớp và vị trí cuộn theo bước | Đồng hồ âm thanh mô phỏng |
| `node tests/features-browser.cjs` | Chromium kiểm tra công tắc bằng Space và bằng click, cột 64 px, kéo và tua nốt | Máy tính và hai hướng điện thoại mô phỏng |
| `npm run build` và HTTP cục bộ | Build qua. Trang trên cổng 5174 phục vụ công tắc mới | Máy cục bộ |

## 5. Kết quả và bàn giao

- Bản thử có tại `http://localhost:5174/`. Chỉ chỉnh Sky_Sheet_Piano. Chưa commit, push hoặc deploy.
- Đã cập nhật README, tiến độ và mục lục prompt.
