# Phòng Nhạc Sky

Trang tĩnh HTML/CSS/JavaScript, không cần build hoặc backend. Mở `index.html`; đường dẫn cũ `Phong_Nhac_Sky_v2.html` tự chuyển tới trang này. Nếu dùng bộ âm khai báo bằng đường dẫn, hãy chạy qua HTTP thay vì mở file trực tiếp:

```sh
python -m http.server 5173
```

Sau đó mở http://localhost:5173. Dừng server bằng Ctrl+C.

## Bố cục và cách chơi

- Thanh phát/ghi luôn ở ngoài các tab. Máy tính dùng bố cục hai cột theo chiều cao màn hình; điện thoại xếp dọc, thanh phát/ghi bám trên cùng. Danh sách nhiều lớp và bản nhạc dài cuộn trong vùng riêng.
- **Soạn nhạc**: dàn nhạc và khung nốt của lớp đang chọn. Nút tròn chọn lớp để chơi/soạn. M tắt tiếng, S nghe riêng; M vẫn có hiệu lực khi bật S.
- **Thư viện**: bài mẫu và bài lưu trong trình duyệt. Có bài Ode to Joy ba lớp để thử.
- **Bản nhạc & AI**: nhập/xuất dạng chữ, lưu bài, tạo lời nhắc cho AI. Không có yêu cầu tới dịch vụ AI trong trang.
- **Âm thanh**: thay mẫu âm theo từng nhạc cụ.
- Sáng/tối: nút ở góc phải, lựa chọn được lưu trong trình duyệt. Lần đầu theo giao diện hệ thống.
- **Bật chơi bằng bàn phím**: bấm nút dưới đàn để kích hoạt QWERT / ASDFG / ZXCVB và mở âm thanh. Mỗi lần mở trang, bàn phím bắt đầu ở trạng thái tắt; bấm trực tiếp lên đàn luôn hoạt động. Khi nhập tên/bản nhạc, phím đàn tạm dừng để bạn gõ bình thường; bấm lên đàn để tiếp tục. Sau khi đổi lựa chọn âm sắc/chế độ, trang tự bỏ focus khỏi danh sách để phím đàn nhận lại ngay. Phím dựa trên vị trí vật lý để bộ gõ tiếng Việt không làm đổi nốt.
- **⛶ Phóng to** ở góc vùng đàn: mở vùng chơi chiếm màn hình trang, với 15 phím tròn tự giãn theo màn hình dọc/ngang. Các nút Phát/Ghi/Tập theo đèn và Lặp vẫn dùng được. Bấm **✕ Thu nhỏ** hoặc Escape để trở về. Mở/đóng giữ nguyên bài, âm sắc, tiến độ tập và trạng thái phát/ghi. Đây là chế độ trong trang, không yêu cầu trình duyệt hỗ trợ API toàn màn hình.

Ba cách chơi nhiều lớp:

1. **Chồng âm sắc**: mục “Khi bấm đàn” → “Chồng các lớp có bật Chơi”. Một phím phát cùng cao độ ở các lớp có bật Chơi; quãng tám, âm lượng, M/S vẫn áp dụng riêng. Có thể bấm nhiều phím cùng lúc hoặc dùng nhiều ngón trên màn hình cảm ứng.
2. **Chơi trên nền**: bấm Phát để chạy bản phối, rồi tự chơi lớp đang chọn. Để tránh trùng giai điệu có sẵn, bật M ở lớp giai điệu cũ rồi thêm một lớp mới để tự đàn. M tắt cả phần phát và tiếng đàn tay của lớp đó.
3. **Ghi lần lượt**: chọn lớp → Ghi từ đàn → bấm phím đầu tiên để bắt đầu. Bản ghi thay nốt của lớp đó; các lớp khác phát làm nền nếu bật tùy chọn. Bản ghi luôn vào lớp đang chọn, kể cả khi đang nghe chồng âm sắc. Trong khi ghi, thay lớp/nhạc cụ/tốc độ bị khóa để giữ bản ghi nhất quán. Tab ẩn vẫn ghi; rời tab trình duyệt sẽ dừng phát/ghi.

### Tập theo đèn

Chọn bài, chọn lớp cần tập rồi bấm **Tập theo đèn** trên thanh điều khiển. Các phím cần bấm sáng nhẹ màu xanh; bấm đúng đủ nốt sẽ chuyển sang bước kế tiếp. Hợp âm có thể bấm đồng thời hoặc lần lượt; những nốt đã bấm được đánh dấu riêng. Bấm sai vẫn phát âm nhưng không chuyển bước. Có thể dùng bàn phím (được tự kích hoạt khi bắt đầu tập), chuột hoặc cảm ứng.

Chế độ này chờ người chơi, không ép theo BPM và không tự phát phần đệm. Ô nghỉ được bỏ qua. Dòng dưới đàn hiển thị lớp, tiến độ và các phím còn cần bấm; cột tương ứng cũng được đánh dấu trên khung soạn nhạc. Muốn tập từ giữa bài, bấm đầu cột để chọn điểm bắt đầu trước khi bật tập. Bật **Lặp** để quay lại đầu đoạn đã chọn; tắt Lặp để dừng khi hoàn thành. Nút **Dừng tập** kết thúc bất cứ lúc nào.

Đổi bài/lớp, sửa nốt hoặc điểm bắt đầu sẽ kết thúc lượt tập để tránh gợi ý cũ. Bấm Phát hoặc Ghi cũng kết thúc tập và chuyển sang chức năng tương ứng. Các nốt gợi ý chỉ theo lớp đang chọn; lựa chọn chơi chồng âm sắc vẫn áp dụng cho tiếng đàn tay.

