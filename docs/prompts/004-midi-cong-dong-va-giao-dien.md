# 004 — Nhập MIDI, cộng đồng và cải thiện chơi đàn

- Ngày ghi: **2026-11-20** (`Asia/Saigon`).
- Trạng thái: **Đã xong mã và kiểm thử tại máy; chưa deploy online**.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [003 — Phương án nhập và cộng đồng](003-nhap-nhac-va-cong-dong.md).

## 1. Prompt gốc

> ok làm đi để phần pdf làm sau, nếu phần Bình luận, thích và theo dõi ko quá phức tạp (phải thay đổi quá nhiều kéo theo) thì thực hiện luôn, phần upload midi vẫn nên thêm vào tab bản nhạc và AI, tiện sửa vài chỗ : khi chọn Chơi các lớp có bật chơi thì 2 ô âm sắc lớp đang chọn bên trên nên mờ đi hoặc ko cho chọn chứ, về các nút bấm đàn : các nút ĐÔ: Q D B đã viền xanh rồi thì chức năng tập theo đèn đừng viền xanh như thế nữa, chuyển sang dạng viền mờ hơi dày xung quanh(nổi bật hơn trước để người tập thấy nhanh), khi phóng to trên điên thoại đang bị bé, xem xét khi bấm phóng to thì full màn hình luôn được không

## 2. Bối cảnh và kết quả mong muốn

- Triển khai phương án MIDI và chia sẻ cộng đồng đã phân tích ở 003; PDF để sau.
- MIDI nằm trong tab Bản nhạc & AI, có lựa chọn/chuyển đổi/xem trước trước khi thay nội dung đang soạn.
- Công khai bài, gắn người đăng theo session, xem/nghe/thêm bản sao vào thư viện, giữ nguồn.
- Xem xét thêm bình luận/thích/theo dõi ở phạm vi đơn giản, không yêu cầu dịch vụ realtime/thông báo riêng.
- Chế độ chơi chồng lớp làm mờ/khóa các ô chọn âm sắc của lớp đang chọn ở vùng đàn; vẫn cho sửa từng lớp trong dàn nhạc khi phù hợp.
- Tập theo đèn dùng hiệu ứng quầng/viền dày mờ khác với viền xanh nốt Đô.
- Phóng to điện thoại tăng diện tích phím và yêu cầu fullscreen khi trình duyệt hỗ trợ; có cách thu nhỏ và phương án dự phòng.

## 3. Thực hiện và quyết định

- Đã đọc hướng dẫn/bàn giao/mã hiện tại và tài liệu MIDI/Fullscreen.
- Đã làm đủ nhập MIDI, công khai/copy bài và tương tác bình luận/thích/theo dõi cơ bản bằng backend hiện có; không thêm dịch vụ realtime, thông báo hoặc OMR.

### Nhập MIDI

- Thêm `assets/js/midi-import.js`: đọc `.mid`/`.midi` tối đa 1 MB trên trình duyệt; chọn 1–8 lớp, BPM, chuyển tông ±12, chọn đoạn theo phách, tự chọn quãng tám mỗi lớp.
- Parser thật `@tonejs/midi` 2.0.28 được khóa dependency, đóng gói tại `assets/vendor/tone-midi.js` cùng giấy phép; `scripts/vendor.cjs` tái tạo khi build, không phụ thuộc CDN.
- Đầu ra theo lưới nửa phách và một BPM; báo nốt không khớp, đổi cao độ, làm tròn nhịp, nốt ngoài đoạn. Mặc định chặn áp dụng nếu có nốt không khớp, người dùng chủ động chọn bỏ qua/làm gần đúng.
- Có nghe thử riêng tối đa 30 giây, sao chép và đưa vào ô bản nhạc; chưa thay bài đang chơi cho đến khi Áp dụng. Nhập bài mới bỏ liên kết ID bản riêng đang mở để không vô tình cập nhật bài cũ.
- Giới hạn nguồn 20.000 nốt/128 lớp; đoạn nhập tối đa 256 phách/512 bước. Chưa bảo toàn trường độ riêng, pedal, pitch bend hoặc thay đổi tempo; SMPTE bị từ chối. PDF để sau.

### Cộng đồng và tương tác

- Thêm `server/community.cjs` và `assets/js/community.js`, mở rộng API hiện có. Feed phân trang/tìm kiếm, xem chi tiết, nghe thử, đưa bản chữ vào ô soạn, đăng/cập nhật/gỡ công khai từ bản đã lưu.
- Danh tính người đăng lấy từ session; metadata tác giả gốc/nguồn tách riêng. Nội dung công khai là snapshot, bài riêng vẫn riêng tư.
- Copy dùng transaction: kiểm tra bài còn công khai/quota, không nhân đôi cùng bài, tự thêm hậu tố khi trùng tên, lưu nguồn và giữ bản sao độc lập.
- Thích/bỏ thích và theo dõi/bỏ theo dõi dùng trạng thái rõ ràng, không tạo dòng trùng; bộ lọc Đang theo dõi dùng quan hệ đã lưu.
- Bình luận plain text tối đa 1.000 ký tự, phân trang, giới hạn số lượng/tốc độ; người viết hoặc chủ bài được xóa. Giao diện dùng textContent, không render HTML từ nội dung người dùng.
- Thêm 5 bảng `public_posts`, `library_sources`, `post_likes`, `follows`, `post_comments`; không đổi cột của bảng cũ. Khởi tạo schema bổ sung bảng/index còn thiếu, đã thử với DB schema cũ không mất bài.
- Bản công khai tối đa 8 lớp/1.024 bước mỗi lớp; bảo vệ thư viện 100 bài như trước. Sửa bài có ID kiểm tra sở hữu, đổi tên không làm mất nguồn; trùng tên một bản riêng khác trả xung đột.
- Header tiêu đề mới dùng `# title ...` để tên chứa `track`/`bpm` không bị hiểu nhầm là lệnh; parser vẫn nhận định dạng cũ.

