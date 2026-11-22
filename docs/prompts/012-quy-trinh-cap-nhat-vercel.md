# 012 — Quy trình cập nhật bản Vercel

- Ngày ghi: **2026-11-22** (`Asia/Saigon`).
- Trạng thái: **Đã trả lời**.

## 1. Prompt gốc

> quy trình deploy lên vercel tiếp theo sẽ thế nào

## 2. Kiểm tra và hướng dẫn

- Workspace đang ở nhánh `upgrade1`, thay đổi giao diện mới chưa commit. `git ls-remote` xác nhận GitHub có `main` tại merge PR #1 (`85cc8d7`) và `upgrade1` tại `60daa31`.
- Với dự án Vercel đã nối GitHub và theo dõi `main` cho Production, quy trình cập nhật là commit/push `upgrade1`, xem bản Preview nếu có, tạo PR sang `main` và merge để Vercel tự build. Kiểm tra trạng thái **Ready · Production** và mở domain `musicsheet-azure.vercel.app` để thử.
- Dùng cấu hình build và biến môi trường Production hiện có. Đợt giao diện này dùng cùng database Turso. [Tài liệu Vercel](https://vercel.com/docs/git)
- Yêu cầu này chỉ hỏi quy trình. Chưa commit, push, merge hoặc deploy.
