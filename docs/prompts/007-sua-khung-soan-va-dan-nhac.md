# 007 — Sửa Khung soạn nhạc và Dàn nhạc

- Ngày ghi: **2026-11-21** (`Asia/Saigon`).
- Trạng thái: Đã hoàn thành tại máy.
- Liên quan: [006 — Giao diện Liquid Glass](006-cai-tien-giao-dien-liquid-glass.md).

## 1. Prompt gốc

> đã có giao diện mới từ gemini nhưng đang bị lỗi, sửa những lỗi đó, đưa màu các nốt trong khung soạn nhạc về màu tím ban đầu, giữ im kiểu chạy hiện tại với cột bên trái khung sửa lỗi đang bị nhảy loạn, nốt chưa chạm vào khung đã sáng, khá khựng nữa; trong o dàn nhạc cũng bị bố cục lộn xộn; thống nhất chỗ chọn chơi nhiều lớp chơi 1 lớp thì ko nên còn cái tick riêng cho từng ô trong dàn nhạc nữa, bỏ tên ô nhạc cạnh chữ Chơi đàn, các phím bấm đàn sáng màu khác so với màu hiện tại đi khi được bấm vào (ở chế độ tự tải ảnh nền lên ấy)

Người dùng đính kèm ảnh giao diện đang lỗi.

## 2. Bối cảnh và kết quả mong muốn

- Khung soạn nhảy mỗi bước, cột trái phóng to và có nền trong suốt. Thanh âm lượng và ô nhạc cụ ở Dàn nhạc bị ép vào cột quá hẹp, nút S rơi xuống hàng riêng.
- Giữ cách nốt chạy về cột bên trái, cho cột phím đứng yên và sáng lúc nốt của lớp đang xem chạm mép. Nút Phát vẫn đọc các lớp theo bản phối và M/S.

## 3. Thực hiện và quyết định

- Khôi phục nốt tím cho cả hai giao diện. Cuộn theo thời gian phát trên từng khung hình và chừa đủ khoảng để nốt cuối chạm mép. Cột phím có nền đục và đổi màu tại thời điểm phát nốt của lớp đang xem.
- Dàn nhạc dùng ba hàng cho tên, nhạc cụ/quãng tám và âm lượng/M/S. Ô Chơi chỉ hiện khi bật chồng lớp, lựa chọn được giữ khi đổi qua lại. Bỏ nhãn lớp cạnh tiêu đề Chơi đàn.
- Phím đánh sáng hồng khi có ảnh tải lên. Vùng đàn ở thanh bên giữ đủ chỗ cho các phím, cuộn trong thanh bên khi cần.

## 4. Kiểm tra và bằng chứng

- `npm test`: **115 kiểm tra qua**. Kiểm tra giao diện chủ động tiến đồng hồ audio qua thời điểm trước/sau khi nốt chạm, bao gồm ô nghỉ và nốt từ lớp đệm. Kiểm tra giữ giá trị checkbox khi đổi chế độ chơi.
- Chromium: trọn bộ tài khoản và tính năng qua. Tại 1440×1000, 390×844 và 844×390, kiểm tra nốt có nhiều vị trí cuộn giữa hai bước, cột trái đứng yên, nốt cuối chạm mép, Dàn nhạc không tràn và phím đổi nền hồng khi tải ảnh. Kiểm tra màu nốt ở cả giao diện sáng và tối.
- `npm run build` và kiểm tra diff có tính đến CRLF: qua. Xác nhận localhost trả mã nguồn hiện tại. Đã xem ảnh chụp 1920×864 với MIDI 769 bước, hai lớp như ảnh lỗi.

## 5. Kết quả và bàn giao

- Có thể thử tại `http://localhost:5173` trong tab Soạn nhạc. Chưa triển khai online. Đã cập nhật README, STATUS và mục lục prompt.
