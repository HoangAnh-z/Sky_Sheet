# 006 — Cải tiến giao diện Liquid Glass UI, nền Sky, tùy chọn nền đàn và bố cục tab

- Ngày ghi: **2026-11-21** (`Asia/Saigon`).
- Trạng thái: **Đã hoàn thành**.
- Nguồn: Yêu cầu trong phiên hiện tại và ảnh tham chiếu Dribbble "liquid glass".
- Liên quan: [004 — Nhập MIDI, cộng đồng và giao diện](004-midi-cong-dong-va-giao-dien.md), [005 — Thay nhập MIDI theo bản kiểm tra](005-midi-theo-ban-kiem-tra.md).

## 1. Prompt gốc

> cải tiến giao diện: vẫn giữ tông màu cũ, chuyển giao diện thành dạng liquid glass ui, nền mặc định hợp chủ đề, có thể cho người dùng chọn nền của riêng phần chơi đàn (kể cả khi ko lẫn phóng to, có thể chỉnh độ mờ,..) tab soạn nhạc sắp lại bố cục: khung soạn nhạc bên trái để ko bị cuộn, bên phải là khung Dàn nhạc, tỉ lệ tầm 7 3, có thể cân nhắc cho hợp lý; những chỗ tab khác design/sắp xếp ko hợp lý có thể tự sắp lại; tuân thủ theo dúng quy trình dự án đang làm, quản lý bằng .md để nếu cần thì rollback lại

### Bổ sung khi đang làm

> chỗ ảnh nền khung chơi đàn thì tất cả cả các nút (đàn lẫn phím chức năng) cũng cần trong suốt nữa, chất lượng ảnh sao resize gì ko thấy đang bị vỡ, thêm được hiệu ứng liquid glass hover như bên iphone không, ko cần mẫu nền sẵn đâu, trong khung soạn nhạc làm các màu khác màu cho từng loại nốt (chung nhóm thì nên chung màu), thay vì hiện tại đang có 1 thanh chạy trên khung soạn nhạc thì làm cho khung nhạc chạy đâm vào thanh bên trái, thanh bên trái ngoài hiện phím thì nên thêm bên cạnh là nốt gì nữa, mỗi khi nốt đâm vào thì ô tương ứng trong cột trái đó sẽ nổi bật lên

- Ảnh tham khảo người dùng gửi: Tìm kiếm Dribbble từ khóa "liquid glass", với phong cách các thẻ kính trong suốt thấu kính lồi, specular viền bóng sáng, nút bấm như giọt nước khúc xạ nổi bồng bềnh và bóng đổ tán xạ kiểu Apple visionOS / iOS.

## 2. Bối cảnh và kết quả mong muốn

- **Trạng thái trước khi làm**:
  + Giao diện trước đây dùng panel màu phẳng đơn sắc (`#f2f1f7` sáng, `#101121` tối), phím đàn đục màu đặc, chưa có hiệu ứng kính lỏng (liquid glass / frosted glassmorphism).
  + Nền toàn trang là màu phẳng đơn điệu, chưa toát lên vẻ kỳ ảo của thế giới Sky: Children of the Light.
  + Khu vực chơi đàn (`.play-surface`) gắn cứng vào nền mặc định, người dùng không thể chọn phông nền riêng hoặc chỉnh độ mờ/tương phản của phím.
  + Tab Soạn nhạc (`view-compose`) xếp theo chiều dọc (Dàn nhạc ở trên chiếm nhiều diện tích, Khung soạn nhạc ở dưới bị giới hạn chiều cao khiến thao tác nốt dễ bị cuộn dọc trang).
  + Các tab Thư viện, Bản nhạc & AI, Âm thanh, Cộng đồng còn dùng danh sách dạng dòng hoặc bố cục phân tán.
