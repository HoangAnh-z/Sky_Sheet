# 001 — Chuyển dự án sang Vercel + Turso

- Ngày ghi hồi cứu: **2026-11-20** (`Asia/Saigon`).
- Trạng thái: **Đã xong mã; chờ triển khai**.
- Nguồn: Hội thoại và công việc ở phiên ngay trước yêu cầu lập nhật ký; đối chiếu README, package.json và cấu trúc mã đang có.
- Đây là mốc đầu của nhật ký theo yêu cầu người dùng, không phải prompt đầu tiên trong toàn bộ lịch sử dự án.

## 1. Prompt gốc

> chốt nhé làm đi (tôi chưa dùng vercel bao giờ)

Phần người dùng chọn làm ngữ cảnh cho prompt:

> Vercel + Turso là phương án mình sẵn sàng chọn cho đồ án này nếu bạn chấp nhận thêm một dịch vụ CSDL tích hợp. Phạm vi chỉ cần ba bảng users, sessions, songs, cùng API đăng ký/đăng nhập/đăng xuất và lưu bài cá nhân.

### Các ràng buộc đã có trong hội thoại — tóm tắt

- Đồ án sinh viên, ưu tiên nhanh, gọn và miễn phí trong phạm vi môn học.
- Đăng nhập/đăng ký dùng tên đăng nhập và mật khẩu, không dùng email.
- Người dùng thấy đăng ký Firebase khó và đã cân nhắc SQLite/các nền tảng khác trước khi chốt Vercel + Turso.
- Muốn đưa cả FE, BE, CSDL lên online và quản lý thuận tiện; chấp nhận database Turso tích hợp với Vercel.

## 2. Bối cảnh và kết quả mong muốn

- Trước khi làm: ứng dụng đàn/soạn nhạc HTML/CSS/JS đã chạy GitHub Pages; đã có bản tích hợp Firebase trong workspace nhưng chưa kết nối dịch vụ thật.
- Cần thay Firebase bằng backend riêng, xác thực username thật và lưu bài cá nhân qua SQLite/Turso.
- Cần giữ chức năng nhạc hiện tại và hướng dẫn triển khai từ đầu cho người chưa dùng Vercel.
- Tiêu chí: chạy đầy đủ tại máy, có cấu hình deploy, có hướng dẫn nối DB, kiểm tra xác thực/phân quyền và nêu rõ phần cloud chưa xác minh.

## 3. Thực hiện và quyết định

- Thay Firebase bằng frontend `fetch` gọi API cùng tên miền; bỏ file cấu hình Firebase và Firestore Rules từ bản thử trước.
- Thêm một Vercel Function cho API tài khoản, phiên và bài nhạc.
- Kết nối Turso bằng `@libsql/client`; server phát triển dùng SQLite tại máy nếu không cấu hình Turso. Schema tự tạo bảng/index còn thiếu, không xóa dữ liệu khi khởi động.
- Dùng ba bảng nghiệp vụ `users`, `sessions`, `songs`; bổ sung `auth_limits` để giới hạn thử xác thực qua các lần chạy Function.
- Dùng scrypt, salt riêng, băm token phiên, cookie HttpOnly/SameSite/Secure khi deploy. Đăng xuất thu hồi phiên ở server.
- Kiểm tra chủ sở hữu ở backend, truy vấn có tham số, kiểm tra Origin và giới hạn nội dung. Chặn tab cũ ghi vào tài khoản khác khi cookie thay đổi.
- Giữ lưu khách tại máy và chức năng chép bài khách vào tài khoản. Đăng xuất dọn thư viện riêng trong bộ nhớ và đưa bài đang mở về mẫu.
- Thêm build chỉ chép FE vào `public/`, cấu hình Vercel, mẫu biến môi trường và hướng dẫn từng bước.

### File chính