## Nguồn âm và thay âm thủ công

Âm mặc định do **Web Audio API** tổng hợp tại máy: kết hợp dao động sine/triangle/sawtooth, bao âm lượng, bộ lọc, rung và nhiễu hơi. Các tên piano, đàn tranh, sáo… là âm mô phỏng, không phải file thu nhạc cụ thật hoặc âm trích từ Sky. Không tải âm mặc định từ nguồn bên ngoài. Trang cũng không phụ thuộc CDN/font ngoài.

### Nạp file trên giao diện

Trong tab Âm thanh, chọn âm sắc cần thay, chọn nốt gốc, rồi nạp file WAV/MP3/OGG hoặc định dạng trình duyệt hỗ trợ. Dùng file thu một nốt sạch dài 0,03–10 giây, tối đa 10 MB. Nếu file thu C4 thì chọn C4. Trang lưu mẫu vào IndexedDB nếu trình duyệt cho phép; nếu không, chỉ dùng trong phiên hiện tại và sẽ thông báo.

Mẫu thay cho **mọi lớp dùng cùng âm sắc**, bao gồm phát bản nhạc và chơi tay. Bản nhạc dạng chữ không chứa file âm thanh. “Khôi phục mặc định” xóa mẫu cá nhân của nhạc cụ đó và trở lại bộ âm cấu hình của trang, hoặc âm tổng hợp khi chưa cấu hình.

Đổi cao độ dùng `playbackRate`, nên tốc độ và độ dài mẫu cũng thay đổi. Mẫu một nốt phù hợp để thử/thay nhanh; bộ mẫu nhiều nốt sẽ tốt hơn khi cần âm thật trên nhiều quãng. Bản hiện tại dùng một mẫu cho mỗi âm sắc, không kéo dài âm bằng vòng lặp.

### Bộ âm dùng chung khi deploy

Đặt file, ví dụ `assets/audio/piano-c4.wav`, rồi sửa `assets/js/audio-config.js`:

```js
window.SKY_AUDIO_CONFIG = {
  piano: { url: 'assets/audio/piano-c4.wav', rootMidi: 60 },
  guitar: { url: 'assets/audio/guitar-c4.mp3', rootMidi: 60 },
};
```

`rootMidi`: C3=48, C4=60, A4=69, C5=72. Mã âm sắc có trong `assets/js/instruments.js`: harp, piano, guitar, zheng, bell, flute, dizi, xiao, erhu, organ, strings, bass. Đường dẫn tương đối tính từ `index.html`; không thêm `/` ở đầu để hoạt động dưới đường dẫn repository của GitHub Pages. Tên file phải đúng cả chữ hoa/thường. Dùng file bạn có quyền chia sẻ.

Mẫu cá nhân đã lưu được ưu tiên hơn cấu hình chung. Muốn nghe bộ âm mới của trang, bấm Khôi phục mặc định cho nhạc cụ tương ứng. Nếu file cấu hình tải/giải mã thất bại, trang thông báo và tiếp tục dùng âm tổng hợp.

## Cấu trúc

```text
index.html                     Giao diện chính
Phong_Nhac_Sky_v2.html          Chuyển hướng tương thích đường dẫn cũ
assets/css/styles.css          Bố cục, responsive, hai giao diện
assets/js/theme.js             Khôi phục giao diện trước khi vẽ trang
assets/js/instruments.js       Thông số âm tổng hợp
assets/js/audio.js             Bộ tổng hợp, phát mẫu, âm lượng và M/S
assets/js/audio-config.js      Khai báo bộ âm dùng chung
assets/js/samples.js           Nạp file và lưu/khôi phục bằng IndexedDB
assets/js/app.js               Đàn, soạn, phát/ghi, thư viện và tab
assets/audio/                  File mẫu âm tùy chọn
.nojekyll                      Phục vụ trang tĩnh trực tiếp
```

## Deploy GitHub Pages

1. Đưa `index.html`, file tương thích cũ, `assets/` và `.nojekyll` vào thư mục gốc repository GitHub. Không cần Node/npm hay lệnh build.
2. Vào **Settings → Pages → Build and deployment**, chọn **Deploy from a branch**.
3. Chọn branch `main` và thư mục **/(root)**, rồi **Save**.
4. Chờ GitHub xuất bản; trang thường nằm ở `https://<username>.github.io/<repository>/`.

Tài liệu chính thức: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

GitHub Pages chỉ phục vụ trang tĩnh; các chức năng hiện tại chạy hoàn toàn trong trình duyệt nên phù hợp. Bài và mẫu âm cá nhân lưu ở máy người dùng, không tự đồng bộ hoặc lưu ngược lên GitHub. Khi chuyển từ localhost/file sang tên miền Pages, cần sao chép bản nhạc và nạp lại mẫu âm vì bộ nhớ trình duyệt được tách theo nguồn trang.

## Kiểm tra khi sửa mã

Trang chạy không cần npm. Chỉ khi muốn chạy kiểm thử phát triển, dùng Node.js 24+ rồi:

```sh
npm install
npm test
```

Bộ kiểm thử dùng jsdom, IndexedDB giả lập và Web Audio giả lập để kiểm tra luồng ứng dụng: chồng lớp, M/S, phát/ghi đè, bản nhạc, thư viện và nạp/lưu/khôi phục mẫu âm. Kiểm thử này không đánh giá bố cục hiển thị hoặc chất lượng âm thanh thực tế; cần mở trình duyệt để kiểm tra hai phần đó.
