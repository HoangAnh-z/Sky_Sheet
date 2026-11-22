# 009 — Tối ưu đàn trên điện thoại

- Ngày ghi: **2026-11-22** (`Asia/Saigon`).
- Trạng thái: **Đã xong mã tại máy**.
- Liên quan: [006](006-cai-tien-giao-dien-liquid-glass.md), [007](007-sua-khung-soan-va-dan-nhac.md).

## 1. Prompt gốc

> trên máy tính khá ổn, nhưng trên điện thoại (cả android lẫn ios) đang gặp hiện tượng lag, với khi phóng to cả ngang cả dọc đều mất bố cục 3 hàng mỗi hàng 5 nút, tương phản khi có nền ảnh tự tải lên đang không tốt, tối ưu đi

## 2. Bối cảnh và kết quả mong muốn

- Quy tắc CSS cũ đổi đàn phóng to thành 3 cột khi dọc và 8 cột khi ngang thấp. Phím và thanh điều khiển dùng nhiều lớp làm mờ trên nền động.
- Giữ thứ tự ba hàng phím ở mọi hướng. Tận dụng chiều rộng và chiều cao có sẵn để phím vẫn đủ lớn. Tăng khả năng đọc chữ với cả nền ảnh sáng và tối.

## 3. Thực hiện và quyết định

- CSS giữ 5 cột × 3 hàng trong fullscreen và chế độ phóng to trong trang. Trên điện thoại dùng phím chữ nhật bo góc, mỗi chiều tự giãn theo không gian còn lại.
- Trên thiết bị cảm ứng hoặc khung thấp/hẹp, dùng nền tĩnh, bỏ backdrop blur và chuyển động hover. Khi phóng to, ẩn phần trang bên dưới và dừng cuộn khung soạn. Khi tập, cập nhật cột đã đánh dấu thay vì quét lại toàn bộ khung soạn.
- Ảnh riêng dùng mặt phím tối và chữ sáng ở cả hai theme. Phím bấm đổi hồng đặc. Phím tập bằng viền tím rõ trên điện thoại.
- Ảnh mới có cạnh dài hơn 1.920 px được thu theo tỉ lệ, ảnh dung lượng lớn hoặc GIF được chuyển sang JPEG. Giữ đọc được ảnh đã lưu. Kéo thanh trượt chỉ đổi CSS, lưu giá trị khi thả và không ghi lại ảnh.

## 4. Kiểm tra và bằng chứng

- `npm test`: 115 kiểm tra qua. Chromium qua luồng tài khoản, MIDI, cộng đồng, tải ảnh 3.200 px và lưu ở 1.920 px, chơi/tập, xoay dọc sang 568 × 320 và trở về dọc trong chế độ phóng to.
- Playwright WebKit cấu hình iPhone (Windows) đã kiểm tra ảnh nền, 3 hàng × 5 phím và vùng phóng to trong trang ở 375 × 812, 812 × 375, 568 × 320 và 320 × 568. Bản WebKit trên Windows không cung cấp Web Audio. Với âm thanh giả lập, chạm một lần ghi nhận đúng một nốt và giữ tiến độ tập khi thu nhỏ. Chromium chạy cùng bộ âm thanh thực của ứng dụng.
- `npm run build` và kiểm tra diff có tính đến CRLF đều qua. Đã kiểm tra `http://localhost:5173` phục vụ đúng mã mới.
- Chưa đo độ trễ trên điện thoại vật lý.

## 5. Kết quả và bàn giao

- Thay đổi đã có trong workspace. Production cần nhận bản deploy mới để người dùng online thấy thay đổi.
