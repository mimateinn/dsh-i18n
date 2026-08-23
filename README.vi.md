# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

Một plugin quốc tế hóa bền vững cho DeepSeek Harness Web UI. Phiên bản 0.2.0 đăng ký **20 locales** từ một registry duy nhất, đồng thời bảo toàn tích hợp client ModuleLoader hiện có của DSH, dịch vụ locale, di trú tùy chọn và hành vi fallback thời gian chạy.

## Locale

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, and Svenska.

- Các locale tiếng Trung Phồn thể (zh-HK, zh-TW) fallback từ bộ từ điển tiếng Trung Giản thể tích hợp sẵn thông qua bộ chuyển đổi ký tự hiện có.
- Tiếng Ả Rập đặt ngôn ngữ và hướng của tài liệu thành `ar` / `rtl`; các locale được quản lý khác dùng `ltr`.
- Các giá trị chưa dịch không phải tiếng Trung sẽ fallback về tiếng Anh.

## Tính năng

- Thêm toàn bộ 20 locale vào **Settings → General → Language**, bên cạnh 中文 / English tích hợp sẵn.
- Bản dịch được trau chuốt thủ công cho từng ngôn ngữ, phủ mọi namespace locale chính thức (715 chuỗi mỗi ngôn ngữ), dựa trên bản gốc tiếng Anh.
- Fallback thời gian chạy: các chuỗi mới / cập nhật / từ bên thứ ba fallback về tiếng Anh (hoặc chuyển đổi Giản thể → Phồn thể cho zh-HK/zh-TW), nhờ đó các cập nhật UI từ upstream và các plugin khác đều được bao phủ mà không cần dịch lại mọi ngôn ngữ.
- Tùy chọn ngôn ngữ được lưu trong `localStorage` của trình duyệt; không mất khi tải lại trang.
- **Dịch đắm chìm**: khi một locale không phải tiếng Trung đang hoạt động, các văn bản tiếng Anh dài (mô tả chợ plugin, UI bên thứ ba, đoạn văn lỗi) được tự động dịch sang ngôn ngữ của bạn thông qua model bạn đã cấu hình — được cache và idempotent nên các lần re-render của React không xung đột với nó. Ngôn ngữ mặc định (en/zh) được giữ nguyên; tiếng Trung Phồn thể vẫn dùng chuyển đổi Giản thể → Phồn thể tích hợp sẵn thay vì gọi model.
- Không xâm lấn: plugin thuần client, không thay đổi package upstream, tự suy giảm im lặng nếu thiếu dịch vụ locale.

## Cài đặt

Cài đặt vào profile mà host của bạn thực sự khởi động, và ghim commit:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

Với DSH Desktop, profile đang hoạt động là giá trị `active` trong `%APPDATA%/DSH Desktop/profile-selection/state.json` (thường là `desktop`). Shim theo từng profile `host-commands/<profile>/bin/dsh.cmd` gắn sẵn tên profile của riêng nó vào lệnh, nên việc chạy shim `web` sẽ cài đặt vào profile `web` ngay cả khi Desktop đang hiển thị `desktop` — quá trình cài đặt thành công nhưng plugin không bao giờ được tải. Hãy truyền `--profile` một cách tường minh để chắc chắn.

Các đường dẫn cài đặt qua Market của DSH Desktop chỉ chấp nhận một phiên bản npm đã xuất bản chính xác, vì vậy spec GitHub phải đi qua terminal tích hợp `dsh plugin add`, thứ sẽ chuyển tiếp specifier cho pnpm mà không kiểm tra.

Khởi động lại host, sau đó chọn ngôn ngữ trong **Settings → General → Language**. Gỡ bỏ bằng `dsh plugin --profile <active-profile> remove dsh-i18n`.

## Quy trình bảo trì

Registry locale là `scripts/locales.mjs`. Dữ liệu bản dịch nằm trong `src/<locale>/`; code trình duyệt được sinh ra là `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

Quá trình trích xuất chấp nhận thư mục gốc DSH đã cài đặt, thư mục package `@deepseek-ai` của nó, hoặc đường dẫn ứng dụng desktop đã giải nén.

## Xuất bản

Package npm bao gồm các mục runtime, client đã sinh, dữ liệu locale và registry locale. Kho mã nguồn: https://github.com/mimateinn/dsh-i18n

## Bảo mật và quyền riêng tư

- Plugin không tự thực hiện lời gọi mạng, không có telemetry, và chỉ đọc/ghi hai khóa localStorage của trình duyệt: id locale đã chọn và giá trị ghi đè model dịch.
- Dịch đắm chìm chạy qua dịch vụ LLM tích hợp sẵn của DSH (model bạn đã cấu hình), không phải API bên thứ ba. Nó chỉ kích hoạt cho đoạn văn tiếng Anh dài khi một locale không phải tiếng Trung đang hoạt động; ngôn ngữ mặc định không bao giờ bị gửi đi để dịch.
- Không truy cập filesystem, không xử lý thông tin xác thực.

## Giấy phép

MIT
