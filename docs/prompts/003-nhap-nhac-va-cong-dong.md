# 003 — Xem xét nhập MIDI/PDF và chia sẻ bài cho cộng đồng

- Ngày ghi: **2026-11-20** (`Asia/Saigon`).
- Trạng thái: **Đã trả lời — đã đánh giá phương án, chưa triển khai**.
- Nguồn: Yêu cầu trong phiên hiện tại.
- Liên quan: [001 — Vercel + Turso](001-vercel-turso.md), [tiến độ hiện tại](../STATUS.md).

## 1. Prompt gốc

> xem xét về chức năng: từ .mid/ /midi hay pdf sheet nhạc người dùng kiếm từ đâu đó tải lên hệ thống sẽ chuyển về dạng để dán vào chỗ soạn nhạc trên trang **Bản nhạc & AI**  đó, và phương án biến hệ thống thành dạng diễn đàn: ví dụ 1 người dùng sọan xong 1 bản nhạc hay tạo ra từ phương pháp upload trên thì bản đó sẽ được gắn tên người đó khi người đó muốn public cho cộng đồng ko và người dùng khác có thể thấy và thêm vào Thư viện của mình

### Bổ sung khi đang làm

- Chưa có.

## 2. Bối cảnh và kết quả mong muốn

- Đã có tài khoản và thư viện riêng trên Node.js + SQLite/Turso; chưa có nhập MIDI/PDF hoặc khu bài công khai.
- Cần đánh giá tính khả thi, luồng sử dụng và thay đổi CSDL, giữ tiêu chí nhanh/gọn/miễn phí cho môn học.
- Người dùng yêu cầu xem xét phương án; phiên này chỉ phân tích và cập nhật tài liệu, chưa triển khai tính năng ứng dụng.
- Kết quả cần có: phân biệt độ khó MIDI/PDF; nêu giới hạn đàn 15 phím và định dạng hiện tại; đề xuất cách đăng công khai, ghi người đăng và sao chép bài về thư viện cá nhân.

## 3. Thực hiện và quyết định

- Đã đọc AGENTS.md, STATUS, mục lục/bản ghi gần nhất; kiểm tra mã parser/serializer/phát nhạc, schema và API.
- Tra tài liệu gốc của Tonejs/Midi và Audiveris để đối chiếu khả năng đọc MIDI và nhận dạng khuông nhạc từ PDF/ảnh.
- Các mục dưới đây là đề xuất của agent; chưa phải quyết định triển khai được người dùng xác nhận.

### A. Nhập MIDI trước

- Đọc `.mid`/`.midi` ngay trong trình duyệt bằng thư viện như `@tonejs/midi`; không cần gửi file gốc lên Vercel hoặc lưu file nhị phân vào Turso.
- Luồng: chọn file → xem/chọn track tối đa 8 lớp, mặc định bỏ trống lựa chọn lớp trống/gõ → chọn BPM, chuyển tông/quãng tám → chuyển thành định dạng chữ hiện có → nghe thử/xem cảnh báo → sao chép hoặc đưa vào ô Bản nhạc → người dùng bấm Áp dụng và lưu.
- Bộ chuyển đổi cần xét MIDI ticks/PPQ và tempo map; đưa về lưới một BPM của ứng dụng. Không chỉ chia thời gian giây theo BPM đầu tiên rồi coi như bảo toàn mọi thay đổi tempo.
- Giới hạn hiện tại: phím gốc C4–C6 gồm nốt tự nhiên, có dịch quãng tám theo lớp; không có nốt thăng/giáng tùy ý. Một lần chuyển tông có thể giảm nốt không hỗ trợ nhưng không giải quyết được mọi bài có chromatic notes.
- Không âm thầm bỏ/làm tròn nốt. Hiển thị số nốt ngoài khả năng đàn, lệch nhịp do lượng tử hóa, lớp không nhập; người dùng chọn cách xử lý trước khi áp dụng.
- Mỗi bước hiện bằng nửa phách và chưa biểu diễn trường độ riêng từng nốt. Đầu ra là bản chuyển soạn phù hợp đàn Sky, không cam kết giống MIDI gốc. Muốn chính xác hơn phải mở rộng định dạng/bộ phát/lưới; lặp lại ký tự nốt không tương đương giữ nốt.
- Cần giới hạn dung lượng file, số nốt, số bước và dung lượng đầu ra để không làm treo trình duyệt hoặc vượt giới hạn bài đã lưu.

