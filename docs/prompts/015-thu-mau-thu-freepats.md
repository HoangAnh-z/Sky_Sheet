# 015 — Thử mẫu thu FreePats trên bản Piano

- Ngày ghi: **2026-11-22** (`Asia/Saigon`).
- Trạng thái: **Đã xong bản thử tại máy**.

## 1. Prompt gốc

> ko tự thu được, có nguồn chất lượng thì lấy thôi, làm thử trên bản _Piano rồi thấy ổn mới làm vào bản chính này, .md quản lý đầy đủ

## 2. Thực hiện

- Lấy đúng hai bộ FreePats CC0 đã đề xuất cho vòng thử đầu: Upright Piano KW và Spanish Classical Guitar. Chọn 20 nốt gốc từ SFZ và tạo MP3 web 848.501 byte.
- Trình phát chọn mẫu gần cao độ cần, dùng cùng bộ cho đàn/phát/nghe thử. Tab Âm thanh có nút so trực tiếp với âm tổng hợp. Mẫu cá nhân vẫn ưu tiên. Giữ cấu trúc bài, trường độ và CSDL hiện tại.
- [AUDIO-SOURCES.md](../AUDIO-SOURCES.md) ghi nguồn, phiên bản, checksum, giấy phép, các nốt, công thức xử lý và bước đưa sang bản chính. Có thông tin tác giả và bản CC0 cạnh file nhạc.

## 3. Kiểm tra

- `npm test`: 115 kiểm tra qua. Các bài giả lập âm thanh vẫn dùng cấu hình rỗng để kiểm tra âm tổng hợp và IndexedDB. Bản thu thật được kiểm tra trên Chromium.
- `node tests/features-browser.cjs`: qua ở 1440×1000, 390×844 và 844×390. Kiểm tra giải mã hai bộ, phát mẫu và âm tổng hợp từ hai nút C4, chọn đúng mẫu khi chuyển nốt, mẫu cá nhân và khôi phục, nghe MIDI bằng mẫu chung, cùng các luồng hiện có.
- `npm run build`: qua, có đủ 20 MP3 trong `public/`. Đã giải mã và kiểm tra biên độ từng file bằng FFmpeg. Không có đỉnh chạm 0 dBFS trong lượt đo mono. Đã kiểm tra localhost phục vụ đúng file mã và MP3 của workspace Piano.
- Chưa có đánh giá nghe trên điện thoại vật lý. Chờ người dùng nghe và chốt trước khi tích hợp sang bản chính.

## 4. Bàn giao

- Thử ở `http://localhost:5174`, tab **Âm thanh**, chọn Piano hoặc Guitar. Bản chính chưa nhận các thay đổi này. Chưa commit, push hay deploy.
