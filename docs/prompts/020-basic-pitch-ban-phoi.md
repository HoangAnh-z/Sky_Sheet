# 020 — Basic Pitch với bản phối nhiều nhạc cụ

- Ngày ghi: 2026-11-22 (`Asia/Saigon`).
- Trạng thái: Đã trả lời.
- Nguồn: Câu hỏi tiếp nối [đề xuất 019](019-de-xuat-mp3-sang-midi.md).

## 1. Prompt gốc

> basic pitch này mà đẩy bài full có nhiều lớp nhiều nhạc cụ thì sao

## 2. Kết quả đối chiếu

- Basic Pitch có thể đọc cả file. Phạm vi 30–60 giây là đề xuất thử hiệu năng của dự án. Tài liệu TypeScript mô tả trộn stereo xuống mono và xử lý theo cửa sổ cho file dài. [Tài liệu TypeScript](https://github.com/spotify/basic-pitch-ts)
- Basic Pitch phát hiện cao độ và thời điểm, kể cả nhiều nốt đồng thời. MIDI mặc định gom nốt vào cùng nhạc cụ tổng hợp. Tùy chọn pitch bend có thể chia kênh theo cao độ, không suy ra nhạc cụ gốc. [Bộ ghi MIDI của Basic Pitch](https://github.com/spotify/basic-pitch/blob/main/basic_pitch/note_creation.py#L1545)
- Khi cần nhiều lớp, thử MT3 trực tiếp trên bản phối hoặc tách phần âm thanh bằng Demucs trước khi dùng bộ nhận diện nốt phù hợp. Trống cần hướng nhận diện riêng nếu đi theo cách tách âm thanh. [MT3](https://github.com/magenta/mt3) · [Demucs](https://github.com/facebookresearch/demucs)

## 3. Kết quả và bàn giao

- Chỉ giải thích dựa trên tài liệu và mã nguồn. Chưa đo chất lượng trên bài mẫu, chưa sửa mã ứng dụng. Đã cập nhật tiến độ và mục lục.
