# 024 — Ghi từ đàn theo từng bước

- Ngày ghi: 2026-11-24 (`Asia/Saigon`).
- Trạng thái: Đã xong mã tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [022 — Tiêu đề bản ghi](022-tieu-de-ban-ghi-va-nut-choi-dan.md).

## 1. Prompt gốc

> lúc ghi từ đàn thì khung soạn nhạc cũng nên chạy theo kịp nhịp nốt mới nhất(hiện tại đang đứng im), xem xét ghi từ đàn theo nhịp từng nút bấm đàn chứ không để nhịp tự nhảy như này nữa, nhịp nào rỗng thì có thể thay bằng nút gì đó chẳng hạn

## 2. Bối cảnh và kết quả mong muốn

- Trước đây hệ thống quy vị trí ghi theo thời gian và BPM. Bản ghi một lớp không tự cuộn vì vòng vẽ cuộn thuộc trình phát.
- Chờ thao tác, nhập nốt hoặc bước nghỉ, và cuộn tới vị trí mới nhập.

## 3. Thực hiện và quyết định

- Mỗi phím đặt một nốt và tiến một bước. **Nghỉ** chèn bước trống. Bật **Hợp âm** để gom nốt vào một bước, tắt để chốt. Các nút chỉ hiện khi ghi.
- Khung soạn đánh dấu và đưa bước vừa nhập vào vùng đang xem. Tùy chọn nghe lớp đệm và tiếng nhịp chỉ phát khi nhập đến bước tương ứng. BPM vẫn điều khiển tốc độ phát lại.
- Giữ ký hiệu `-` ở cuối lớp khi xuất hoặc mở lại bản chữ và dùng nó khi tính thời điểm kết thúc phát. Bắt đầu bản ghi vẫn tạo bản nháp riêng từ bài đã mở, chỉ thay nốt của lớp đang chọn.

## 4. Kiểm tra và bằng chứng

- `npm test` qua 120 kiểm tra. Ca mới kiểm tra hai lần bấm cùng nốt tạo hai bước, hợp âm gom đúng bước, và ký hiệu nghỉ cuối lớp còn sau khi áp dụng lại.
- `node tests/features-browser.cjs` qua Chromium desktop và hai hướng điện thoại mô phỏng. Nhập 36 bước kiểm tra lưới tự mở rộng, cuộn ngang và đánh dấu đúng bước mới nhất. Bản chữ chứa đúng các bước nghỉ đã nhập.
- `npm run build` và kiểm tra diff Git qua tại máy, nhánh `upgrade2`.

## 5. Kết quả và bàn giao

- Cập nhật README, tiến độ và mục lục prompt. Chưa commit, push hoặc deploy trong phiên này.
