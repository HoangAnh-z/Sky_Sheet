# 017 — Phát nền, tua theo bước và xem nhiều lớp

- Ngày ghi: 2026-11-22 (`Asia/Saigon`).
- Trạng thái: Đã hoàn thành tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [014 — Tách dự án Piano](014-tach-du-an-sky-sheet-piano.md), [016 — Mẫu thu và bộ trống](016-mau-thu-harp-sao-day-va-bo-trong.md).

## 1. Prompt gốc

> vẫn ở phần \_Piano: sao khi bấm tab khác, chuyển ứng dụng khác khung soạn nhạc đang chạy lại bị ngắt, cải tiến chỗ khung soạn nhạc thêm ô đến khung nào để việc tua hay sửa cho thuận tiện, thêm nữa, các ô tím hiện tại trong ô soạn nhạc thì có thể mỗi màu cho từng lớp dàn nhạc không và thêm nút tùy chọn hiện tất cả các lớp trong khung soạn nhạc chạy 1 lượt luôn hoặc không như cũ

## 2. Bối cảnh và kết quả mong muốn

- Bản Piano dừng âm thanh khi nhận `visibilitychange` sang ẩn. Lưới đang hiển thị nốt của một lớp. Điểm bắt đầu đặt qua đầu cột.
- Giữ phát khi chuyển tab hoặc ứng dụng trong phạm vi trình duyệt hỗ trợ. Cho nhập cột để sửa hoặc tua. Hiện màu riêng từng lớp và đổi qua lại giữa xem một lớp và tất cả lớp.

## 3. Thực hiện và quyết định

- Lên lịch Web Audio trước 4 giây khi tab ẩn, với bộ hẹn giờ riêng khỏi vòng vẽ lưới. Khi trở lại, thử khôi phục AudioContext và giữ lịch ngắn để chỉnh nhạc thuận tiện. Chế độ ghi vẫn kết thúc khi tab bị ẩn.
- Đến bước dùng số cột tính từ 1. Khi đang phát, nhảy ngay đến điểm đó. Nếu cột nằm sau nốt cuối, dừng và mở vị trí đã nhập để sửa. Màu ghép trong một ô khi trùng nốt. Mặc định mở lưới một lớp, nút xem mọi lớp thay đổi phần hiển thị, việc phối và tắt tiếng vẫn theo Dàn nhạc. Các thao tác sửa đi vào lớp đang chọn.
- Sửa giao diện, lịch phát và bộ soạn trong `index.html`, `assets/css/styles.css`, `assets/js/app.js`, `assets/js/audio.js`. Cập nhật README và kiểm tra hồi quy.

## 4. Kiểm tra và bằng chứng

| Lệnh / thao tác | Kết quả | Giới hạn |
|---|---|---|
| `npm test` | Qua 118 kiểm tra. Hai ca mới kiểm tra màu khi trùng nốt, lớp được sửa, tua khi đang phát và tiến độ sau khi tab ẩn | Dùng đồng hồ audio và sự kiện ẩn/hiện mô phỏng trong ca hồi quy |
| `npm run test:e2e` | Qua trên Chromium ở kích thước máy tính và hai chiều màn hình điện thoại. Kiểm tra nhảy đến bước 1.367 bằng Enter và quay về bước 1 bằng nút | Điện thoại mô phỏng |
| `npm run build` và HTTP | Build qua, localhost 5174 trả trang có cả hai điều khiển mới | Máy cục bộ |

## 5. Kết quả và bàn giao

- Thử khung soạn trên `http://localhost:5174/`. Bố cục cũ là chế độ mặc định khi mở trang.
- Chưa thử chuyển ứng dụng trên iOS/Android thật. Nếu hệ điều hành ngắt AudioContext, trang thử khôi phục khi quay lại.
- Chỉ sửa workspace Sky_Sheet_Piano. Chưa commit, push hoặc deploy. Đã cập nhật tiến độ và mục lục.