| Nhóm | File và vai trò |
|---|---|
| Backend | `api/account.js`; `server/handler.cjs`, `db.cjs`, `schema.cjs`, `password.cjs` |
| Frontend | `assets/js/cloud.js`, `assets/js/app.js`, `index.html`, `assets/css/styles.css` |
| Chạy/build | `scripts/dev.cjs`, `scripts/build.cjs`, `scripts/db-init.cjs`, `vercel.json`, `package.json`, `package-lock.json` |
| Cấu hình/tài liệu | `.env.example`, `.gitignore`, `README.md` |
| Kiểm thử | `tests/smoke.cjs`, `tests/helpers.cjs`, `tests/backend.cjs`, `tests/cloud.cjs`, `tests/browser.cjs` |

## 4. Kiểm tra và bằng chứng

Các kết quả này được xác nhận bằng đầu ra công cụ trong phiên triển khai trước; **không chạy lại khi tạo bản ghi hồi cứu**.

| Lệnh / thao tác | Kết quả | Giới hạn |
|---|---|---|
| `npm test` | 63 kiểm tra qua: 26 nhạc + 25 backend + 12 frontend/API | Backend và luồng API dùng SQLite thật tại môi trường kiểm thử |
| `npm run build` | Thành công | Kiểm tra build tại máy, chưa chứng minh deploy Vercel thành công |
| `npm run test:e2e` | Chromium 1440×1000 và 390×844 qua các luồng tài khoản/thư viện; kiểm tra đăng xuất hai tab và file riêng không bị phục vụ | Dùng SQLite tạm và Chromium có sẵn; chưa chạy trên cloud |
| HTTP localhost trang chính / API session | Đều trả 200, session khách trả `user: null` | Chỉ xác nhận tại thời điểm kiểm tra trong phiên trước |
| Git ignore / kiểm tra diff | DB, env và public bị bỏ qua đúng; kiểm tra diff phù hợp CRLF qua | Chưa commit/push/deploy trong phiên đó |

## 5. Kết quả và bàn giao

- Đã có mã ứng dụng đầy đủ chạy tại máy và cấu hình Vercel/Turso; README có hướng dẫn từ đăng ký dịch vụ đến kiểm tra link.
- Đã từng bật bản thử tại `http://localhost:5173`; phiên sau phải kiểm tra lại tiến trình trước khi báo server đang chạy.
- Chưa tạo/kết nối và kiểm chứng database Turso thật; chưa có link deploy Vercel được xác nhận.
- Tại lần kiểm tra trong phiên lập nhật ký, workspace vẫn có các thay đổi mã nguồn chưa commit. Không coi phần code này đã lên GitHub chỉ vì đã có remote repository.
- Bước tiếp theo, nếu người dùng yêu cầu triển khai: kiểm tra quyền/kết nối hiện có, đưa mã lên repo, tạo/kết nối Vercel + Turso, đặt biến môi trường backend, redeploy và thử ít nhất hai tài khoản trên link thật.
- Đã cập nhật [tiến độ](../STATUS.md) và [mục lục](README.md).

## 6. Ghi chú học prompting

- Điểm rõ: quyết định nền tảng được chốt bằng cách chọn đoạn trả lời; người dùng nêu rõ chưa có kinh nghiệm Vercel.
- Điểm có thể bổ sung: phạm vi “làm đi” có bao gồm commit/push/deploy thật không, tài khoản dịch vụ đã có chưa và ai thao tác đăng ký.
- Prompt gợi ý viết lại — chỉ để tham khảo, không phải yêu cầu mới:

> Chuyển dự án Phòng Nhạc Sky sang Vercel + Turso. Giữ giao diện HTML/CSS/JS, thêm backend Node.js cho đăng ký/đăng nhập/đăng xuất bằng username và mật khẩu, lưu bài riêng từng người. Cho chạy thử tại máy bằng SQLite trước, kiểm thử phân quyền giữa hai tài khoản, rồi viết hướng dẫn deploy từ đầu vì tôi chưa dùng Vercel. Ghi rõ việc đã làm và bước còn cần tôi tạo/kết nối tài khoản; không đưa token vào Git hoặc frontend.