- **Người dùng yêu cầu rõ**:
  1. Giữ nguyên tông màu cũ (`--gold: #7056c8 / #c4acff`, `--sky: #168591 / #7dd5da`, `--rec: #d34e6d / #ff8ca5`, nốt đánh trúng vàng ấm `#f4b85b`).
  2. Toàn bộ phím đàn và phím chức năng trong vùng chơi đàn phải **trong suốt (translucent liquid glass)** nhìn xuyên thấu qua hình nền phía sau.
  3. Thêm hiệu ứng **Liquid Glass Hover kiểu iPhone / visionOS**: tia sáng phản quang lướt qua mặt kính (`shimmer flare`), thấu kính giọt nước nổi bồng bềnh `transform: translateY(-2px) scale(1.02)`, viền sáng specular bóng bẩy.
  4. Nền ảnh đàn không bị vỡ hoặc nhòe: giữ độ phân giải gốc cao nhất, render tương phản tối ưu, chỉnh độ mờ blur từ 0px (sắc nét 100%) và độ phủ tương phản 0% – 80%.
  5. Bỏ các mẫu nền preset sẵn, chỉ tập trung vào: Mặc định (kính lỏng trong suốt) và Tải ảnh nền riêng từ máy.
  6. Trong Khung soạn nhạc: Các nốt mang màu sắc riêng biệt cho từng loại nốt (7 loại nốt tự nhiên: Đô, Rê, Mi, Fa, Sol, La, Si; chung loại nốt thì chung màu).
  7. Cơ chế phát nhạc mới: Khung nhạc chạy sang trái đâm thẳng vào thanh nhãn bên trái; thanh bên trái hiển thị cả Phím lẫn Nốt (`.rl-key` và `.rl-note`); mỗi khi nốt đâm vào thì ô tương ứng trên cột trái bừng sáng nổi bật (`.active-hit`).
  8. Bố cục Soạn nhạc 7:3 (Soạn nhạc bên trái, Dàn nhạc bên phải), các tab khác sắp xếp gọn gàng hiện đại.
- **Tiêu chí hoàn thành**:
  - Toàn bộ 114 bài kiểm tra tự động (smoke, backend, cloud, midi, community, interface) và 2 bộ kiểm thử E2E Playwright đều vượt qua 100%.
  - Hiệu ứng Liquid Glass mượt mà 60fps, tương phản chữ và phím đàn sắc nét.
  - Cơ chế nốt đâm vào thanh bên trái và highlight receptor hoạt động chính xác theo nhịp phát.

## 3. Thực hiện và quyết định

- **Phím đàn & Nút chức năng trong suốt nhìn xuyên thấu ảnh nền**:
  + `.pad`: chuyển sang vật liệu kính trong suốt cao độ (`background: rgba(255, 255, 255, 0.2)` ở light mode và `rgba(255, 255, 255, 0.08)` ở dark mode), kết hợp `backdrop-filter: blur(12px) saturate(180%)`, viền sáng bóng `rgba(255, 255, 255, 0.55)` và bóng đổ specular lồi cong `inset 0 1.5px 2px rgba(255, 255, 255, 0.75)`.
  + Toàn bộ phím chức năng trong vùng đàn (`.keyboard-toggle`, `#expandPadsBtn`, `#padBgBtn`, v.v.) đều chuyển sang kính trong suốt đồng bộ.
  + `.play-surface-backdrop`: đặt `inset: 0`, `image-rendering: -webkit-optimize-contrast`, bỏ scale khi blur = 0px để hình ảnh tải lên luôn sắc nét tuyệt đối, không bị vỡ hay nhòe hình.
- **Hiệu ứng Liquid Glass Hover phong cách iPhone / visionOS**:
  + Thêm pseudo-element `::before` với dải sáng `linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.4) 50%, transparent 80%)` lướt nhẹ qua bề mặt thấu kính khi hover.
  + Hiệu ứng phóng nổi nhẹ nhàng `transform: translateY(-2px) scale(1.02)` và bóng đổ tán xạ đa tầng mềm mại.
- **Tinh giản Dialog Nền đàn**:
  + Bỏ các preset phong cảnh cũ theo yêu cầu người dùng.
  + Hộp thoại chỉ còn 2 lựa chọn: *Mặc định (Kính lỏng)* và *Tải ảnh nền riêng*.
  + Cho phép tải ảnh tới 15 MB, giữ nguyên dataURL chất lượng cao, có nút *Gỡ ảnh nền* và *Khôi phục mặc định*.
  + Thanh trượt Blur mặc định 0px (ảnh căng nét 100%), thanh trượt Overlay mặc định 25%.
- **Màu sắc riêng cho 7 loại nốt trong Khung soạn nhạc**:
  + Đô (C4, C5, C6): Ngọc lam Cyan Sky (`--note-c: #06b6d4 / #22d3ee`).
  + Rê (D4, D5): Xanh sapphire (`--note-d: #3b82f6 / #60a5fa`).
  + Mi (E4, E5): Tím xanh indigo (`--note-e: #6366f1 / #818cf8`).
  + Fa (F4, F5): Tím hoa cà violet (`--note-f: #8b5cf6 / #a78bfa`).
  + Sol (G4, G5): Hồng tím fuchsia (`--note-g: #d946ef / #e879f9`).
  + La (A4, A5): Hồng sen pink (`--note-a: #ec4899 / #f472b6`).
  + Si (B4, B5): Vàng hổ phách amber (`--note-b: #f59e0b / #fbbf24`).
  + Các nốt cùng loại (chung nhóm) mang cùng một màu sắc lung linh, dễ quan sát hợp âm và giai điệu.
