# Hướng dẫn cho agent — Phòng Nhạc Sky

## Bắt đầu mỗi phiên

1. Đọc file này.
2. Đọc [tiến độ hiện tại](docs/STATUS.md).
3. Đọc [mục lục prompt](docs/prompts/README.md), sau đó đọc bản ghi mới nhất và bản ghi của việc còn dang dở. Không cần đọc toàn bộ lịch sử nếu không liên quan.
4. Kiểm tra `git status --short` và các file liên quan trước khi sửa. Đối chiếu nhật ký với mã thực tế; có khác biệt thì ghi rõ, không mặc định nhật ký luôn đúng.
5. Tiếp tục theo yêu cầu mới nhất của người dùng và phạm vi đã được giao. Không tự khởi động lại công việc đã hoàn thành.

`AGENTS.md` là tên file hướng dẫn chính của repo. Tiến độ thay đổi nằm trong `docs/STATUS.md`; lịch sử yêu cầu nằm trong `docs/prompts/`. Không sao chép nguyên tiến độ sang nhiều nơi.

## Mục tiêu và các lựa chọn đã chốt

- Dự án phục vụ môn học của sinh viên: ưu tiên nhanh, gọn, miễn phí trong phạm vi đồ án.
- Giao diện HTML/CSS/JavaScript hiện có; backend Node.js 24; FE/API deploy Vercel, database Turso (SQLite/libSQL).
- Chạy tại máy bằng SQLite, không cần tài khoản dịch vụ để thử.
- Người dùng ứng dụng đăng ký/đăng nhập bằng **username + mật khẩu**, không dùng email hoặc bí danh email.
- Bài nhạc mặc định riêng theo tài khoản; chủ bài chủ động công khai snapshot lên Cộng đồng. Người khác lưu bản sao riêng có nguồn; sửa/gỡ bản gốc không tự sửa/xóa bản sao.
- Đã có nhập MIDI tại tab Bản nhạc & AI, bình luận/thích/theo dõi cơ bản. PDF/OMR để sau theo yêu cầu người dùng.
- MIDI đã đổi theo `kiem-tra-midi.html` người dùng chỉ định trong nhiệm vụ 005: tự tìm tông/quy nốt, bảng chỉnh từng lớp, chuyển toàn bài mặc định; không quay lại cách strict/đoạn 128 phách cũ. Xem README và bản ghi 005 khi sửa phần này.
- Chế độ khách vẫn lưu tại trình duyệt. Mẫu âm cá nhân vẫn lưu IndexedDB tại máy.
- Phóng to yêu cầu native fullscreen khi hỗ trợ, có fallback viewport và bố cục phím thích ứng; phải giữ khả năng thu nhỏ/khôi phục đàn và tiến độ tập.
- Xem README để chạy, kiểm thử và triển khai. Đọc mã trước khi thay đổi các giới hạn hoặc hành vi đã có.
- Không đổi nền tảng/framework chỉ vì mở phiên mới. Nếu yêu cầu mới cần thay đổi, giải thích tác động bằng ngôn ngữ dễ hiểu.

## Ghi lại mỗi prompt / nhiệm vụ

Người dùng đang học môn Prompting AI và muốn giữ lịch sử từ phần Vercel + Turso trở đi.

