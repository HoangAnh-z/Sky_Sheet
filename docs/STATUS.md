# Tiến độ hiện tại — Phòng Nhạc Sky

- Cập nhật: **2026-11-24**, múi giờ `Asia/Saigon`.
- Bản ghi mới nhất: [030 — Ô trạng thái và công tắc Lặp](prompts/030-trang-thai-va-cong-tac-lap.md).

## Đang ở đâu?

**Bản Production đã chạy tại [musicsheet-azure.vercel.app](https://musicsheet-azure.vercel.app/).** Trang chính và API công khai trả 200. URL riêng của deployment trong yêu cầu 008 chuyển sang đăng nhập Vercel.

Nhánh `upgrade2` từng được merge vào `main` tại `a127c8f`. Bản sửa 022 bỏ nút **Chơi đàn** cạnh **Mở rộng lưới** và bỏ tiêu đề kế thừa khi bắt đầu bản nháp ghi từ đàn. Bản sửa 022–023 hiện có trong commit `59661ee` trên `upgrade2`. Phiên này chưa xác minh bản deploy Production. Đề xuất chuyển MP3 sang MIDI tạm dừng.

Khung soạn có nút **Soạn nhạc mới** để mở bài trống một lớp. Trang hỏi trước khi bỏ các thay đổi chưa lưu.

Bản sửa 024–028 đã có trong commit `284363c` trên `upgrade3`. **Ghi tiếp** nối vào cuối lớp đang chọn, kể cả sau bước nghỉ. Máy tính hiện hướng dẫn **Space** và **Shift**. Màn hình cảm ứng có nút **Nghỉ** và **Hợp âm** trong lúc ghi. **Soạn nhạc mới** hỏi trước nếu bản hiện tại có thay đổi chưa lưu.

Bản sửa 029 đang ở thư mục làm việc trên `upgrade3`. Ô **Bước hiện tại** cập nhật theo bài trong lúc phát, có mũi tên và nút **Đến**. **Dừng** giữ bước vừa phát để **Phát tiếp**.

Bản sửa 030 trên `upgrade3` đổi **Lặp** thành công tắc và thêm viền màu ô trạng thái phát, ghi, tập hoặc tạm dừng.

| Phần | Trạng thái hiện tại |
|---|---|
| Frontend | Liquid Glass UI, bốn bộ màu nền gradient và phím có biến thể sáng/tối. Cho chọn riêng từng màu và lưu theo trình duyệt |
| Backend | API Node.js qua `api/account.js`. API phiên và Cộng đồng trên Vercel đã trả 200 |
| Database tại máy | SQLite tại `.data/sky.db` khi chạy `npm run dev` không cấu hình Turso |
| Database online | API Cộng đồng trên Vercel đọc được danh sách. Phiên 008 kiểm tra qua API công khai |
| Tài khoản | Đăng ký, đăng nhập, đăng xuất bằng username/mật khẩu; không dùng email/bí danh email |
| Dữ liệu cá nhân | Lưu/mở/xóa bài, nhập bài khách; backend kiểm tra chủ sở hữu |
| GitHub Pages | Chế độ khách; không chạy API tài khoản |
| Triển khai online | Production có domain công khai. Dùng domain chính để chia sẻ và giữ cookie đăng nhập của app trên cùng địa chỉ |
| Nhật ký học prompting | Đã thiết lập từ công việc Vercel + Turso; tiếp tục theo AGENTS.md |
| Nhập MIDI | Tự chuyển toàn bài, chọn tông, tên, nhạc cụ và quãng từng lớp; nghe thử và đưa vào ô soạn; tối đa 4.096 bước/lớp. Nhánh `upgrade2` cho bật lớp Bộ trống trên track trống riêng |
| PDF/OMR | Để sau theo yêu cầu, chưa triển khai |
| Bài công khai/copy về thư viện | Đã làm snapshot công khai, tìm/lọc/phân trang, nghe thử, copy riêng có nguồn, không ghi đè bài trùng tên |
| Bình luận/thích/theo dõi | Đã làm cơ bản trong cùng backend; có xóa bình luận theo quyền, lọc feed theo dõi; chưa có chat/thông báo/realtime |
| Khung soạn nhạc | Piano roll 64 px/bước, kéo nốt, hoàn tác, công tắc nhiều lớp theo màu và cuộn về cột phím cố định. Bản sửa 029 hiện **Bước hiện tại** và giữ vị trí khi dừng |
| Âm thanh | Nhánh `upgrade2` đóng kèm 65 MP3 CC0 cho piano, guitar, đàn hạc, sáo, dàn dây và bộ trống. Mẫu âm cá nhân vẫn ưu tiên. [Nguồn âm](AUDIO-SOURCES.md) |
| Chơi chồng lớp / tập | Ô Chơi chỉ hiện khi chọn chồng lớp. Quầng tím cho nốt tập, viền xanh cho Đô, phím sáng vàng khi chơi |
| Phóng to điện thoại | Bản tại máy giữ 3 hàng × 5 phím cả ngang lẫn dọc, có chế độ phóng to trong trang và cùng bảng màu phím |

## Kết quả kiểm tra đã có

Kiểm tra nhánh `upgrade2` và phạm vi tích hợp được ghi tại [021](prompts/021-tich-hop-ban-piano-vao-upgrade2.md). Các mốc dưới đây là lịch sử trước khi tích hợp.

Nhiệm vụ **011** chạy `npm test` (115 kiểm tra), Chromium cho bộ tính năng và build. Kiểm tra lưu màu, đổi sáng/tối, khôi phục bộ màu và bố cục bảng màu ở 390 px.

Nhiệm vụ **010** chạy `npm test` (115 kiểm tra), kiểm tra trình duyệt cho bộ tính năng và build. Đã kiểm tra áp dụng màu, lưu qua tải lại và đổi màu từ chế độ phóng to.

Nhiệm vụ **009** (2026-11-22) chạy lại `npm test` (115 kiểm tra) và Chromium. Kiểm tra giao diện WebKit cấu hình iPhone ở cả hai hướng. Xem kết quả và giới hạn trong [nhật ký 009](prompts/009-toi-uu-dan-dien-thoai.md).

Kiểm tra cụ thể của nhiệm vụ **007** (2026-11-21):

- `npm test`: **115 kiểm tra qua** — 26 nhạc, 25 backend, 12 frontend/API, 14 MIDI, 27 cộng đồng và 11 giao diện. Đồng hồ âm thanh giả lập xác nhận nốt chưa tới mép không làm sáng cột, nốt lớp đệm vẫn phát nhưng chỉ nốt của lớp đang xem làm sáng cột.
- `npm run build`: thành công, tạo `public/index.html` và `public/assets`; không đưa mã server/DB/bí mật vào thư mục static.
- Hai bộ Chromium `tests/browser.cjs` và `tests/features-browser.cjs` qua luồng tài khoản, MIDI, cộng đồng và fullscreen. Kiểm tra thêm trên 1440×1000, 390×844 và 844×390: nốt cuối chạm mép, cột phím đứng yên, nốt tím ở cả hai giao diện, hai hàng điều khiển Dàn nhạc thẳng hàng và màu phím khi dùng ảnh riêng.
- Đã kiểm tra bản localhost với MIDI 769 bước, hai lớp tương ứng ảnh lỗi, chụp ở 1920×864 và xem bố cục. Phiên sau cần xác minh lại server có còn chạy.
- Nhiệm vụ 008 xác nhận trang và API công khai online. Đăng nhập/lưu bài cá nhân trên production chưa được kiểm tra trong phiên này.

Các nhiệm vụ 002/003 ghi tài liệu và phân tích. Tính năng nền thuộc 004, bộ nhập MIDI được thay trong 005, giao diện Liquid Glass được thêm trong 006 và sửa trong 007.

## Phạm vi đã triển khai và phần để sau

Người dùng đã đồng ý triển khai trong [004](prompts/004-midi-cong-dong-va-giao-dien.md), dựa trên phương án [003](prompts/003-nhap-nhac-va-cong-dong.md):

1. Đã nhập MIDI phía trình duyệt, tối đa 1 MB/20.000 nốt; chọn 1–8 lớp. Theo thay đổi 005: mặc định toàn bài, tự chuyển tông -6…+5 rồi gấp/quy nốt theo mẫu người dùng; tùy chọn đoạn 1–2.048 phách, tối đa 4.096 bước/lớp/200.000 ký tự. Bài quá dài báo lỗi, không tự cắt. Định dạng 15 phím/lưới nửa phách/một BPM không bảo toàn trường độ, pedal hoặc mọi chi tiết MIDI.
2. Đã có cộng đồng và tương tác cơ bản, người khác copy thành bản riêng có nguồn. Gỡ công khai không xóa bản sao đã lưu.
3. Đã thêm 5 bảng cộng đồng bằng khởi tạo bổ sung, không đổi cột bảng cũ. Kiểm thử xác nhận bài cũ vẫn còn. Cần restart backend/redeploy để dùng mã và schema mới.
4. PDF/OMR chưa làm theo yêu cầu người dùng; chưa triển khai MusicXML, thông báo hoặc chat riêng.

Xem bản ghi 008 để biết địa chỉ chia sẻ trên Vercel và những kiểm tra đã chạy trên bản online.

## Các quyết định cần giữ

- Ưu tiên đồ án sinh viên, triển khai gọn, dùng Vercel Hobby + Turso Free theo lựa chọn đã chốt. Kiểm tra lại điều kiện gói dịch vụ khi thực sự triển khai.
- Ba bảng nghiệp vụ: `users`, `sessions`, `songs`; bảng phụ `auth_limits` để giới hạn thử xác thực.
- Cộng đồng: `public_posts`, `library_sources`, `post_likes`, `follows`, `post_comments`; giữ snapshot và credit bản sao riêng, đăng bài luôn có hành động chủ động của chủ bài.
- Mật khẩu băm bằng scrypt; DB giữ băm token phiên; cookie HttpOnly/SameSite, Secure khi chạy Vercel. Phiên 7 ngày.
- Tối đa 100 bài/tài khoản; tên 80 ký tự, nội dung 200.000 ký tự, BPM 50–220. Lưu cùng tên cập nhật bài cũ.
- Bài khách vẫn ở localStorage, mẫu âm ở IndexedDB; không tự đồng bộ dữ liệu trình duyệt giữa tên miền GitHub Pages và Vercel.
- Đã bỏ triển khai Firebase trước đó. Không làm tiếp theo hướng dẫn Firebase cũ trong hội thoại.

## Bước tiếp theo

Dùng domain Production để thử luồng tài khoản và thư viện khi có yêu cầu. Trước mỗi lần cập nhật online, kiểm tra nhánh Git, cấu hình trong [README](../README.md#deploy-vercel--turso-lần-đầu), và ghi kết quả kiểm tra theo phạm vi người dùng giao.

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