- **Cơ chế nốt đâm vào thanh bên trái & Thanh bên trái hiện cả Phím lẫn Nốt**:
  + Thanh nhãn bên trái `.rl` rộng 68px, hiển thị cả phím (`.rl-key`: Q, W, E...) và tên nốt (`.rl-note`: C4, D4... hoặc Đô, Rê...).
  + Trong `setPlayhead(c)`: Khi phát nhạc, khung cuộn `#rollWrap` tự động chạy sang trái (`scrollLeft = c * STEP_W`) để cột nốt đang phát tiến đến và đâm thẳng vào thanh nhãn bên trái.
  + Đồng thời, các ô nốt đang vang lên ở bước `c` sẽ kích hoạt class `.active-hit` trên các ô tương ứng ở cột bên trái: ô đó bừng sáng rực rỡ, phóng to nhẹ theo đúng màu sắc riêng của nốt đó, tạo cảm giác như một thước đo nhịp đập âm nhạc receptor sống động.
- **Bố cục 7:3 & Sắp xếp các tab**:
  + Tab Soạn nhạc: Sequencer (trái ~ 70%) không bị cuộn dọc trang; Dàn nhạc (phải ~ 30%) dạng Track Strip DAW.
  + Thư viện bài nhạc dạng lưới kính 2 cột, Bản nhạc & AI gom toolbar MIDI, Âm thanh dropzone kính lỏng, Cộng đồng feed kính mờ.

## 4. Kiểm tra và bằng chứng

| Lệnh / thao tác | Kết quả | Nguồn / giới hạn |
|---|---|---|
| `npm test` | **114 kiểm tra qua** (26 smoke, 25 backend, 12 cloud, 14 MIDI, 27 cộng đồng, 10 interface) | Chạy trong phiên 006 |
| `npm run build` | **Thành công**: build `public/index.html` và `public/assets` đầy đủ | Chạy trong phiên 006 |
| `node tests/browser.cjs` | **3/3 PASS**: Chromium 1440 & 390 qua trọn luồng đăng ký, lưu bài, reload, 2 tab logout, responsive | Chạy trong phiên 006 |
| `node tests/features-browser.cjs` | **5/5 PASS**: MIDI, layered controls, practice halo, fullscreen 1440/390/844, metadata, cộng đồng | Chạy trong phiên 006 |
| Kiểm tra nốt đâm vào thanh trái & receptor hit | Đã kiểm chứng tự động qua `tests/interface.cjs` (check 10) | Chạy trong phiên 006 |
| Kiểm tra nhãn cột trái (phím + nốt) | Đã kiểm chứng tự động qua `tests/interface.cjs` (check 8) | Chạy trong phiên 006 |

## 5. Kết quả và bàn giao

- **Đã đạt**:
  + Toàn bộ phím đàn và nút chức năng trong suốt xuyên thấu nhìn thấy rõ ảnh nền.
  + Ảnh nền tải lên giữ nguyên độ phân giải cao nhất, không bị vỡ hạt hay méo hình.
  + Hiệu ứng Liquid Glass Hover chuẩn phong cách iPhone / visionOS với luồng sáng thấu kính trượt qua.
  + Hộp thoại nền đàn tinh giản: Kính lỏng mặc định và Tải ảnh riêng.
  + Khung soạn nhạc có 7 dải màu riêng cho 7 loại nốt âm giai.
  + Khung nhạc cuộn đâm vào thanh bên trái; thanh bên trái hiển thị cả phím và nốt; ô receptor bừng sáng nổi bật theo nhịp phát.
  + Bố cục Soạn nhạc 7:3 rộng rãi, không cuộn dọc, responsive mượt mà.
  + 114 bài test tự động và toàn bộ Playwright test đều PASS 100%.

## 6. Hướng dẫn Rollback (Khôi phục nếu cần)

- Nếu người dùng muốn khôi phục lại giao diện trước nhiệm vụ 006:
  ```sh
  git checkout HEAD~1 -- assets/css/styles.css assets/js/app.js index.html tests/interface.cjs
  npm test
  npm run build
  ```