### Giao diện chơi đàn

- Chế độ chồng lớp khóa/mờ ô chọn âm sắc chính, làm mờ nhãn lớp đang chọn, có hướng dẫn sửa từng lớp trong Dàn nhạc. Tên phím vẫn dùng được vì là lựa chọn chung, không phải âm sắc.
- Tập theo đèn dùng quầng tím dày mờ quanh phím; giữ nguyên viền xanh nốt Đô Q/D/B.
- Phóng to gọi requestFullscreen trên phần tử gốc khi được hỗ trợ; không gọi trực tiếp trên dialog. Có fallback khi không hỗ trợ/từ chối, xử lý promise trả về muộn sau khi đã thu nhỏ và thoát fullscreen do ứng dụng mở.
- Điện thoại dọc lưới 3×5, ngang thấp 8 cột/2 hàng; thu gọn điều khiển phụ để tăng diện tích phím. Chromium thử nghiệm đo khoảng 110 px ở 390×844, 92 px ở 844×390; đây là số đo môi trường giả lập, không khẳng định cho mọi thiết bị.
- Nghe thử dùng engine tách riêng ở `assets/js/preview.js`, không thay editor; dừng khi chơi/tập/ghi, rời tab hoặc thao tác khác cần tránh chồng âm.

## 4. Kiểm tra và bằng chứng

Các kết quả dưới đây chạy trong **phiên hiện tại**:

| Lệnh / thao tác | Kết quả | Giới hạn |
|---|---|---|
| `npm test` | **103 kiểm tra qua**: 26 nhạc, 25 backend, 12 frontend/API, 10 MIDI, 25 cộng đồng, 5 giao diện/fallback | Parser thật và SQLite thật; Web Audio/jsdom giả lập ở các unit test |
| `npm run build` | Thành công, bundle parser và giấy phép được đưa vào static assets | Chưa deploy Vercel |
| `npm run test:e2e` | Qua luồng tài khoản cũ, MIDI thật, khóa âm sắc, quầng tập, native fullscreen và cộng đồng hai tài khoản | Chromium tại máy; 1440×1000, 390×844, 844×390. Chưa kiểm tra thiết bị iPhone/Android vật lý |
| Kiểm tra ảnh chụp | Đã xem bố cục phóng to dọc/ngang, quầng tập và chi tiết cộng đồng trên điện thoại | Ảnh lưu trong thư mục tạm do test in đường dẫn; không đưa vào Git |
| Schema DB cũ | Thêm đủ bảng cộng đồng, giữ tài khoản/bài cũ | Thử trên SQLite tạm riêng, không dùng dữ liệu cá nhân để kiểm thử |
| Server phát triển | Xác minh server cũ đúng workspace đang trả 404 cho API mới, khởi động lại đúng tiến trình dự án tại 5173 | SQLite tại máy; không phải deploy cloud |
| Tài liệu | Cập nhật README, AGENTS, STATUS, mục lục và bản ghi 004; kiểm tra liên kết/diff | Không ghi token/mật khẩu thật vào nhật ký |

## 5. Kết quả và bàn giao

- Đã hoàn thành phần mã và kiểm thử cho phạm vi yêu cầu, gồm tương tác xã hội cơ bản.
- PDF/OMR để sau theo yêu cầu. Không thêm chat/thông báo/realtime hoặc các phần diễn đàn phức tạp.
- Native fullscreen tùy khả năng/quyền trình duyệt; khi không hỗ trợ vẫn dùng vùng đàn chiếm viewport. Chưa kiểm chứng phần này trên điện thoại vật lý.
- Backend mới cần khởi động lại/redeploy để bổ sung bảng cộng đồng; không cần xóa DB cũ. Server tại máy đã được khởi động lại; phiên tiếp theo cần kiểm tra còn chạy trước khi báo.
- Chưa push/commit/deploy cloud; nhiệm vụ 001 về Vercel/Turso thật vẫn còn chờ. Các thay đổi cũ trong workspace được giữ nguyên.
- Đã cập nhật tiến độ/mục lục; yêu cầu độc lập tiếp theo dùng số 005.

## 6. Ghi chú học prompting

- Yêu cầu chốt rõ PDF để sau, đặt MIDI vào tab cụ thể và mô tả lỗi giao diện có thể kiểm tra.
- Phần tương tác được ủy quyền có điều kiện về độ phức tạp; chọn triển khai các thao tác CRUD đơn giản trên stack hiện tại, không kéo thêm dịch vụ ngoài.
- Các giới hạn chuyển MIDI và fullscreen được kiểm chứng/ghi rõ thay vì cam kết giống file gốc hoặc hỗ trợ mọi điện thoại.
