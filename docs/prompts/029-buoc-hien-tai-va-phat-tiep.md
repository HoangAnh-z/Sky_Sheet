# 029 — Hiển thị bước hiện tại và phát tiếp

- Ngày ghi: 2026-11-24 (`Asia/Saigon`).
- Trạng thái: Đã xong mã tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.

## 1. Prompt gốc

> Chỗ đến bước trong khung soạn nhạc sửa thành bước hiện tại khung soạn nhạc đang chạy tới bước đó, vẫn có mũi tên chỉnh bước và đến, đóng khung cho nổi bật lên, bước ở đây à bước hiện tại đang chạy đến, đóng khung viền lại cho nổi bật, nút phát sau khi bấm dừng thì cũng nên có cơ chế chạy tiếp như khi ghi từ đàn

## 2. Bối cảnh và kết quả mong muốn

- Ô số trước đây thể hiện điểm do người dùng chọn, trong khi lưới vẫn cuộn qua các bước thực tế. Bấm Dừng khiến lượt phát sau quay lại điểm phát đã chọn.

## 3. Thực hiện và quyết định

- Đổi nhãn thành **Bước hiện tại**, thêm viền xung quanh ô điều khiển và đầu cột đang phát hoặc đang dừng. Số thay theo bước âm thanh vừa đến. Có mũi tên chỉnh từng bước và nút **Đến** để xác nhận.
- Trong khi sửa số, giữ giá trị đang nhập. Bấm Escape hoặc rời phần điều khiển để quay về số bước hiện tại.
- Nút **Dừng** lưu bước đang phát. **Phát tiếp** phát lại từ đầu bước đó. Chọn một bước khác sẽ đặt lại điểm phát. Khi bài tự phát hết, nút trở về **Phát**.

## 4. Kiểm tra và bằng chứng

- `npm test` qua 120 kiểm tra. Ca đồng hồ giả xác nhận số bước cập nhật theo âm thanh, lưu bước khi dừng, phát lại đúng nốt ở bước đã dừng và đổi vị trí qua mũi tên.
- `node tests/features-browser.cjs` qua trên Chromium máy tính và hai hướng điện thoại mô phỏng, gồm kiểm tra số bước, nhãn **Phát tiếp**, hai mũi tên và thao tác **Đến**.
- `npm run build` và kiểm tra diff Git qua tại máy trên `upgrade3`.

## 5. Kết quả và bàn giao

- Cập nhật README, tiến độ và mục lục. Chưa commit, push hoặc deploy.
