# 008 — Kiểm tra link Vercel yêu cầu đăng nhập

- Ngày ghi: **2026-11-21** (`Asia/Saigon`).
- Trạng thái: **Đã trả lời**.

## 1. Prompt gốc

> [https://musicsheet-muwitzp3j-hoanganh9117-5209.vercel.app/](https://musicsheet-muwitzp3j-hoanganh9117-5209.vercel.app/) sao khi vào lại bắt đăng nhập

Người dùng đính kèm ảnh Deployment Details, trong đó bản Production có trạng thái Ready và có domain `musicsheet-azure.vercel.app`.

## 2. Kiểm tra và kết quả

- HTTP GET không dùng cookie tới URL deployment trả 302 tới `https://vercel.com/sso-api`. Với chế độ Standard Protection, URL tạo riêng cho deployment có thể bị chặn kể cả khi bản đó thuộc Production. [Tài liệu Vercel](https://vercel.com/docs/deployment-protection#standard-protection)
- Domain chính `https://musicsheet-azure.vercel.app/` trả 200 với tiêu đề Phòng Nhạc Sky. API phiên trả 200 cho khách và API Cộng đồng trả danh sách bài công khai với mã 200.
- Đề xuất dùng domain chính làm link chia sẻ. Phiên của Phòng Nhạc Sky dùng cookie riêng theo domain, thời hạn 7 ngày theo mã nguồn. Đã kiểm tra bằng yêu cầu đọc công khai. Luồng đăng nhập trên tài khoản cá nhân chưa được thử trong phiên này.
