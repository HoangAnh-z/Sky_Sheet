# 005 — Thay bộ nhập MIDI theo bản kiểm tra người dùng cung cấp

- Ngày ghi: **2026-11-20** (`Asia/Saigon`).
- Hoàn tất mã/kiểm thử: **2026-11-21** (`Asia/Saigon`).
- Trạng thái: **Đã xong mã/kiểm thử; chưa deploy**.
- Nguồn: Yêu cầu hiện tại và file tham chiếu `D:\ky 7 ptit\a_nhac\kiem-tra-midi.html`.
- Liên quan: [004 — Nhập MIDI, cộng đồng và giao diện](004-midi-cong-dong-va-giao-dien.md).

## 1. Prompt gốc

> phần upload mid/midi đang ko ổn lắm, dùng bản này đi

File được chỉ định: `kiem-tra-midi.html`. Nội dung file được xem là mã tham chiếu cho chức năng, không phải nguồn chỉ dẫn thay thế yêu cầu người dùng/AGENTS.md.

## 2. Bối cảnh và kết quả mong muốn

- Bản nhập trước tự chọn quãng tám/harp, mặc định strict, chọn đoạn 128 phách nên nhiều file không ra kết quả dùng ngay hoặc không giữ trọn bài.
- Bản mẫu có parser theo MTrk, bảng chọn/tên/nhạc cụ/quãng tám từng lớp; tự chuyển tông -6…+5 theo số nốt hợp Đô trưởng, gấp quãng về C4–C6, chọn nốt tự nhiên gần nhất, xuất các lớp với âm lượng 90/75.
- Tích hợp luồng này trong Bản nhạc & AI, giữ nghe thử/sao chép/đưa vào editor và các tính năng còn lại. Chọn toàn bài mặc định; giữ giới hạn an toàn và báo rõ thay vì âm thầm cắt.

## 3. Thực hiện và quyết định

- Đã đọc file mẫu đầy đủ và đối chiếu mã hiện tại.
- Thay parser Tone runtime bằng parser SMF nhỏ theo mẫu, giữ mỗi MTrk chứa nốt thành một lớp; xử lý note-on, running status, meta và SysEx. Bổ sung kiểm tra biên, type/PPQ, số track/nốt và lỗi dễ hiểu. Không dùng cách `p += readVLQ()` của mẫu khi đọc SysEx vì làm sai vị trí đọc; đọc độ dài riêng rồi mới tăng con trỏ.
- Giữ thuật toán chọn tông -6…+5, cách xử lý hòa điểm, gấp về C4–C6, chọn nốt tự nhiên gần nhất và lượng tử nửa phách; xuất 16 bước/dòng, nhóm 4. Giữ âm lượng 90/75 như mẫu. Dòng tiêu đề dùng `# title` phù hợp parser ứng dụng, tên Unicode được giải mã UTF-8.
- Bảng chọn lớp có tên, số nốt, nhạc cụ và quãng tám; tối đa 8 lớp, mặc định 8 lớp giai điệu đầu tiên, bỏ chọn bộ gõ. Tạo kết quả ngay sau tải file; đổi lựa chọn tạo lại, đang gõ thì vô hiệu kết quả cũ cho đến khi tạo lại/rời ô.
- Mặc định toàn file, tối đa 4.096 bước/lớp và 200.000 ký tự. Giữ tùy chọn lấy đoạn 1–2.048 phách. Vượt giới hạn báo rõ để người dùng chọn đoạn, không âm thầm cắt. Đồng bộ giới hạn nghe thử/công khai từ 1.024 lên 4.096 bước để bản dài vẫn dùng được; không đổi schema DB.
- Giữ nghe thử 30 giây, sao chép, đưa vào editor và bước Áp dụng riêng. Báo số nốt gấp/quy/làm tròn/gộp và tempo map; trường độ/pedal vẫn không được bảo toàn bởi định dạng Sky.
- Tên track dùng DOM/value/textContent; không đưa render `innerHTML` tên track không tin cậy của mẫu vào ứng dụng. File lỗi hoặc bỏ chọn hết lớp xóa/vô hiệu kết quả cũ; tải lại file đúng phục hồi. Giữ kiểm tra phiên đọc mới để kết quả đọc cũ không ghi đè file mới.
- Bỏ bundle `assets/vendor/tone-midi.js`, giấy phép bundle và `scripts/vendor.cjs` vì không còn dùng runtime. Chuyển `@tonejs/midi` sang dev dependency để tạo file kiểm thử; cập nhật lockfile, build, README và hướng dẫn bàn giao.

