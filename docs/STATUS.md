# Tiến độ hiện tại — Phòng Nhạc Sky

- Cập nhật: **2026-11-21**, múi giờ `Asia/Saigon`.
- Bản ghi mới nhất: [007 — Sửa Khung soạn nhạc và Dàn nhạc](prompts/007-sua-khung-soan-va-dan-nhac.md). Giao diện Liquid Glass ở [006](prompts/006-cai-tien-giao-dien-liquid-glass.md), nhập MIDI ở [005](prompts/005-midi-theo-ban-kiem-tra.md).

## Đang ở đâu?

**Đã có mã FE + BE + CSDL, giao diện Liquid Glass UI, nền chủ đề Sky, tùy chọn nền đàn, bố cục tab soạn nhạc 7:3, nhập MIDI và cộng đồng chạy/kiểm thử tại máy; chưa triển khai và kiểm chứng bản online trên Vercel/Turso.** Đã chuẩn bị hướng dẫn deploy cho người mới trong [README](../README.md#deploy-vercel--turso-lần-đầu).

| Phần | Trạng thái hiện tại |
|---|---|
| Frontend | Liquid Glass UI, nền mây trời/cực quang Sky, giữ tông màu gốc; tùy chọn nền đàn kèm chỉnh độ mờ (thường & phóng to); tab soạn nhạc 7:3; thẻ thư viện grid |
| Backend | API Node.js qua `api/account.js`, dự kiến chạy Vercel Functions |
| Database tại máy | SQLite tại `.data/sky.db` khi chạy `npm run dev` không cấu hình Turso |
| Database online | Đã viết kết nối Turso bằng `@libsql/client`; chưa xác nhận database/token thật |
| Tài khoản | Đăng ký, đăng nhập, đăng xuất bằng username/mật khẩu; không dùng email/bí danh email |
| Dữ liệu cá nhân | Lưu/mở/xóa bài, nhập bài khách; backend kiểm tra chủ sở hữu |
| GitHub Pages | Chế độ khách; không chạy API tài khoản |
| Triển khai online | Còn chờ tài khoản/kết nối dịch vụ, đưa mã lên GitHub, cấu hình Turso và deploy |
| Nhật ký học prompting | Đã thiết lập từ công việc Vercel + Turso; tiếp tục theo AGENTS.md |
| Nhập MIDI | Đã thay theo mẫu người dùng: tự tạo toàn bài, tự tìm tông/quy nốt, bảng chỉnh tên/nhạc cụ/quãng tám từng lớp; nghe thử và đưa vào ô soạn; tối đa 4.096 bước/lớp |
| PDF/OMR | Để sau theo yêu cầu, chưa triển khai |
| Bài công khai/copy về thư viện | Đã làm snapshot công khai, tìm/lọc/phân trang, nghe thử, copy riêng có nguồn, không ghi đè bài trùng tên |
| Bình luận/thích/theo dõi | Đã làm cơ bản trong cùng backend; có xóa bình luận theo quyền, lọc feed theo dõi; chưa có chat/thông báo/realtime |
| Khung soạn nhạc | Nốt tím cuộn theo nhịp phát về cột phím cố định. Cột sáng khi nốt của lớp đang xem tới mép |
| Chơi chồng lớp / tập | Ô Chơi chỉ hiện khi chọn chồng lớp. Quầng tím cho nốt tập, viền xanh cho Đô, phím đánh sáng hồng khi dùng ảnh nền riêng |
| Phóng to điện thoại | Yêu cầu native fullscreen có fallback, lưới thích ứng dọc/ngang, bảo toàn node, tiến độ và giữ nền phím đã chọn |

## Kết quả kiểm tra đã có

Kết quả mới nhất được chạy trong nhiệm vụ **007** (2026-11-21):

- `npm test`: **115 kiểm tra qua** — 26 nhạc, 25 backend, 12 frontend/API, 14 MIDI, 27 cộng đồng và 11 giao diện. Đồng hồ âm thanh giả lập xác nhận nốt chưa tới mép không làm sáng cột, nốt lớp đệm vẫn phát nhưng chỉ nốt của lớp đang xem làm sáng cột.
- `npm run build`: thành công, tạo `public/index.html` và `public/assets`; không đưa mã server/DB/bí mật vào thư mục static.
- Hai bộ Chromium `tests/browser.cjs` và `tests/features-browser.cjs` qua luồng tài khoản, MIDI, cộng đồng và fullscreen. Kiểm tra thêm trên 1440×1000, 390×844 và 844×390: nốt cuối chạm mép, cột phím đứng yên, nốt tím ở cả hai giao diện, hai hàng điều khiển Dàn nhạc thẳng hàng và màu phím khi dùng ảnh riêng.
- Đã kiểm tra bản localhost với MIDI 769 bước, hai lớp tương ứng ảnh lỗi, chụp ở 1920×864 và xem bố cục. Phiên sau cần xác minh lại server có còn chạy.
- Chưa kiểm tra deploy thật hoặc kết nối Turso thật.

Các nhiệm vụ 002/003 ghi tài liệu và phân tích. Tính năng nền thuộc 004, bộ nhập MIDI được thay trong 005, giao diện Liquid Glass được thêm trong 006 và sửa trong 007.

## Phạm vi đã triển khai và phần để sau

Người dùng đã đồng ý triển khai trong [004](prompts/004-midi-cong-dong-va-giao-dien.md), dựa trên phương án [003](prompts/003-nhap-nhac-va-cong-dong.md):

1. Đã nhập MIDI phía trình duyệt, tối đa 1 MB/20.000 nốt; chọn 1–8 lớp. Theo thay đổi 005: mặc định toàn bài, tự chuyển tông -6…+5 rồi gấp/quy nốt theo mẫu người dùng; tùy chọn đoạn 1–2.048 phách, tối đa 4.096 bước/lớp/200.000 ký tự. Bài quá dài báo lỗi, không tự cắt. Định dạng 15 phím/lưới nửa phách/một BPM không bảo toàn trường độ, pedal hoặc mọi chi tiết MIDI.
2. Đã có cộng đồng và tương tác cơ bản, người khác copy thành bản riêng có nguồn. Gỡ công khai không xóa bản sao đã lưu.
3. Đã thêm 5 bảng cộng đồng bằng khởi tạo bổ sung, không đổi cột bảng cũ. Kiểm thử xác nhận bài cũ vẫn còn. Cần restart backend/redeploy để dùng mã và schema mới.
4. PDF/OMR chưa làm theo yêu cầu người dùng; chưa triển khai MusicXML, thông báo hoặc chat riêng.

Phần triển khai Vercel/Turso thật đang chờ từ nhiệm vụ 001 vẫn còn. Mã mới đã chạy tại máy, không được coi là đã có trên bản online.

## Các quyết định cần giữ

- Ưu tiên đồ án sinh viên, triển khai gọn, dùng Vercel Hobby + Turso Free theo lựa chọn đã chốt. Kiểm tra lại điều kiện gói dịch vụ khi thực sự triển khai.
- Ba bảng nghiệp vụ: `users`, `sessions`, `songs`; bảng phụ `auth_limits` để giới hạn thử xác thực.
- Cộng đồng: `public_posts`, `library_sources`, `post_likes`, `follows`, `post_comments`; giữ snapshot và credit bản sao riêng, đăng bài luôn có hành động chủ động của chủ bài.
- Mật khẩu băm bằng scrypt; DB giữ băm token phiên; cookie HttpOnly/SameSite, Secure khi chạy Vercel. Phiên 7 ngày.
- Tối đa 100 bài/tài khoản; tên 80 ký tự, nội dung 200.000 ký tự, BPM 50–220. Lưu cùng tên cập nhật bài cũ.
- Bài khách vẫn ở localStorage, mẫu âm ở IndexedDB; không tự đồng bộ dữ liệu trình duyệt giữa tên miền GitHub Pages và Vercel.
- Đã bỏ triển khai Firebase trước đó. Không làm tiếp theo hướng dẫn Firebase cũ trong hội thoại.

## Bước tiếp theo

Chờ yêu cầu tiếp theo của người dùng; không tự triển khai chỉ vì đọc file này. Nếu tiếp tục đưa lên online:

1. Kiểm tra thay đổi Git hiện tại và đưa mã cần thiết lên repository theo phạm vi người dùng giao.
2. Tạo/kết nối tài khoản Vercel, import repo, Framework `Other`, Node 24, dùng `vercel.json` hiện có.
3. Tạo/kết nối Turso, cấu hình `TURSO_DATABASE_URL` và `TURSO_AUTH_TOKEN` ở backend Vercel; không ghi giá trị vào nhật ký/frontend.
4. Redeploy, kiểm tra tài khoản và thư viện trên link thật với ít nhất hai người dùng.
5. Ghi URL, kết quả kiểm tra và việc còn chờ vào bản ghi nhiệm vụ và file này.

Tại lúc tạo nhật ký, Git còn nhiều thay đổi mã nguồn từ công việc trước chưa commit trong workspace. Phiên này không commit/push/deploy. Ở phiên mới cần kiểm tra lại `git status`, không suy ra tình trạng remote từ ghi chú này.

## File nên mở khi tiếp tục

| Mục đích | File |
|---|---|
| Hướng dẫn chạy/deploy | [README.md](../README.md) |
| Cấu hình deploy | [vercel.json](../vercel.json), [package.json](../package.json) |
| Mẫu tên biến môi trường | [.env.example](../.env.example) |
| Điểm vào API | [api/account.js](../api/account.js) |
| Xác thực, phân quyền, bài nhạc | [server/handler.cjs](../server/handler.cjs) |
| Schema và kết nối DB | [server/schema.cjs](../server/schema.cjs), [server/db.cjs](../server/db.cjs) |
| Frontend gọi API | [assets/js/cloud.js](../assets/js/cloud.js) |
| Cộng đồng | [server/community.cjs](../server/community.cjs), [assets/js/community.js](../assets/js/community.js) |
| MIDI / nghe thử | [assets/js/midi-import.js](../assets/js/midi-import.js), [assets/js/preview.js](../assets/js/preview.js) |
| Đàn, thư viện, form tài khoản | [assets/js/app.js](../assets/js/app.js), [index.html](../index.html) |
| Kiểm thử | `tests/smoke.cjs`, `tests/backend.cjs`, `tests/cloud.cjs`, `tests/browser.cjs` |
