# 021 — Tích hợp bản Piano vào upgrade2

- Ngày ghi: 2026-11-22 (`Asia/Saigon`).
- Trạng thái: Đã xong mã tại máy.
- Nguồn: Yêu cầu trong phiên hiện tại và các bản ghi 014–020 từ Sky_Sheet_Piano.

## 1. Prompt gốc

> thôi tạm ngưng đề xuất mới này, bản \_Piano này ok rồi, áp dụng vào bản Sky_Sheet chính này đi, đề xuất nội dung commit, cho biết 3 file .md trước bạn sửa là từ nhánh upgrade1 mà tôi vừa tạo nhánh mới upgrade2 cho cái sắp mới này r thì xử lý thế nào

## 2. Bối cảnh và kết quả mong muốn

- `Sky_Sheet` đang ở `upgrade2`. Hai nhánh `upgrade1` và `upgrade2` cùng trỏ đến `f1630f4`. Cây file của `upgrade2` giống mốc `origin/main` đã có tại máy.
- `docs/STATUS.md`, `docs/prompts/README.md` và bản ghi `013-de-xuat-khung-soan-piano-roll.md` là ba thay đổi chưa commit còn trong thư mục làm việc khi chuyển nhánh. Giữ bản ghi 013 và cập nhật tiến độ, mục lục ngay trên `upgrade2`.

## 3. Thực hiện và quyết định

- Tích hợp piano roll 64 px, kéo nốt, hoàn tác, công tắc ghép lớp theo màu, tua theo bước, phát nền trong phạm vi trình duyệt hỗ trợ và mở đàn 3 × 5.
- Đưa sáu bộ âm CC0 gồm 65 MP3, tổng 2.579.603 byte, cùng giấy phép, logic nhận diện lớp trống MIDI, bộ phát, kiểm thử và script dựng lại mẫu. [Nguồn âm](../AUDIO-SOURCES.md)
- Chuyển bản ghi thử nghiệm 014–020 để giữ lịch sử, đánh dấu MP3 sang MIDI tạm dừng. Backend, schema, cấu hình deploy và file môi trường của Sky_Sheet được giữ nguyên.

## 4. Kiểm tra và bằng chứng

| Lệnh / thao tác | Kết quả | Giới hạn |
|---|---|---|
| `npm test` | Qua 118 kiểm tra về chơi nhạc, giao diện, MIDI, tài khoản và cộng đồng | Kiểm thử dùng SQLite tạm |
| `npm run test:e2e` | Qua Chromium desktop và hai hướng điện thoại mô phỏng. Kiểm tra MIDI dài, mẫu thu, bộ trống, công tắc lớp, tua và luồng tài khoản/cộng đồng | Chưa kiểm tra thiết bị thật ở lần tích hợp |
| `npm run build` | Qua. Có 65 MP3 với tổng 2.579.603 byte trong `public/assets/audio` | Đóng gói tại máy |
| HTTP localhost cổng 5173 | Trang trả 200, máy chủ phục vụ được mẫu trống mới | Kiểm tra tại máy |
| `git -c core.whitespace=cr-at-eol diff --check` | Qua và giữ kiểu xuống dòng đang theo dõi trong repo | Kiểm tra diff chưa stage |

## 5. Kết quả và bàn giao

- Commit đề xuất: `upgrade2: Add piano roll, background playback, and sampled instruments`.
- Phần thân commit có thể ghi piano roll 64 px với tua và công tắc lớp, phát nền, sáu bộ âm CC0 và lớp trống MIDI, cập nhật tài liệu.
- Chưa stage, commit, push hoặc deploy. Đã cập nhật tiến độ và mục lục.
