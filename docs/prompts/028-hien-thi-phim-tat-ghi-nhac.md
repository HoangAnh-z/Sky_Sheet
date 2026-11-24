# 028 — Hiển thị phím tắt ghi nhạc

- Ngày ghi: 2026-11-24 (`Asia/Saigon`).
- Trạng thái: Đã xong mã tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [026 — Phím tắt và ghi nhanh](026-phim-tat-va-ghi-nhanh.md).

## 1. Prompt gốc

> trên máy tính thì nên thêm gì vào giao diện để người dùng thấy là cách là nghỉ shift là hợp âm chứ, điện thoại thì hiện được 2 nút đó chưa

## 2. Bối cảnh và kết quả mong muốn

- Bản trước chỉ hiện hướng dẫn Space và Shift khi đang ghi. Trên điện thoại, hai nút cảm ứng cũng hiện trong lúc ghi.
- Cho người dùng thấy trước cách ghi bước nghỉ và hợp âm, đồng thời xác nhận hai nút trên bố cục điện thoại.

## 3. Thực hiện và quyết định

- Đưa dòng **Khi ghi** ngay dưới bàn đàn trên máy tính, hiển thị Space và Shift dưới dạng phím. Dòng này có mặt cả trước và trong lúc ghi.
- Khi ghi trên màn hình cảm ứng, hiện **Nghỉ** và **Hợp âm** ở cùng khu vực.

## 4. Kiểm tra và bằng chứng

- `node tests/features-browser.cjs` qua trên Chromium ở 1440×1000, 390×844 và 844×390. Kiểm tra hướng dẫn hiện trước và trong lúc ghi trên desktop, hai nút ẩn trước khi ghi và hiện khi ghi trên thiết bị cảm ứng mô phỏng, cả trong vùng phóng to.
- `npm run build` và kiểm tra diff Git qua tại máy trên `upgrade3`.

## 5. Kết quả và bàn giao

- Cập nhật tiến độ, mục lục và ca kiểm tra trình duyệt. Chưa commit, push hoặc deploy.