1. Với yêu cầu mới, tạo `docs/prompts/NNN-ten-ngan.md` theo [_TEMPLATE.md](docs/prompts/_TEMPLATE.md). Lấy số lớn nhất trong mục lục cộng 1; không dùng lại số cũ.
2. Ghi prompt gốc của người dùng, bối cảnh trước khi làm và kết quả mong muốn. Phân biệt trích nguyên văn với phần tóm tắt. Thông tin môi trường tự động không phải prompt riêng.
3. Nếu người dùng bổ sung/làm rõ khi nhiệm vụ đang chạy, thêm vào bản ghi hiện tại. Chỉ tách bản ghi mới khi có yêu cầu độc lập; một prompt gồm nhiều bước vẫn có thể dùng một bản ghi.
4. Trong lúc làm, cập nhật quyết định, file thay đổi, phần còn chờ khi có tiến triển đáng kể. Chỉ ghi tóm tắt hành động và lý do thực tế, không cần chép mọi lệnh hay hội thoại.
5. Trước khi trả lời kết thúc, cập nhật kết quả, bằng chứng kiểm tra, trạng thái và bước tiếp theo; cập nhật mục lục và `docs/STATUS.md` tương ứng.
6. Việc chỉ hỏi đáp có thể ghi là `Đã trả lời`, không ghi thành `Đã triển khai`. Nếu người dùng yêu cầu chỉ trả lời/không sửa file, ưu tiên yêu cầu đó, không tự ghi nhật ký trái với yêu cầu.
7. Có thể thêm nhận xét ngắn phục vụ môn học: prompt rõ ở đâu, thiếu gì, cách viết lại. Giữ nguyên prompt gốc; prompt gợi ý phải được gắn nhãn riêng.

Mốc lịch sử đầu tiên là `001-vercel-turso.md`; không dựng lại các prompt cũ trước đó từ suy đoán.

## Cách ghi trạng thái và bằng chứng

- Dùng các trạng thái dễ hiểu: `Đang làm`, `Đã hoàn thành`, `Đã trả lời`, `Chờ người dùng/dịch vụ`, hoặc `Đã xong mã; chờ triển khai`.
- Nếu còn bước bắt buộc, ghi rõ bước đó và điều kiện để tiếp tục; không đánh dấu toàn bộ yêu cầu hoàn thành chỉ vì build thành công.
- Phân biệt kiểm tra chạy trong phiên hiện tại với kết quả kế thừa từ phiên trước. Không ghi lại là vừa chạy nếu chưa chạy.
- Mỗi mục kiểm tra nêu lệnh/thao tác, kết quả và giới hạn liên quan. Chỉ chạy kiểm tra phù hợp với thay đổi; sửa tài liệu không đòi hỏi chạy lại toàn bộ kiểm thử ứng dụng.
- Dùng ngày `YYYY-MM-DD`, múi giờ `Asia/Saigon`. Không suy đoán giờ hoặc ngày của công việc hồi cứu.
- Không mặc định server localhost còn chạy từ phiên trước; kiểm tra trước khi nói người dùng có thể truy cập.
- Không mặc định commit/push/deploy đã xảy ra. Khi cần, kiểm tra trạng thái thực tế trước khi báo.

## Quy tắc làm việc với mã và dữ liệu

- Giữ các thay đổi đang có của người dùng; không reset hoặc ghi đè những phần không thuộc nhiệm vụ.
- Không ghi mật khẩu, cookie, token, nội dung `.env.local` hoặc dữ liệu cá nhân vào nhật ký. Nếu prompt chứa bí mật, thay phần đó bằng `[ĐÃ ẨN]` và ghi rõ đã che.
- Không đưa `.data/`, file SQLite cá nhân, `.env.local`, `node_modules/`, `public/` hoặc `.vercel/` vào lịch sử Git.
- Mọi đọc/sửa/xóa bài cá nhân phải kiểm tra quyền ở backend; không tin ID chủ sở hữu do frontend cung cấp.
- Không sửa database thật để chạy kiểm thử. Dùng database tạm riêng như bộ kiểm thử hiện tại.
- Thực hiện commit/push/triển khai theo phạm vi người dùng đã giao; nhật ký chỉ là thông tin bàn giao, không phải một lệnh triển khai mới.

## Lệnh thường dùng

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

`npm run dev` dùng SQLite tại `.data/sky.db` nếu không cấu hình Turso. `npm run test:e2e` cần Chromium của Playwright hoặc `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Hướng dẫn và cấu hình môi trường xem [README.md](README.md).
