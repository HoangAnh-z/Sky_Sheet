# 016 — Thử mẫu thu đàn hạc, sáo, dàn dây và bộ trống

- Ngày ghi: 2026-11-22 (`Asia/Saigon`).
- Trạng thái: Đã hoàn thành bản thử tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [015 — Thử mẫu FreePats](015-thu-mau-thu-freepats.md).

## 1. Prompt gốc

> ok thử đi vẫn trên bản \_Piano trước như trên

Đoạn người dùng chọn để làm bối cảnh:

> Với hướng Sky, mình sẽ ưu tiên nâng chất lượng đàn hạc, sáo và dàn dây trước. Nếu muốn mở rộng sang phối pop, bộ trống là bổ sung đáng làm tiếp, vì hiện có bass để đệm nhưng chưa có kick, snare và hi-hat.

## 2. Bối cảnh và kết quả mong muốn

- Bản Piano đã có 20 MP3 FreePats cho piano và guitar. Các nhạc cụ trong đoạn chọn vẫn dùng âm tổng hợp, chưa có bộ trống.
- Áp dụng trên Sky_Sheet_Piano. Giữ quy trình nghe thử trước khi quyết định đưa sang Sky_Sheet.

## 3. Thực hiện và quyết định

- Thêm 30 mẫu theo cao độ cho đàn hạc, sáo và dàn dây từ VSCO 2 CE và 15 tiếng gõ từ VCSL. Cả hai nguồn dùng CC0. 45 mẫu mới có tổng 1.731.102 byte.
- Đàn hạc và trống giữ đuôi từ bản thu. Sáo và dàn dây dùng thời lượng trình phát gửi và có đoạn nhả âm. Dàn dây ghép vùng thấp cello và vùng cao violin, với nốt cao hơn D6 lấy từ mẫu D6. Kiểm tra tần số phát hiện tên WAV sáo và dây dùng quy ước quãng khác, nên chỉnh cao độ gốc và dựng lại bộ mẫu. Rút đoạn đầu rất nhỏ ở một số mẫu để âm vào sớm hơn.
- Thêm nhãn cho 15 phím gõ trong đàn và piano roll. Bộ trống phát theo từng phím ở cao độ đã thu. Lớp trống MIDI riêng có sẵn lựa chọn Bộ trống và được bật thủ công. Các tiếng gõ ngoài bộ được đếm và báo. Lớp trống không đổi tông phần giai điệu.
- Cấu hình và bộ phát nằm trong `assets/js/`. MP3, giấy phép và ghi công nằm trong `assets/audio/versilian/`. Phiên bản nguồn, tên WAV và tham số chuyển đổi nằm trong `scripts/prepare-versilian.cjs`. [Tài liệu âm thanh](../AUDIO-SOURCES.md) ghi cách thử và bảng phím.

## 4. Kiểm tra và bằng chứng

| Lệnh / thao tác | Kết quả | Giới hạn |
|---|---|---|
| `node scripts/prepare-versilian.cjs` | Dựng đủ 45 MP3 từ WAV nguồn | Dùng FFmpeg cục bộ |
| `npm test` | Qua bộ kiểm tra, gồm 15 ca MIDI | MIDI bổ sung kiểm tra kick/snare/hi-hat, nốt ngoài bộ và giữ tông phần giai điệu |
| `npm run test:e2e` | Qua Chromium ở 1440×1000, 390×844 và 844×390 | Kiểm tra giải mã các bộ, nhãn, kick/snare khác nhau và phát đúng tốc độ. Kích thước di động mô phỏng |
| `npm run build` và HTTP cục bộ | Build có đủ 65 MP3, kiểm tra file build khớp nguồn, HTTP trả 200 cho mẫu mới | Máy cục bộ |
| Giải mã FFmpeg và đối chiếu phổ với nốt gốc | 45 tệp mới có đỉnh biên độ từ 0,102 đến 0,545 trên thang chuẩn hóa. 30 nốt gốc cho thấy phổ phù hợp với nốt hoặc họa âm | Kiểm tra tín hiệu, cảm nhận âm sắc cần nghe thử |

## 5. Kết quả và bàn giao

- Nghe thử ở tab **Âm thanh** và chọn **Bộ trống** trong **Dàn nhạc** để thử đủ các phím. Bản thử chạy ở `http://localhost:5174/`.
- Cần người dùng nghe và chọn bộ phù hợp trước khi tích hợp sang Sky_Sheet. Chưa commit, push hoặc deploy.
- Đã cập nhật `docs/STATUS.md` và mục lục prompt.
