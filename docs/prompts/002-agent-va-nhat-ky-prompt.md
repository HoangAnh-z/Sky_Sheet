# 002 — Hướng dẫn agent và nhật ký từng prompt

- Ngày ghi: **2026-11-20** (`Asia/Saigon`).
- Trạng thái: **Đã hoàn thành**.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [001 — Vercel + Turso](001-vercel-turso.md).

## 1. Prompt gốc

> tạo 1 file agent.md để mỗi phiên mới đều đọc vào để biết đến đâu, quản lý mỗi lần promt bằng .md hay file task gì đó do tôi đang học môn promting AI, bắt đầu từ phần ngay trên bạn vừa làm bên trên luôn rồi sau đó tôi sẽ yêu cầu tiếp

### Bổ sung khi đang làm

- Chưa có yêu cầu bổ sung.

## 2. Bối cảnh và kết quả mong muốn

- Đã có mã chuyển dự án sang Vercel + Turso nhưng chưa có hướng dẫn bàn giao phiên và nhật ký prompt trong repo.
- Người dùng muốn phiên mới biết tiến độ, theo dõi từng prompt bằng file và có dữ liệu phục vụ môn học Prompting AI.
- Bắt đầu lịch sử từ phần triển khai Vercel + Turso ngay trước đó, sau đó chờ yêu cầu tiếp theo.
- Chọn tên chuẩn `AGENTS.md` cho hướng dẫn agent; dùng một file trạng thái và các bản ghi Markdown có số tăng dần để tránh trùng nội dung.

## 3. Thực hiện và quyết định

- Tạo `AGENTS.md`: thứ tự đọc khi bắt đầu phiên, lựa chọn đã chốt, quy trình ghi prompt và cập nhật bàn giao, nguyên tắc giữ bí mật và kiểm chứng kết quả.
- Tạo `docs/STATUS.md`: tiến độ ứng dụng, kiểm thử đã có, việc cloud còn chờ và các file cần mở khi tiếp tục.
- Tạo `docs/prompts/README.md` làm mục lục, `_TEMPLATE.md` làm mẫu.
- Ghi hồi cứu `001-vercel-turso.md` từ hội thoại và mã hiện tại, phân biệt kết quả của phiên trước với kiểm tra trong phiên này.
- Tạo bản ghi `002` này cho chính yêu cầu thiết lập nhật ký.
- Thêm liên kết vào README để người học và các phiên sau tìm được hệ thống ghi chép.
- Không mở rộng sang triển khai dịch vụ hoặc sửa chức năng ứng dụng trong nhiệm vụ tài liệu này.

## 4. Kiểm tra và bằng chứng

| Lệnh / thao tác | Kết quả | Nguồn / giới hạn |
|---|---|---|
| Đọc README, package.json, mã liên quan và `git status --short` | Xác nhận stack, lệnh chạy và workspace còn thay đổi chưa commit | Trong phiên hiện tại; không xác nhận remote hoặc trạng thái dịch vụ cloud |
| Kiểm tra file và liên kết tương đối trong hệ thống nhật ký | Các file và đích liên kết tồn tại | Trong phiên hiện tại |
| Kiểm tra diff phần tài liệu | Không có lỗi khoảng trắng theo quy ước CRLF của repo | Trong phiên hiện tại |
| Kiểm thử ứng dụng | Không chạy lại | Chỉ thay đổi Markdown; kết quả 63 kiểm tra và E2E trước đó được ghi rõ là kế thừa |

## 5. Kết quả và bàn giao

- Đã có hướng dẫn đầu phiên, file tiến độ, mục lục, mẫu và hai bản ghi đầu tiên.
- Yêu cầu độc lập tiếp theo sẽ dùng số **003**, sau khi kiểm tra mục lục thực tế.
- Việc Vercel/Turso còn chờ giữ nguyên ở bản ghi 001 và STATUS; tạo nhật ký không có nghĩa là đã deploy.
- Phiên này không commit/push/deploy; các thay đổi mã trước đó vẫn được giữ.
- Đã cập nhật `docs/STATUS.md` và mục lục prompt. Chờ yêu cầu tiếp theo của người dùng.

## 6. Ghi chú học prompting

- Điểm rõ: mục đích ghi nhớ giữa phiên, định dạng Markdown, lý do phục vụ môn học và mốc bắt đầu lịch sử đều được nêu.
- Điểm có thể bổ sung: mỗi yêu cầu độc lập dùng một bản ghi; câu làm rõ trong lúc đang làm cập nhật cùng bản ghi. Quy ước này đã được ghi vào AGENTS.md.
- Prompt gợi ý viết lại — chỉ để tham khảo:

> Tạo AGENTS.md hướng dẫn agent đọc tiến độ khi mở phiên mới. Tạo một file trạng thái hiện tại và thư mục ghi từng yêu cầu bằng Markdown có số thứ tự, giữ prompt gốc, việc đã làm, file thay đổi, kết quả kiểm tra và phần còn chờ. Bắt đầu từ công việc Vercel + Turso vừa hoàn thành phần mã, sau đó ghi cả yêu cầu hiện tại. Chuẩn bị mẫu cho các prompt tiếp theo và không ghi bí mật vào nhật ký.
