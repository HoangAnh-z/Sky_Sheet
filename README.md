# Phòng Nhạc Sky

Ứng dụng HTML/CSS/JavaScript với backend Node.js và SQLite/Turso. Deploy FE và API lên Vercel; CSDL dùng Turso Free. Tài khoản chỉ dùng **tên đăng nhập + mật khẩu**, không dùng email.

Theo dõi công việc và môn học Prompting AI: [hướng dẫn agent](AGENTS.md) · [tiến độ hiện tại](docs/STATUS.md) · [nhật ký từng prompt](docs/prompts/README.md).

## Chạy thử đầy đủ tại máy (không cần Vercel/Turso)

Cài [Node.js 24 LTS](https://nodejs.org/), mở terminal trong thư mục dự án rồi chạy:

```sh
npm ci
npm run dev
```

Mở **http://localhost:5173**. Có thể đăng ký, đăng nhập, đăng xuất và lưu bài ngay. SQLite tự tạo tại `.data/sky.db`, dữ liệu vẫn còn sau khi tắt/mở server. Dừng server bằng Ctrl+C. File DB đã được bỏ qua trong Git.

Chỉ muốn chơi và lưu tại trình duyệt, không dùng tài khoản: có thể tiếp tục dùng server tĩnh:

```sh
python -m http.server 5173
```

Sau đó mở http://localhost:5173. Dừng server bằng Ctrl+C.

## Bố cục và cách chơi

- Thanh phát/ghi luôn ở ngoài các tab. Máy tính dùng bố cục hai cột theo chiều cao màn hình; điện thoại xếp dọc, thanh phát/ghi bám trên cùng. Danh sách nhiều lớp và bản nhạc dài cuộn trong vùng riêng.
- **Soạn nhạc**: khung piano roll có cột phím cố định để nghe nốt, kéo nốt, hoàn tác và cột 64 px. **Đến bước** nhảy đến vị trí cần sửa hoặc tua ngay khi đang phát. Công tắc **Hiện tất cả lớp** ghép nốt theo màu, kể cả khi trùng ô. Sửa nốt và hoàn tác áp dụng cho lớp đang chọn. Trên điện thoại, bật **Sửa nốt** trước khi chạm hoặc kéo nốt.
- **Soạn nhạc mới** mở một bài trống có một lớp đàn hạc. Nếu bài hiện tại có thay đổi chưa lưu, trang hỏi trước khi bỏ bản đang sửa. Bài đã lưu vẫn nằm trong Thư viện.
- **Dàn nhạc**: nút tròn chọn lớp để chơi và soạn. M tắt tiếng, S nghe riêng. M vẫn có hiệu lực khi bật S. **Mở rộng lưới** ẩn đàn bên trái trên màn hình rộng. Dùng **Phóng to** trong mục **Chơi đàn** để mở bàn phím toàn màn hình khi được hỗ trợ.
- **Thư viện**: bài mẫu, bài lưu tại máy khi dùng khách, hoặc thư viện riêng theo tài khoản khi đăng nhập. Có bài Ode to Joy ba lớp để thử.
- **Bản nhạc & AI**: nhập/xuất dạng chữ, nhập file MIDI ngay tại máy, lưu/chia sẻ bài và tạo lời nhắc cho AI. Không có yêu cầu tới dịch vụ AI trong trang.
- **Cộng đồng**: tìm bài/người đăng, nghe thử, lưu bản sao về thư viện, thích, theo dõi và bình luận. Cần chạy backend để dùng; MIDI và chế độ khách vẫn dùng được trên trang tĩnh.
- **Âm thanh**: thay mẫu âm theo từng nhạc cụ.
- Sáng/tối: nút ở góc phải, lựa chọn được lưu trong trình duyệt. Lần đầu theo giao diện hệ thống.
- **Bật chơi bằng bàn phím**: bấm nút dưới đàn để kích hoạt QWERT / ASDFG / ZXCVB và mở âm thanh. Mỗi lần mở trang, bàn phím bắt đầu ở trạng thái tắt; bấm trực tiếp lên đàn luôn hoạt động. Khi nhập tên/bản nhạc, phím đàn tạm dừng để bạn gõ bình thường; bấm lên đàn để tiếp tục. Sau khi đổi lựa chọn âm sắc/chế độ, trang tự bỏ focus khỏi danh sách để phím đàn nhận lại ngay. Phím dựa trên vị trí vật lý để bộ gõ tiếng Việt không làm đổi nốt.
- **⛶ Phóng to** mở đàn với **3 hàng, mỗi hàng 5 phím** ở cả chiều ngang và dọc. Trình duyệt có thể mở fullscreen gốc hoặc phóng to trong trang. Các nút Phát/Ghi/Tập theo đèn và Lặp vẫn dùng được. **✕ Thu nhỏ** trả đàn về vị trí cũ và giữ tiến độ tập.
- **Màu sắc** phối màu phím và nền gradient theo bốn bộ: tím lavender mặc định, xanh bạc hà, xanh trời và hồng đào. Có thể tự chọn từng màu hoặc bấm **Dùng màu của bộ** để khôi phục. Các màu tự điều chỉnh theo giao diện sáng/tối và được lưu trên trình duyệt.

Ba cách chơi nhiều lớp:

1. **Chồng âm sắc**: mục “Khi bấm đàn” → “Chồng các lớp có bật Chơi”. Ô **Chơi** hiện trong Dàn nhạc khi bật chế độ này. Một phím phát cùng nốt trên các lớp đã tích, theo quãng tám, âm lượng và M/S của từng lớp. Chỉnh nhạc cụ ở từng thẻ trong Dàn nhạc. Có thể bấm nhiều phím cùng lúc hoặc dùng nhiều ngón trên màn hình cảm ứng.
2. **Chơi trên nền**: bấm Phát để chạy bản phối, rồi tự chơi lớp đang chọn. Để tránh trùng giai điệu có sẵn, bật M ở lớp giai điệu cũ rồi thêm một lớp mới để tự đàn. M tắt cả phần phát và tiếng đàn tay của lớp đó.
3. **Ghi từng bước**: chọn lớp rồi bấm **Ghi từ đàn** nếu lớp trống, hoặc **Ghi tiếp** để nối sau nốt hoặc bước nghỉ cuối. **Dừng ghi** giữ đoạn vừa nhập. Dùng **Soạn nhạc mới** để mở bài trống, hoặc **Xóa lớp này** để làm lại riêng lớp đang chọn. Mỗi lần bấm ghi một bước. Dùng **Space** để nghỉ, giữ **Shift** khi bấm các nốt cần ghi cùng cột rồi thả để chốt hợp âm. Trên điện thoại, hai nút **Nghỉ** và **Hợp âm** nằm ngay dưới các phím trong **Chơi đàn**. Khung soạn cuộn tới bước vừa ghi. Nếu ghi từ bài đã mở, bạn có thể đặt tên cho bản nháp trong **Bản nhạc & AI** rồi lưu thành bài khác. Rời tab trình duyệt dừng lượt ghi.

### Tập theo đèn

Chọn bài, chọn lớp cần tập rồi bấm **Tập theo đèn** trên thanh điều khiển. Các phím cần bấm có **quầng tím mờ, dày và sáng quanh phím**, khác với viền xanh cố định của nốt Đô Q/D/B; bấm đúng đủ nốt sẽ chuyển sang bước kế tiếp. Hợp âm có thể bấm đồng thời hoặc lần lượt; những nốt đã bấm được đánh dấu riêng. Bấm sai vẫn phát âm nhưng không chuyển bước. Có thể dùng bàn phím (được tự kích hoạt khi bắt đầu tập), chuột hoặc cảm ứng.

Chế độ này chờ người chơi, không ép theo BPM và không tự phát phần đệm. Ô nghỉ được bỏ qua. Dòng dưới đàn hiển thị lớp, tiến độ và các phím còn cần bấm; cột tương ứng cũng được đánh dấu trên khung soạn nhạc. Muốn tập từ giữa bài, bấm đầu cột để chọn điểm bắt đầu trước khi bật tập. Bật **Lặp** để quay lại đầu đoạn đã chọn; tắt Lặp để dừng khi hoàn thành. Nút **Dừng tập** kết thúc bất cứ lúc nào.

Đổi bài/lớp, sửa nốt hoặc điểm bắt đầu sẽ kết thúc lượt tập để tránh gợi ý cũ. Bấm Phát hoặc Ghi cũng kết thúc tập và chuyển sang chức năng tương ứng. Các nốt gợi ý chỉ theo lớp đang chọn; lựa chọn chơi chồng âm sắc vẫn áp dụng cho tiếng đàn tay.

## Nhập MIDI trong Bản nhạc & AI

1. Mở tab **Bản nhạc & AI → Nhập file MIDI**, chọn `.mid` hoặc `.midi`. File được đọc trên trình duyệt, không gửi bản gốc lên server.
2. File tự chuyển ngay theo cách xử lý của `kiem-tra-midi.html` người dùng cung cấp. Bảng cho chọn 1–8 lớp, sửa tên, nhạc cụ và quãng tám từng lớp. Track không có nốt được bỏ khỏi bảng; bộ gõ không được chọn mặc định. Tối đa 1 MB, 20.000 nốt và 128 track nguồn.
3. Tự tìm tông trong -6…+5 bán âm, gấp nốt giai điệu về C4–C6 rồi chọn nốt tự nhiên gần nhất. Nhạc cụ mặc định cho lớp có cao độ là bass/quãng -1 ở lớp thấp, piano ở lớp đầu, dàn dây ở lớp thứ hai, đàn hạc ở các lớp tiếp. Nếu bật lớp MIDI chỉ có trống ở kênh 10, các tiếng General MIDI được ánh xạ sang **Bộ trống**, phần giai điệu giữ cách tính tông riêng. Bạn có thể thay tên bài, BPM 50–220 và các thiết lập lớp.
4. Mặc định chuyển **Toàn bộ file**, tối đa 4.096 bước/lớp và 200.000 ký tự. Bài quá dài được báo để chọn **Chỉ một đoạn** (điểm bắt đầu theo phách, độ dài 1–2.048 phách); không tự cắt bài. Thay lựa chọn sẽ tạo lại kết quả; khi đang gõ, bấm **Tạo bản nhạc** hoặc rời ô để cập nhật.
5. Xem báo cáo gấp quãng, quy nốt gần nhất, làm tròn nhịp, gộp nốt trùng và ngoài đoạn; nghe thử tối đa 30 giây. Sau đó bấm **Đưa vào ô bản nhạc**, kiểm tra rồi bấm **Áp dụng**, **Lưu bài**.

Đưa vào ô chữ chưa thay bài đang chơi cho đến khi Áp dụng. Chuyển đổi dùng ticks/PPQ, đưa về lưới nửa phách và một BPM chung: trường độ riêng, pedal, pitch bend, rubato/tempo map không được giữ nguyên. Đây là bản chuyển soạn cho đàn Sky, không phải trình phát MIDI chính xác. MIDI dùng đồng hồ SMPTE chưa được hỗ trợ. PDF/nhận dạng ký hiệu nhạc để giai đoạn sau.

Parser nằm ngay trong `assets/js/midi-import.js`, dựa trên bản tham chiếu và giữ mỗi MTrk thành một lớp như bản đó. Có kiểm tra độ dài, running status, SysEx và giới hạn đầu vào; tên track dùng DOM an toàn và hỗ trợ UTF-8. Không cần thư viện/CDN MIDI ở runtime; `@tonejs/midi` chỉ là dev dependency để tạo file nhị phân kiểm thử.

## Công khai bài, thư viện cộng đồng và tương tác

- Bài mới mặc định riêng tư. Lưu vào tài khoản, rồi chọn **Công khai** cạnh bài trong Thư viện hoặc **Đăng bài đã lưu** trong Bản nhạc & AI. Chọn bài đã lưu, thêm mô tả/tác giả gốc/nguồn nếu có và tích xác nhận chia sẻ.
- Người đăng lấy từ phiên đăng nhập ở server. Giao diện phân biệt người đăng với tác giả nhạc gốc. Bài công khai có tối đa 8 lớp, 4.096 bước mỗi lớp và các token hợp lệ để tránh tải bản quá lớn lên khung soạn.
- Bản công khai là snapshot. Sửa/lưu bản riêng không tự đổi bài đăng; dùng Đăng/cập nhật lại để thay bản công khai. Mỗi người có tối đa 100 bài đang công khai.
- Tab **Cộng đồng** có tìm theo tiêu đề/username, phân trang 20 bài, bộ lọc Tất cả / Đang theo dõi / Bài tôi đăng, nghe thử tối đa 30 giây, chi tiết và đưa bản chữ vào ô soạn.
- Khách được xem/nghe bài công khai. Đăng nhập để thích/bỏ thích, theo dõi/bỏ theo dõi, bình luận và thêm vào thư viện. Theo dõi chỉ dùng để lọc feed, chưa có thông báo hoặc chat riêng.
- **Thêm vào thư viện** tạo bản sao độc lập, giữ người chia sẻ/tác giả gốc/nguồn. Thêm lại cùng bài không nhân bản; nếu trùng tên bài riêng khác thì tự thêm hậu tố `(1)`, `(2)`… và không ghi đè. Giới hạn 100 bài/tài khoản vẫn áp dụng.
- Mở bài đã lưu rồi đổi tên/lưu sẽ giữ ID và nguồn; đổi sang tên bài riêng khác đã có sẽ báo xung đột. Với bài mới chưa có ID, lưu cùng tên giữ hành vi cập nhật như trước.
- Chủ bài có thể gỡ công khai; bản sao người khác đã lưu vẫn còn. Xóa bản riêng cũng không tự gỡ snapshot đã công khai; gỡ tại Cộng đồng/Bài tôi đăng khi muốn ngừng chia sẻ.
- Bình luận thuần văn bản, tối đa 1.000 ký tự, phân trang 20, tối đa 500/bài. Người viết hoặc chủ bài được xóa bình luận. API có giới hạn tốc độ cho đăng bài/tương tác; chưa có kiểm duyệt tự động.

CSDL thêm 5 bảng: `public_posts`, `library_sources`, `post_likes`, `follows`, `post_comments`. Các bảng cũ không đổi cột. Khi khởi động lại backend hoặc redeploy, schema bổ sung bảng/index bằng `CREATE ... IF NOT EXISTS`, giữ dữ liệu cũ; không cần xóa database hoặc reset tài khoản.

## Nguồn âm và thay âm thủ công

Piano và guitar dùng mẫu FreePats. Đàn hạc, sáo và dàn dây dùng VSCO 2 CE. Bộ trống dùng 15 tiếng VCSL. Các mẫu đều là CC0 và được đóng kèm trang. Các nhạc cụ còn lại dùng âm tổng hợp Web Audio. Mở **Âm thanh** để nghe và so sánh bộ thu với âm tổng hợp. Chọn **Bộ trống** trong **Dàn nhạc** để chơi Q (kick), W (snare), E (hi-hat kín), R (hi-hat mở) và các tiếng còn lại. [Nguồn âm và sơ đồ phím](docs/AUDIO-SOURCES.md)

### Nạp file trên giao diện

Trong tab Âm thanh, chọn âm sắc cần thay, chọn nốt gốc, rồi nạp file WAV/MP3/OGG hoặc định dạng trình duyệt hỗ trợ. Dùng file thu một nốt sạch dài 0,03–10 giây, tối đa 10 MB. Nếu file thu C4 thì chọn C4. Trang lưu mẫu vào IndexedDB nếu trình duyệt cho phép; nếu không, chỉ dùng trong phiên hiện tại và sẽ thông báo.

Mẫu thay cho **mọi lớp dùng cùng âm sắc**, bao gồm phát bản nhạc và chơi tay. Bản nhạc dạng chữ không chứa file âm thanh. “Khôi phục mặc định” xóa mẫu cá nhân của nhạc cụ đó và trở lại bộ âm cấu hình của trang, hoặc âm tổng hợp khi chưa cấu hình.

Đổi cao độ dùng `playbackRate`, nên tốc độ và độ dài mẫu cũng thay đổi. Mẫu cá nhân dùng một nốt gốc, còn bộ thu nhiều mẫu sẽ chọn nốt gốc gần nhất. Bộ trống dùng âm thanh cố định theo từng phím.

### Bộ âm dùng chung khi deploy

Đặt file, ví dụ `assets/audio/piano-c4.wav`, rồi sửa `assets/js/audio-config.js`:

```js
window.SKY_AUDIO_CONFIG = {
  piano: { url: 'assets/audio/piano-c4.wav', rootMidi: 60 },
  guitar: { url: 'assets/audio/guitar-c4.mp3', rootMidi: 60 },
};
```

`rootMidi`: C3=48, C4=60, A4=69, C5=72. Xem mã âm sắc trong `assets/js/instruments.js`. Đường dẫn tương đối tính từ `index.html` để dùng được dưới đường dẫn repository của GitHub Pages. Giữ đúng chữ hoa/thường của tên file và dùng file bạn có quyền chia sẻ.

Mẫu cá nhân đã lưu được ưu tiên hơn cấu hình chung. Muốn nghe bộ âm mới của trang, bấm Khôi phục mặc định cho nhạc cụ tương ứng. Nếu file cấu hình tải/giải mã thất bại, trang thông báo và tiếp tục dùng âm tổng hợp.

## Cấu trúc

```text
index.html                     Giao diện chính
assets/css/styles.css          Bố cục, responsive, hai giao diện
assets/js/theme.js             Khôi phục giao diện trước khi vẽ trang
assets/js/instruments.js       Thông số âm tổng hợp
assets/js/audio.js             Bộ tổng hợp, phát mẫu, âm lượng và M/S
assets/js/audio-config.js      Khai báo bộ âm dùng chung
assets/js/samples.js           Nạp file và lưu/khôi phục bằng IndexedDB
assets/js/app.js               Đàn, soạn, phát/ghi, thư viện và tab
assets/js/cloud.js             Gọi API tài khoản/thư viện bằng fetch
assets/js/community.js         Feed, công khai, bình luận, thích và theo dõi
assets/js/midi-import.js       Chọn file/lớp, chuyển MIDI và báo cáo giản lược
assets/js/preview.js           Nghe thử riêng, không thay bài đang soạn
assets/audio/                 Bộ mẫu CC0 và giấy phép đi kèm
api/account.js                Vercel Function: đăng ký/đăng nhập/bài nhạc
server/handler.cjs             Xác thực, phiên đăng nhập, phân quyền, giới hạn thử
server/community.cjs           API bài công khai, bản sao và tương tác
server/schema.cjs              Schema SQLite/Turso, tự tạo bảng lần đầu
scripts/dev.cjs                Server phát triển + SQLite tại máy
scripts/build.cjs              Chép riêng FE vào public/ để deploy
vercel.json                    Cấu hình build và Function
.env.example                   Mẫu biến môi trường Turso
assets/audio/                  File mẫu âm tùy chọn
.nojekyll                      Phục vụ trang tĩnh trực tiếp
```

## Deploy GitHub Pages

https://hoanganh-z.github.io/Sky_Sheet/

1. Đưa `index.html`, `assets/` và `.nojekyll` vào thư mục gốc repository GitHub. Không cần Node/npm hay lệnh build.
2. Vào **Settings → Pages → Build and deployment**, chọn **Deploy from a branch**.
3. Chọn branch `main` và thư mục **/(root)**, rồi **Save**.
4. Chờ GitHub xuất bản; trang thường nằm ở `https://<username>.github.io/<repository>/`.

Tài liệu chính thức: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

GitHub Pages chỉ phục vụ chế độ khách (chơi đàn và lưu tại máy). **Đăng ký/đăng nhập và đồng bộ tài khoản dùng link Vercel sau khi triển khai ở phần dưới.** Frontend tự nhận biết khi không có API và không tạo tài khoản giả ở trình duyệt.

## Deploy Vercel + Turso lần đầu

Chỉ cần gói **Vercel Hobby** và **Turso Free** cho phạm vi môn học. Tài khoản dịch vụ của chủ dự án có thể cần email để đăng ký; **người dùng Phòng Nhạc Sky không cần email**. Database do Turso lưu, FE/API chạy trên Vercel và cùng một tên miền. Không cần mua domain.

### 1. Đưa mã mới lên GitHub

Commit và push các thay đổi của dự án lên repository `HoangAnh-z/Sky_Sheet`. Không đưa `.env.local`, `.data/` hoặc token lên GitHub. Có thể dùng giao diện Source Control của IDE; `package-lock.json` nên được commit cùng `package.json`.

### 2. Tạo website trên Vercel

1. Mở [vercel.com/signup](https://vercel.com/signup), chọn đăng ký/đăng nhập bằng GitHub, dùng gói **Hobby**.
2. Trong dashboard, chọn **Add New → Project**, rồi **Import** repository `Sky_Sheet`. Nếu chưa thấy repo, cấp quyền GitHub cho đúng repository đó.
3. Kiểm tra **Framework Preset = Other**, **Root Directory = thư mục gốc repo**. Cấu hình đã có trong `vercel.json`: Build Command `npm run build`, Output Directory `public`, Node.js **24.x**. Không chọn React/Next.js.
4. Bấm **Deploy**. Khi thành công, Vercel cấp link dạng `https://ten-project.vercel.app`. Lúc này giao diện đã chạy; tài khoản chưa bật vì chưa nối DB.

### 3. Thêm Turso từ Vercel

1. Trong project Vercel, mở **Storage → Create Database** và chọn **Turso**. Nếu menu khác, mở [Turso Cloud trong Vercel Marketplace](https://vercel.com/marketplace/tursocloud) rồi chọn **Install/Add Integration** và project `Sky_Sheet`.
2. Chọn gói **Free**, tạo một database (ví dụ `sky-sheet`), chọn vùng gần backend nếu có, rồi **Connect** vào project. Chỉ cần một database cho mọi người dùng.
3. Vào **Project → Settings → Environment Variables**, kiểm tra có đủ hai biến dưới đây cho **Production**. Integration thường tự thêm; nếu chưa có, lấy Database URL và token đọc/ghi của database từ Turso rồi điền thủ công:

   | Tên biến | Giá trị |
   |---|---|
   | `TURSO_DATABASE_URL` | `libsql://...turso.io` của database |
   | `TURSO_AUTH_TOKEN` | Token truy cập database |

   Không thêm tiền tố `NEXT_PUBLIC_`, không đặt vào file JavaScript của frontend và không gửi token qua chat. Hai giá trị này chỉ dành cho backend.
4. Mở **Deployments**, chọn lần deploy mới nhất → menu **… → Redeploy**. Biến môi trường mới chỉ có hiệu lực ở lần deploy tiếp theo.
5. Mở link Production và tải lại trang. Backend tự tạo bảng trong lần gọi đầu tiên, **không cần chạy SQL thủ công**. Bây giờ có thể đăng ký và lưu bài.

Nếu muốn kiểm tra DB trước khi deploy: sao chép `.env.example` thành `.env.local`, điền hai biến vào file tại máy rồi chạy `npm run db:init`. Lệnh chỉ tạo bảng/index còn thiếu, không xóa dữ liệu. `npm run dev` cũng dùng Turso khi có đủ hai biến; để trống cả hai để trở lại SQLite tại máy.

### 4. Thử link trước khi nộp

1. Đăng ký `sinhvien_1`, lưu một bài, tải lại trang để kiểm tra phiên và bài còn nguyên.
2. Đăng xuất, đăng ký `sinhvien_2`: không được thấy bài riêng của tài khoản trước.
3. Mở cửa sổ ẩn danh hoặc điện thoại, đăng nhập `sinhvien_1` và kiểm tra bài đã lưu. Khi sửa ở thiết bị khác, bấm **Tải lại thư viện** để nhận thay đổi.
4. Thử xóa bài, sai mật khẩu và mật khẩu nhập lại không khớp. Cập nhật link Vercel vào báo cáo môn học.

Những lần sau chỉ cần push mã lên nhánh Production đã chọn, Vercel tự deploy lại. Database vẫn ở Turso, không mất khi redeploy. Bản SQLite tại máy là môi trường riêng, không tự chuyển lên Turso.

### Dữ liệu và tài khoản

- Username dài 3–24 ký tự `a-z`, `0-9`, `_`, không phân biệt hoa thường; mật khẩu đăng ký dài 8–128 ký tự. Không có email/bí danh email và chưa có chức năng quên mật khẩu.
- Ba bảng chính: `users`, `sessions`, `songs`. Bảng phụ `auth_limits` giới hạn thử đăng nhập/đăng ký qua nhiều lần chạy Function. Mật khẩu dùng scrypt với salt riêng; DB chỉ giữ băm token phiên. Cookie HttpOnly/SameSite, có Secure trên Vercel; phiên hết hạn sau 7 ngày.
- Mọi truy vấn bài đều kiểm tra người dùng từ phiên phía server; không tin `user_id` do frontend gửi. Chống ghi từ website khác bằng kiểm tra Origin và JSON. Tab cũ bị chặn nếu cookie đã đổi sang tài khoản khác.
- Tối đa 100 bài/tài khoản, tên 80 ký tự, nội dung 200.000 ký tự, BPM 50–220. Lưu cùng tên sẽ cập nhật bài đó; chỉnh sửa chỉ đồng bộ sau khi bấm **Lưu vào tài khoản**.
- **Chép bài trên máy vào tài khoản** giữ bản tại máy và bỏ qua tên đã có, bài không hợp lệ hoặc vượt giới hạn thư viện. Dữ liệu khách không tự nhập vào tài khoản.
- Đăng xuất vô hiệu hóa phiên ở server, xóa thư viện tài khoản trong bộ nhớ và đưa khung soạn về bài mẫu. Bài khách vẫn còn ở localStorage. Mẫu âm cá nhân và sáng/tối vẫn lưu tại máy.
- Dữ liệu trình duyệt tách theo tên miền: bài khách/mẫu âm trên GitHub Pages không tự xuất hiện ở link Vercel. Sao chép bản nhạc dạng chữ từ link cũ sang link mới để lưu, nạp lại mẫu âm nếu cần.

### Khi gặp lỗi triển khai

| Hiện tượng | Kiểm tra |
|---|---|
| Trang chạy nhưng báo tài khoản chưa được mở | Đủ hai biến Turso trong **Production** và đã **Redeploy** sau khi thêm biến chưa? |
| Báo chưa kết nối được thư viện | URL/token còn đúng, token có quyền ghi, database còn hoạt động và chưa vượt hạn mức? Xem **Logs** của Function trong Vercel. |
| API trả 404 | Đã push thư mục `api/` và `server/`, import đúng Root Directory, Framework Other? Đừng deploy riêng thư mục `public/`. |
| Không đăng nhập được trên link GitHub Pages | Chuyển sang link Vercel; Pages chỉ phục vụ chế độ khách. |
| Báo thử quá nhiều lần | Đợi cửa sổ giới hạn 15 phút kết thúc rồi thử lại. |

Tài liệu chính thức: [Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js), [Git deploy](https://vercel.com/docs/git), [biến môi trường](https://vercel.com/docs/environment-variables), [Turso integration](https://vercel.com/marketplace/tursocloud), [Vercel Hobby](https://vercel.com/pricing), [Turso Free](https://turso.tech/pricing).

## Kiểm tra khi sửa mã

Dùng Node.js 24 rồi chạy:

```sh
npm ci
npm test
npm run build
```

`tests/smoke.cjs` kiểm tra chức năng nhạc bằng jsdom, IndexedDB và Web Audio giả lập. `tests/backend.cjs` chạy API với SQLite thật để kiểm tra xác thực, cookie, hết hạn/thu hồi phiên, phân quyền, giới hạn thử, SQL và dữ liệu bền vững. `tests/cloud.cjs` nối frontend với HTTP backend/SQLite thật. `tests/midi.cjs` kiểm tra nhị phân MIDI thực, quy nốt theo mẫu, toàn bài/đoạn và dữ liệu lỗi; `tests/community.cjs` kiểm tra quyền, bản sao độc lập, giới hạn bài dài, tương tác và nâng cấp schema cũ; `tests/interface.cjs` kiểm tra khóa âm sắc và fullscreen bị từ chối/trả về muộn. Browser test có tải/chỉnh lớp/nghe thử/áp dụng MIDI dài, tên track không tin cậy và phục hồi sau file lỗi. Không cần tài khoản Vercel/Turso để chạy các kiểm thử này. Cấu hình cloud thực tế vẫn cần kiểm tra bằng link deploy theo các bước ở trên.

Kiểm tra toàn bộ luồng trong Chromium thật, gồm giao diện máy tính/điện thoại và đăng xuất giữa hai tab:

```sh
npx playwright install chromium
npm run test:e2e
```

Kiểm thử tự chạy server và tạo SQLite tạm riêng, không dùng dữ liệu của bạn. Ảnh chụp được lưu ở thư mục tạm, đường dẫn in ra sau khi chạy. Có thể đặt `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` nếu muốn dùng Chromium đã có sẵn.

`tests/features-browser.cjs` còn kiểm tra upload MIDI thật, xem trước/áp dụng, quầng tập, fullscreen dọc/ngang và luồng cộng đồng giữa hai tài khoản. Emulation Chromium không thay cho kiểm tra fullscreen trên iPhone/điện thoại thực; trình duyệt không hỗ trợ API dùng bố cục phóng to dự phòng.