### B. PDF sheet nhạc là một luồng OMR riêng

- PDF chứa trang ký hiệu/ảnh, không mặc nhiên có danh sách cao độ và thời điểm nốt như MIDI. Trích văn bản PDF hoặc OCR chữ thông thường chưa đủ.
- Luồng đầy đủ: PDF/ảnh → OMR (nhận dạng ký hiệu nhạc) → MusicXML → chỉnh/sửa nhận dạng → bộ chuyển sang định dạng Sky.
- Audiveris là ví dụ nguồn mở có engine OMR, editor và xuất MusicXML. Tài liệu gốc nêu cần sửa lỗi nhận dạng, có giới hạn loại ký hiệu và không hỗ trợ bản viết tay. Không thể hứa mọi PDF tìm trên mạng đều chuyển đúng.
- Đánh giá kiến trúc: tích hợp engine OMR tự động là phần nặng nhất, không phải thêm một parser vào API Node.js hiện tại. Cần khảo sát runtime, tác vụ nền/worker hoặc dịch vụ riêng; chưa benchmark chi phí/thời gian trên hosting hiện có.
- Đề xuất cho bản môn học: MIDI + cộng đồng trước; sau đó thêm nhập MusicXML. Với PDF, ban đầu hướng dẫn chuyển OMR ngoài hệ thống rồi nhập MusicXML/MIDI; đây là phương án trung gian, không được ghi nhãn là hệ thống đã tự xử lý PDF.
- Nếu người dùng cần PDF tự động trực tiếp trên web, giữ nó thành giai đoạn có thiết kế và kiểm chứng riêng, thay vì giả lập nút tải lên đã có chức năng nhận dạng.

### C. Kho bản nhạc cộng đồng trước, diễn đàn đầy đủ sau

- Bài mới mặc định riêng tư. Chủ bài chủ động bấm Đăng công khai, xem nội dung/tên hiển thị/mô tả/nguồn rồi xác nhận đăng.
- Server lấy danh tính người đăng từ session và bảng users, không tin tên hoặc user_id tự gửi từ trình duyệt.
- Trang Cộng đồng có danh sách phân trang, tìm theo tiêu đề/người đăng, chi tiết bài, nghe thử, mở trong khung soạn và Thêm vào thư viện. Xem bài công khai có thể không cần đăng nhập; đăng/copy về tài khoản cần đăng nhập.
- Gọi đúng nhãn Người đăng hoặc Người chuyển soạn. Upload MIDI/PDF từ nơi khác không tự biến người đăng thành tác giả nhạc gốc; có trường tác giả gốc và nguồn nếu biết. Người dùng lựa chọn nội dung có thể chia sẻ.
- Bản đầu đề xuất chưa thêm bình luận/thích/theo dõi; các phần diễn đàn này làm sau khi luồng chia sẻ và copy hoạt động ổn.

### D. Dữ liệu và quy tắc bản sao

- Giữ `songs` làm thư viện riêng, thêm `public_posts` giữ snapshot nội dung đã được chủ bài đăng công khai. Không lấy thẳng toàn bộ bảng songs riêng tư làm feed.
- Trường gợi ý của `public_posts`: `id`, `user_id`, `source_song_id`, `title`, `bpm`, `text`, `description`, `original_composer`, `source_url`, `published_at`, `updated_at`, trạng thái hiển thị. Username hiển thị truy từ người dùng; không lưu tên tùy ý làm bằng chứng sở hữu.
- Khi sửa bản riêng, bản công khai không tự đổi; chủ bài dùng Cập nhật bản công khai. Có chức năng gỡ công khai, chỉ chủ bài được sửa/gỡ.
- Khi B bấm Thêm vào thư viện, API đọc bài đang công khai, tạo bản sao riêng thuộc B và gắn nguồn. B sửa/xóa bản sao không tác động bản của A. A cập nhật/gỡ bài không tự thay đổi bản sao B đã lưu.
- `songs` có thể thêm `source_post_id` và metadata nguồn tối thiểu được chụp lại để còn credit khi bài gốc bị gỡ. Không chỉ dùng một liên kết có thể mất làm toàn bộ thông tin nguồn.
- Chống thêm trùng cùng bài, không ghi đè bài đang có cùng tên: code hiện dùng `UNIQUE(user_id, title)` và lưu cùng tên là cập nhật, nên luồng copy cần quy tắc đổi tên hoặc báo đã có. Giữ giới hạn 100 bài/tài khoản hiện tại.
- Khi API đọc/copy, kiểm tra trạng thái công khai và quyền trên server; khi đăng, kiểm tra chủ sở hữu. Nội dung chuyển đổi được lưu như bản nhạc chữ hiện có, không cần lưu file nguồn trong DB ở bản đầu.
- Vì thêm cột vào songs cũ, cần migration phiên bản; chỉ thêm cột vào câu CREATE TABLE IF NOT EXISTS hiện tại sẽ không cập nhật được DB đã tồn tại. Nếu DB mới liên kết bản sao về bài công khai, gỡ bài nên xử lý xóa mềm hoặc quan hệ phù hợp để không phá thư viện cá nhân.