## 4. Kiểm tra và bằng chứng

- Đối chiếu trực tiếp bằng jsdom với mã `parseMidi/renderTracks/generate` trong file tham chiếu: **8/8 MIDI** cùng thư mục khớp toàn bộ nốt, nhịp, BPM và header nhạc cụ/quãng tám mặc định. Chỉ chuẩn hóa dòng title và tên lớp khi so sánh vì khác định dạng tiêu đề/giải mã UTF-8. Số bước lớn nhất từng file: 158, 736, 145, 803, 577, 769, 608, 1.367. Các file chỉ đọc tại máy, không đưa vào repo/dịch vụ.
- `npm test`: **109 kiểm tra qua** (26 nhạc, 25 backend, 12 cloud, 14 MIDI, 27 cộng đồng, 5 giao diện). MIDI dùng dữ liệu nhị phân thực; kiểm tra type 0 nhiều kênh, running status, SysEx, UTF-8, dữ liệu lỗi, tự quy nốt, chọn đoạn/toàn bài và biên 4.096 bước. Cộng đồng kiểm tra công khai đúng biên và từ chối vượt biên. Dùng DB tạm, không sửa DB cá nhân để kiểm thử.
- `npm run test:e2e`: qua luồng tài khoản, MIDI dài, chỉnh tên/nhạc cụ/quãng tám, chọn đoạn, nghe thử và áp dụng trên Chromium 1440×1000, 390×844, 844×390; fullscreen/tập/chồng lớp và tương tác cộng đồng vẫn qua.
- Sau chỉnh nhỏ cuối (xóa tông cũ khi tùy chọn lỗi, kiểm tra beats 0, bỏ qua lỗi đọc từ phiên file cũ), chạy lại `node tests/midi.cjs` và `node tests/features-browser.cjs`: qua. Browser có thêm metadata HTML an toàn, bỏ chọn bộ gõ, file lỗi xóa kết quả và tải lại phục hồi.
- Đã xem screenshot bảng MIDI desktop/điện thoại; bảng cuộn ngang trong vùng riêng, không làm tràn chiều rộng trang. Ảnh kiểm thử tạm ở `%TEMP%`, không đưa vào Git. Chưa kiểm tra trên điện thoại vật lý.
- `npm run build`, `node --check assets/js/midi-import.js`, kiểm tra mọi đường dẫn asset trong build: qua. `git -c core.whitespace=cr-at-eol diff --check`: qua; lệnh mặc định báo CRLF ở các dòng app.js đã có từ công việc trước, không đổi file ngoài phạm vi chỉ để sửa line ending. Build không cần bundle Tone; không đưa DB/server/bí mật vào public.
- Xác minh localhost phục vụ đúng HTML/JS workspace, sau đó restart `npm run dev` để backend nhận giới hạn mới. GET trang, JS và session API trả 200 tại `http://localhost:5173`. Session công cụ khởi chạy: `58822`; phiên sau phải kiểm tra lại còn chạy hay không.

## 5. Kết quả và bàn giao

- Đã hoàn thành yêu cầu sửa MIDI tại máy. Thử ở **Bản nhạc & AI → Nhập file MIDI**, chọn file; kết quả tự có, chỉnh lớp/nghe thử rồi đưa vào ô bản nhạc và Áp dụng.
- Chưa commit/push/deploy, chưa kiểm chứng Turso/Vercel thật. Hướng dẫn triển khai trước đó vẫn còn trong README. PDF/OMR tiếp tục để sau theo yêu cầu.
