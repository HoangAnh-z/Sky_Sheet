# 030 — Ô trạng thái và công tắc Lặp

- Ngày ghi: 2026-11-24 (`Asia/Saigon`).
- Trạng thái: Đã xong mã tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [029 — Bước hiện tại và phát tiếp](029-buoc-hien-tai-va-phat-tiep.md).

## 1. Prompt gốc

> làm nổi bật cả chỗ ô hay hiện sẵn sàng  cạnh chõ có tick lặp nữa, tick lặp chuyển thành dạng toggle

## 2. Bối cảnh và kết quả mong muốn

- Thanh điều khiển dùng checkbox thường cho Lặp và chữ nhỏ cho trạng thái. Ô trạng thái từng ẩn trên bố cục hẹp.
- Đổi sang công tắc gạt và làm nổi bật ô trạng thái cạnh nó.

## 3. Thực hiện và quyết định

- Dùng chung kiểu công tắc với **Hiện tất cả lớp**. Công tắc **Lặp** vẫn bật mặc định và nhận phím Space khi có tiêu điểm.
- Thêm viền màu và chữ đậm cho trạng thái. Đặt công tắc cạnh ô trạng thái, có bố cục riêng cho điện thoại và bàn đàn phóng to hẹp.

## 4. Kiểm tra và bằng chứng

- `node tests/features-browser.cjs` kiểm tra trạng thái hiển thị, đổi màu khi dừng hoặc ghi, bật/tắt **Lặp** bằng Space mà không chèn bước nghỉ khi công tắc có tiêu điểm. Qua Chromium máy tính và hai hướng điện thoại mô phỏng, gồm bố cục phóng to.
- `npm run build` và kiểm tra diff Git qua tại máy trên `upgrade3`.

## 5. Kết quả và bàn giao

- Giữ các thay đổi 029 đang có. Cập nhật tiến độ và mục lục. Chưa commit, push hoặc deploy.