### E. Thứ tự triển khai đề xuất

1. Nhập MIDI + xem trước/cảnh báo + đưa vào ô Bản nhạc & AI.
2. Công khai bài + feed cộng đồng + nghe thử + copy về thư viện + ghi nguồn.
3. Nhập MusicXML; bổ sung hỗ trợ PDF OMR trực tiếp sau khi chốt cách vận hành.
4. Bình luận/thích và các chức năng diễn đàn khác nếu môn học còn thời gian.

Đây là phương án phân kỳ để giữ mục tiêu nhanh/gọn; thứ tự/phạm vi cuối cùng còn theo yêu cầu tiếp theo của người dùng.

## 4. Kiểm tra và bằng chứng

| Thao tác | Kết quả / nguồn | Giới hạn |
|---|---|---|
| Đọc `assets/js/app.js`, `assets/js/audio.js` | 15 phím nốt tự nhiên, dịch quãng tám theo lớp; lưới mỗi bước bằng nửa phách, một BPM chung; định dạng chữ chưa lưu trường độ riêng của từng nốt | Không có file nhạc người dùng để thử chuyển đổi |
| Đọc schema/API hiện tại | Có bài riêng theo người dùng; chưa có dữ liệu bài đăng cộng đồng hoặc nguồn bản sao | Chưa thay đổi schema/backend |
| Tra nguồn dự án MIDI và OMR | Xác nhận MIDI parser cung cấp notes/tracks/timing; OMR xuất MusicXML và cần kiểm tra/sửa | Không chạy engine OMR hoặc benchmark trên Vercel |
| Kiểm tra tài liệu/liên kết | Các file nhật ký và liên kết cục bộ tồn tại; diff tài liệu hợp lệ | Trong phiên hiện tại |
| Kiểm thử ứng dụng | Không chạy lại | Chỉ phân tích và sửa tài liệu |

## 5. Kết quả và bàn giao

- Đã đánh giá hai nhóm chức năng, chỉ ra mất mát khi chuyển sang đàn 15 phím, phân biệt MIDI với PDF OMR và đề xuất luồng cộng đồng/bản sao độc lập.
- Chưa thêm chức năng nhập/public/copy hoặc thay đổi schema/backend/frontend; không commit/push/deploy trong phiên này.
- Trạng thái chưa deploy Vercel/Turso của công việc 001 giữ nguyên.
- Đã cập nhật STATUS và mục lục. Yêu cầu độc lập tiếp theo dùng số 004; nếu chỉ làm rõ phương án này thì bổ sung vào bản ghi 003.

### Nguồn kỹ thuật đã đọc

- [Tonejs/Midi — tài liệu dự án](https://github.com/Tonejs/Midi): đọc MIDI trong JavaScript, trường note/tracks/timing.
- [Audiveris — tài liệu dự án](https://github.com/Audiveris/audiveris): engine OMR, chỉnh nhận dạng, xuất MusicXML.
- [Audiveris Handbook](https://audiveris.github.io/audiveris/_pages/handbook/): giới hạn nhận dạng và vai trò kiểm tra thủ công.
- [MusicXML 4.0 — ví dụ cấu trúc](https://www.w3.org/2021/06/musicxml40/tutorial/hello-world/): định dạng ký hiệu nhạc làm trung gian.

## 6. Ghi chú học prompting

- Prompt đưa ra luồng sử dụng cụ thể từ nhập file → soạn → public → người khác thêm thư viện.
- Các điểm cần chốt khi triển khai: chấp nhận chuyển đổi gần đúng đến mức nào, cách xử lý nốt ngoài khả năng đàn, PDF tự động hay chuyển ngoài hệ thống, bản sao độc lập hay liên kết theo bản gốc.
