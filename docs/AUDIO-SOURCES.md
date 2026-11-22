# Bộ âm thu của Phòng Nhạc Sky

Thử ở **Âm thanh → chọn nhạc cụ → Nghe mẫu C4 / So với âm tổng hợp**. Với bộ trống, dùng **Nghe tiếng kick** hoặc đặt một lớp thành **Bộ trống** để chơi đủ 15 tiếng. Cả sáu bộ được phục vụ cùng trang. Tổng cộng 65 MP3, 2.579.603 byte.

| Bộ âm | Bản gốc và giấy phép | Nốt gốc MIDI | File web |
|---|---|---|---|
| Upright Piano KW | FreePats, 2022-02-21, Gonzalo và Roberto, CC0 1.0. [Bản thu và thông tin](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html#UprightKW) | 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96. Lớp lực nhẹ `vL` | Stereo, MP3 128 kbps, tối đa 4,2 giây |
| Spanish Classical Guitar | FreePats, 2019-06-18, Roberto, CC0 1.0. [Bản thu và thông tin](https://freepats.zenvoid.org/Guitar/acoustic-guitar.html) | 36, 43, 48, 54, 60, 66, 72, 78, 84 | Mono, MP3 96 kbps, tối đa 3,2 giây |

20 file MP3 có tổng **848.501 byte**. CC0 và thông tin tác giả đi kèm tại [assets/audio/freepats](../assets/audio/freepats/). Bản này có một mức lực cho mỗi nốt gốc. Khi đổi quãng, trình phát chọn nốt gốc gần nhất và đổi tốc độ theo chênh lệch bán âm. Các nốt guitar trên C6 lấy từ mẫu C6. File giới hạn chiều dài, cân đỉnh âm lượng và fade 0,22 giây ở cuối. Phần ngân nghe được đến từ bản thu, có tính đến bước xử lý này.

## Mẫu thu Versilian

45 MP3 chứa 1.731.102 byte. Mã hóa mono 44,1 kHz, MP3 96 kbps. Đã đối chiếu cao độ với tín hiệu âm thanh vì tên tệp gốc của sáo và dàn dây dùng quy ước quãng khác. Đoạn đầu rất nhỏ được rút ngắn tới 0,22 giây, giữ 0,035 giây trước điểm vào âm đo được nếu cần cắt. [CC0 và tác giả](../assets/audio/versilian/CREDITS.md).

| Bộ âm | Nguồn | Nốt gốc MIDI | Cách phát |
|---|---|---|---|
| Đàn hạc | Concert Harp, VSCO 2 CE | 38, 45, 52, 59, 65, 72, 79, 86, 93 | Giữ đuôi tiếng gảy, tệp tối đa 3,6 giây |
| Sáo | Flute sustain non-vibrato, VSCO 2 CE | 60, 64, 69, 72, 76, 81, 84, 88, 93, 96 | Theo thời lượng trình phát gửi, có đoạn nhả âm tối đa 0,15 giây. Tệp tối đa 4,2 giây |
| Dàn dây | Cello Section và Violin Section, VSCO 2 CE | 47, 53, 57, 60, 64, 67, 72, 76, 79, 83, 86 | Mẫu cello cho vùng thấp, mẫu violin cho vùng cao. Nốt cao hơn D6 đổi cao độ từ mẫu D6. Tệp tối đa 4,2 giây |
| Bộ trống | 15 mẫu gõ VCSL | Mỗi phím dùng một file riêng | Giữ cao độ thu, tệp tối đa 2,3 giây |

| Phím | Tiếng | Nốt General MIDI |
|---|---|---|
| Q | Kick | 35, 36 |
| W | Snare | 38, 40 |
| E | Hi-hat kín | 42 |
| R | Hi-hat mở | 46 |
| T | Hi-hat đạp | 44 |
| A | Rim | 37 |
| S | Tom trầm | 41, 43, 45 |
| D | Tom cao | 47, 48, 50 |
| F | Crash | 49, 52, 55, 57 |
| G | Ride (mẫu cymbal treo gõ bằng dùi) | 51, 53, 59 |
| Z | Tambourine | 54 |
| X | Shaker | 69, 70, 82 |
| C | Claves | 75 |
| V | Woodblock | 76, 77 |
| B | Conga | 62, 63, 64 |

Khi nhập MIDI, lớp trống riêng ở kênh 10 được nhận diện là **Bộ trống**, để trống ô chọn ban đầu. Khi bật lớp, hệ thống ánh xạ tiếng theo bảng trên và báo số tiếng gõ ngoài danh sách. Lớp trống không tham gia tính chuyển tông. Track trộn nhiều kênh vẫn được giữ nguyên cấu trúc track nguồn.

Trình nghe thử MIDI và Cộng đồng dùng cùng bộ mẫu đã nạp. Mẫu cá nhân của nhạc cụ có cao độ ưu tiên hơn bộ chung. **Khôi phục mặc định** quay về mẫu thu đi kèm nếu có. Khi bộ thu tải hoặc giải mã lỗi, nhạc cụ dùng âm tổng hợp. Các nhạc cụ ngoài sáu bộ này vẫn dùng Web Audio tổng hợp.

## Dựng lại từ nguồn

Tải bản **SFZ + FLAC** sau và giải nén ngoài Git. Các bước này chỉ dùng khi cần dựng lại hoặc thay bộ mẫu.

| Archive | SHA-256 |
|---|---|
| [UprightPianoKW-SFZ+FLAC-20220221.7z](https://freepats.zenvoid.org/Piano/UprightPianoKW/UprightPianoKW-SFZ%2BFLAC-20220221.7z) | `3a66da3b25a2fd9499d90bcf09f1aee4431825796e249361b48af59b1201e703` |
| [SpanishClassicalGuitar-SFZ+FLAC-20190618.7z](https://freepats.zenvoid.org/Guitar/SpanishClassicalGuitar/SpanishClassicalGuitar-SFZ%2BFLAC-20190618.7z) | `903916921a21662d2237ade7f0e98e55de93cb7b86da219e4e10f4ad385b8f5e` |

Từ thư mục dự án trên Windows, cần `ffmpeg` hỗ trợ `libmp3lame` và `ffprobe` trong PATH. Truyền hai thư mục chứa file SFZ và thư mục `samples` đã giải nén:

```powershell
.\scripts\prepare-freepats.ps1 -PianoSource 'D:\audio\piano-extracted' -GuitarSource 'D:\audio\guitar-extracted'
npm run build
```

Script lấy nốt gốc theo SFZ, không suy từ vị trí file trong archive. Piano cân đỉnh tới −5 dBFS, guitar tới −7 dBFS, giới hạn tăng gain 9 dB. Phiên bản encoder có thể tạo file khác byte. Build bình thường dùng MP3 có sẵn và không cần FFmpeg hay tải FreePats.

Với các mẫu Versilian, chạy `node scripts/prepare-versilian.cjs` khi có Node.js, FFmpeg và FFprobe trong PATH. Script ghi phiên bản nguồn cố định, danh sách WAV, thông số chuyển đổi và đường dẫn MP3. Build dùng các MP3 đã đóng gói.

## Tích hợp vào Sky_Sheet

Bộ âm được thử trong workspace riêng Sky_Sheet_Piano, rồi chuyển sang nhánh `upgrade2` cùng trình nạp mẫu, bộ phát và màn hình nghe thử. Xem [nhật ký tích hợp](prompts/021-tich-hop-ban-piano-vao-upgrade2.md) để biết phạm vi kiểm tra và trạng thái triển khai.
