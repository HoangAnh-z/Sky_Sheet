# 019 — Đề xuất chuyển MP3 sang MIDI

- Ngày ghi: 2026-11-22 (`Asia/Saigon`).
- Trạng thái: Đã trả lời.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [005 — MIDI theo bản kiểm tra](005-midi-theo-ban-kiem-tra.md).

## 1. Prompt gốc

> đang có đề xuất là sẽ upload file nhạc mp3 lên để có thể gọi api chuyển sang mid midi từ 1 trang nào đó free hoặc sử dụng mã nguồn mở github để chuyển, thử tìm kiếm và đề xuất

## 2. Bối cảnh và kết quả mong muốn

- Sky_Sheet_Piano có luồng đọc MIDI, chọn lớp và BPM, nghe thử, đưa bản chữ vào khung soạn. Máy chủ Vercel và cơ sở dữ liệu Turso là hướng triển khai hiện tại.
- Tìm lựa chọn miễn phí, phù hợp đồ án, và đề xuất cách nối vào bản Piano.

## 3. Phương án

- Đề xuất chạy Basic Pitch TypeScript trong trình duyệt, giấy phép Apache 2.0. Bản thử ưu tiên MP3/WAV có một nhạc cụ hoặc giọng hát tách riêng, kể cả nốt chồng như hợp âm piano. Mô hình trả về cao độ và thời điểm nốt. BPM lưới do người dùng nhập hoặc chỉnh trước khi chuyển. Xuất được MIDI và dùng lại luồng chọn lớp, quy nốt, nghe thử, áp dụng. Tải mô hình theo nhu cầu, thử đoạn 30–60 giây để đo hiệu năng điện thoại, rồi cân nhắc tăng giới hạn. [Kho TypeScript](https://github.com/spotify/basic-pitch-ts) · [Kho mô hình và giới hạn](https://github.com/spotify/basic-pitch) · [Demo chính thức](https://basicpitch.spotify.com/)
- Klangio có API cho lập trình viên với gói thuê bao. Bản dùng thử trên web thuộc sản phẩm riêng. Audio-to-MIDI.io có trang miễn phí để tự xuất MIDI, chưa xác minh API công khai phù hợp để nhúng. [Klangio API](https://klang.io/api/) · [Audio-to-MIDI.io](https://audio-to-midi.io/)
- Nếu cần MIDI nhiều nhạc cụ từ bản phối, hướng nghiên cứu nặng hơn là MT3 hoặc tách các phần âm thanh bằng Demucs rồi chạy mô hình theo từng phần. Tách bản ghi thành các phần âm thanh chưa tạo MIDI. [Magenta MT3](https://github.com/magenta/mt3) · [Demucs](https://github.com/facebookresearch/demucs)

## 4. Kiểm tra và bằng chứng

- Đối chiếu tài liệu upstream và mã `assets/js/midi-import.js`. Giới hạn nhập MIDI hiện tại là 1 MiB, 20.000 nốt và 4.096 bước/lớp. Bản chữ Sky lượng tử hóa nhịp và quy về 15 phím.
- Tra cứu tài liệu tính năng và thanh toán của Klangio. Chưa chạy thử mô hình trên các bản thu của dự án hoặc đo tốc độ di động.

## 5. Kết quả và bàn giao

- Đã ghi phương án và nguồn. Chưa triển khai hoặc thay đổi mã ứng dụng. Chờ người dùng chốt bản thử trên Piano.
