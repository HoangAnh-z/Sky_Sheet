# 026 — Phím tắt và thao tác ghi nhanh

- Ngày ghi: 2026-11-24 (`Asia/Saigon`).
- Trạng thái: Đã xong mã tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [025 — Ghi hợp âm với Shift](025-ghi-shift-va-hop-thoai-ban-nhap.md).

## 1. Prompt gốc

> sao lại thành nút thế, dùng key trên bàn phím khác key các nốt đàn ko được à, các nút nghỉ với hợp âm vẫn giữ lại cho bản điện thoại nhưng để vào ô chơi đàn cho thuận tiện soạn, thỉnh thoảng soạn vẫn khá khựng, nên thêm chú ý khoảng giây giữa 2 nốt lần bấm nút khi soạn liên tiếp đảm bảo ko bị sót nốt khi soạn

## 2. Bối cảnh và kết quả mong muốn

- Bản trước giữ nút Nghỉ và Hợp âm cạnh thanh phát. Shift chốt hợp âm bằng bàn phím. Nốt được lưu cùng lượt xử lý cuộn và vẽ lưới.
- Dùng phím riêng để nghỉ, đưa nút xuống vùng Chơi đàn cho cảm ứng và giảm việc lưới làm chậm nhận phím nhanh.

## 3. Thực hiện và quyết định

- Bắt đầu ghi tự bật bàn phím. Space chèn một bước nghỉ, Shift gom hợp âm. Chỉ lấy lần nhấn chủ động, bỏ sự kiện lặp tự động khi giữ phím.
- Đưa nút **Nghỉ** và **Hợp âm** dưới bàn đàn cho thiết bị cảm ứng. Chuyển cùng bàn đàn khi phóng to. Thêm ghi chú có thể bấm liền và cần thả phím giữa hai lần bấm cùng nốt.
- Lưu nốt ngay theo từng sự kiện và gom vẽ/cuộn theo khung hình. Khi dừng ghi, xử lý nốt cuối đang chờ vẽ và tạo bản chữ.

## 4. Kiểm tra và bằng chứng

- `npm test` qua 120 kiểm tra. Ca ghi nhanh gửi 24 lần bấm liên tiếp trước một khung hình, một sự kiện lặp do giữ phím, một lần Space và một hợp âm. Bản chữ và bản áp dụng lại giữ đủ 24 nốt, đúng hợp âm và bước nghỉ.
- `node tests/features-browser.cjs` qua trên Chromium desktop và hai hướng điện thoại mô phỏng. Đã kiểm tra Space/Shift, nút cảm ứng dưới đàn, thao tác chạm để ghi hợp âm, nút theo đàn khi phóng to và cuộn tới bước 37. Chưa đo độ trễ trên thiết bị thật.
- `npm run build` và kiểm tra diff Git qua trên nhánh `upgrade3`.

## 5. Kết quả và bàn giao

- Giữ các thay đổi 024–025 và trạng thái hộp thoại bài đang soạn. Chưa commit, push hoặc deploy. Đã cập nhật README, tiến độ và mục lục.
