# 013 — Đề xuất khung soạn dạng piano roll

- Ngày ghi: **2026-11-22** (`Asia/Saigon`).
- Trạng thái: **Đã trả lời**.

## 1. Prompt gốc

> đề xuất hướng mới, mọi thứ giữ nguyên, riêng phần đàn và khung soạn nhạc (có thể kéo theo) có thể triển khai như trang này không: [https://onlinesequencer.net/](https://onlinesequencer.net/)

## 2. Đề xuất

- Lấy cách thao tác piano roll làm tham chiếu. Cột 15 phím Sky cố định ở mép trái và bấm được. Giữ đàn 3 hàng × 5 phím cho chơi tay/phóng to, dùng bảng phối màu hiện có.
- Ưu tiên lưới rộng, kéo di chuyển nốt, zoom ngang, hoàn tác và tách thao tác vuốt với sửa trên điện thoại. Chỉ dựng cột đang thấy và một vùng đệm để giảm công việc cho bài dài.
- Bản đầu giữ `tracks[].steps` và định dạng bản chữ. Tính năng kéo dài nốt để sau vì liên quan biểu diễn trường độ, phát, nhập MIDI và đọc bài cũ. Giữ luồng tài khoản, thư viện, cộng đồng và hạ tầng.
- Đã đối chiếu `buildRoll`, `parse`, lịch phát và [tài liệu Online Sequencer](https://onlinesequencer.net/wiki/Online_Sequencer). Chưa thay đổi mã ứng dụng.
