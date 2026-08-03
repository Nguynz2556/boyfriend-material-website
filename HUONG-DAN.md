# Hướng dẫn sử dụng website "Boyfriend Material"
*(Viết cho người mới học code — đọc từ trên xuống dưới, không cần biết lập trình trước)*

## 1. Cấu trúc file
```
website/
├── index.html            Trang chủ
├── dich-vu.html           Trang dịch vụ (gói theo giờ + theo ngày)
├── ve-chung-toi.html      Trang về chúng tôi
├── lien-he.html           Trang liên hệ (bản đồ + form)
├── danh-sach.html         Danh sách 9 người đồng hành, có lọc/sắp xếp
├── ho-so-1.html … ho-so-9.html   Hồ sơ + đặt lịch từng người (xem bảng bên dưới)
├── ho-so.html             File MẪU trống — copy khi thêm người thứ 10 trở đi
├── dang-nhap.html         Đăng nhập
├── dang-ky.html           Đăng ký (có chọn vai trò: khách hàng / người đồng hành)
├── ekyc.html              Xác minh danh tính (CCCD + quét khuôn mặt + ký hợp đồng)
├── hop-dong.html          Hợp đồng ký riêng cho từng lượt đặt lịch
├── tin-nhan.html          Hộp thư kiểu Messenger (chat demo)
├── don-hang.html          Lịch sử đặt lịch / giỏ hàng của tôi
├── admin.html             Trang quản trị nội bộ (thêm người, duyệt đơn đăng ký...)
├── css/style.css          Toàn bộ màu sắc, font chữ, bố cục
├── js/store.js            "Cơ sở dữ liệu" demo (tài khoản, đặt lịch, eKYC, hợp đồng...)
├── js/pages.js            Logic riêng từng trang (đăng nhập, eKYC, chat, admin...)
├── js/main.js             Menu mobile, lọc danh sách, đặt lịch, gói dịch vụ...
├── google-apps-script.gs  Code dán vào Google Apps Script để nhận dữ liệu về Doc/Sheet
└── images/                Ảnh + logo.jpg (đã có logo bạn gửi)
```

**9 người đồng hành hiện tại:**

| File | Tên | Khu vực | Giá/giờ |
|---|---|---|---|
| ho-so-1.html | Hoàng Nguyên | TP. Hồ Chí Minh | 500.000đ |
| ho-so-2.html | Văn Danh | Hà Nội | 550.000đ |
| ho-so-3.html | Minh Nhựt | Đà Nẵng | 560.000đ |
| ho-so-4.html | Huy Hoàng | TP. Hồ Chí Minh | 600.000đ |
| ho-so-5.html | Thành Trung | Hà Nội | 520.000đ |
| ho-so-6.html | Thanh Phong | TP. Hồ Chí Minh | 540.000đ |
| ho-so-7.html | Anh Phúc | Đà Nẵng | 580.000đ |
| ho-so-8.html | Quốc Việt | Hà Nội | 570.000đ |
| ho-so-9.html | Trường Vũ | TP. Hồ Chí Minh | 530.000đ |

Thông tin (tuổi, mô tả, sở thích...) mình viết mẫu hợp lý — nên mở từng file sửa lại cho đúng người thật trước khi dùng chính thức.

---

## 2. Ảnh (avatar + ảnh bìa + 5 ảnh gallery)
Mỗi hồ sơ có 3 loại ảnh: **ảnh bìa** (`.profile-cover`), **ảnh đại diện** (`.profile-avatar`), và **5 ảnh trong "Thư viện ảnh"** (`.profile-gallery`, nằm dưới phần Giới thiệu).

Cách thay: tìm khối `<div class="placeholder-photo">...</div>` tương ứng, thay bằng `<img>`:
```html
<!-- Trước -->
<div class="gallery-item"><div class="placeholder-photo"><div class="icon">🖼️</div>Ảnh 1: images/companion-1-1.jpg</div></div>

<!-- Sau -->
<div class="gallery-item"><img src="images/companion-1-1.jpg" alt="Hoàng Nguyên"></div>
```
Kích thước gợi ý: avatar ~600×680px, ảnh bìa ~1400×450px, ảnh gallery ~800×800px (vuông).

**Logo:** dùng logo bạn gửi tại `images/logo.jpg` — hiện ở header, footer và làm favicon. Muốn đổi, thay đè file cùng tên.

---

## 3. Khung giờ đặt lịch
Mỗi hồ sơ có 2 ô chọn **"từ giờ" / "đến giờ"** (06:00 → 00:00). Muốn đổi khoảng giờ hoạt động, sửa danh sách `<option>` trong khối `<select id="book-time-from">` / `<select id="book-time-to">`.

---

## 4. Gói dịch vụ Theo giờ / Theo ngày
Trang `dich-vu.html` có 2 bảng gói riêng, ẩn/hiện bằng nút "Theo giờ" / "Theo ngày" (xử lý bởi `js/main.js`). Sửa nội dung ở khối `<div class="pkg-grid" data-pkg-panel="daily" hidden>`.

---

## 5. Đăng nhập / Đăng ký
Logic được viết trong file riêng `js/pages.js` (không còn viết trực tiếp trong thẻ `<script>` giữa HTML — cách cũ dễ bị một số hosting/CDN chặn bởi CSP, khiến nút bấm không phản hồi). Form hiện thông báo lỗi/thành công ngay trên trang thay vì dùng `alert()`.

Đây vẫn là hệ thống DEMO — tài khoản lưu trong trình duyệt (localStorage), KHÔNG đồng bộ giữa các thiết bị. Xem mục 9 để lưu tài khoản thật vào Google Doc.

---

## 6. Giỏ hàng / Lịch sử đặt
Trang `don-hang.html` (menu "Đơn hàng" hiện sau khi đăng nhập) liệt kê tất cả lượt đặt lịch của tài khoản đang đăng nhập — kèm nút "Ký hợp đồng" nếu lượt đặt nào chưa ký (xem mục 13).

---

## 7. Tin nhắn kiểu Messenger
Trang `tin-nhan.html` có 2 cột: danh sách hội thoại bên trái, khung chat bên phải. Bấm "Nhắn tin trước khi đặt lịch" ở hồ sơ bất kỳ sẽ tự tạo cuộc trò chuyện mới. Vẫn là demo — tin nhắn lưu trong trình duyệt, người đồng hành thật chưa nhận được; cần nối backend realtime (Socket.io, Firebase...) để hoạt động thật.

---

## 8. Trang "Về chúng tôi" — đã sửa lỗi tràn chữ
**Nguyên nhân:** layout 2 cột cố định thiếu quy tắc responsive cho màn hình nhỏ/trung bình, khiến 4 ô số liệu (500+, 15.000+, 4.9/5, 98%) tràn ra đè lên phần giới thiệu.
**Đã sửa:** thêm CSS để cột tự xếp dọc trên màn hình ≤900px, cỡ chữ số liệu tự co giãn theo màn hình.

---

## 9. Gửi dữ liệu về Google Doc / Google Sheet
Website chạy tĩnh nên cách nhẹ và miễn phí nhất là dùng **Google Apps Script**.

### Bước 1: Mở Google Sheet
Vào link Sheet của bạn → **Tiện ích mở rộng (Extensions) → Apps Script**.

### Bước 2: Dán code
Xoá code mẫu có sẵn, copy toàn bộ nội dung file `google-apps-script.gs` (có sẵn trong thư mục website) và dán vào. Bấm 💾 Lưu.

### Bước 3: Deploy thành Web App
1. **Deploy → New deployment**.
2. Bấm ⚙️ cạnh "Select type" → chọn **Web app**.
3. "Execute as": chọn **Me**.
4. "Who has access": chọn **Anyone**.
5. Bấm **Deploy**, cấp quyền khi được hỏi (Authorize access → Advanced → Go to ... unsafe → Allow).
6. Copy **Web app URL** dạng `https://script.google.com/macros/s/AKfycb.../exec`.

### Bước 4: Dán URL vào website
Mở `js/pages.js`, tìm dòng:
```js
var WEBAPP_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
```
Thay bằng URL thật. Từ đó: đăng ký tài khoản mới → ghi vào Google Doc; đặt lịch/gửi form liên hệ → ghi vào Google Sheet.

**Lưu ý:** mật khẩu KHÔNG được gửi lên Google Doc (chỉ tên + email). CCCD/ảnh khuôn mặt trong eKYC hiện chỉ lưu local, chưa gửi lên Google — xem cảnh báo an toàn ở mục 13 trước khi cân nhắc gửi dữ liệu này đi bất cứ đâu.

---

## 10. Tên miền thật đã chạy
Site đang chạy tại: https://boyfriendmaterial.io.vn/ — khi cập nhật, nhớ upload đủ cả 4 file JS (`store.js`, `pages.js`, `main.js`) và toàn bộ `.html` đã sửa, không chỉ 1-2 file lẻ.

---

## 11. Các bước cơ bản dành cho người mới học code
1. **Xem trước:** double-click `index.html` mở bằng trình duyệt. Muốn test đăng nhập/eKYC/camera đầy đủ, nên dùng extension "Live Server" của VS Code (một số trình duyệt chặn camera/localStorage khi mở file trực tiếp bằng `file://`).
2. **Sửa nội dung:** dùng VS Code (miễn phí), mở cả thư mục `boyfriend-material-website`.
3. **Kiểm tra lỗi:** mở Chrome, bấm **F12** → tab **Console** — dòng chữ đỏ là lỗi JavaScript, thường ghi rõ số dòng/tên file.
4. **Đưa lên mạng:** upload toàn bộ thư mục lên hosting, giữ nguyên cấu trúc thư mục con `css/`, `js/`, `images/`.
5. **Học thêm:** freeCodeCamp.org hoặc W3Schools.com (có ví dụ chạy thử ngay trên web).

---

## 12. Đổi màu sắc / font chữ toàn site
Mở `css/style.css`, sửa các biến ở đầu file (`:root`):
```css
--navy: #172341;
--gold: #C6963B;
--cream: #FAF6EF;
```

---

## 13. eKYC + Hợp đồng điện tử khi đặt lịch
- Mỗi tài khoản cần xác minh danh tính (`ekyc.html`) **1 lần** trước khi đặt lịch lần đầu: tải ảnh CCCD mặt trước/sau + mở camera chụp khuôn mặt trực tiếp (`getUserMedia` — cần HTTPS trên hosting thật để camera hoạt động).
- Sau khi đủ 3 ảnh, trang hiện hợp đồng mẫu + ô ký tên bằng chuột/ngón tay (canvas) — ký xong mới đặt lịch được.
- **Mỗi lần đặt lịch**, sau bước "thanh toán" demo, hệ thống tạo **hợp đồng riêng cho lượt đặt đó** (`hop-dong.html`), ghi rõ tên khách, người đồng hành, dịch vụ, ngày giờ — cần ký lại (khác với chữ ký eKYC ban đầu vì nội dung mỗi lượt khác nhau). Trang "Đơn hàng" hiện nút "Ký hợp đồng" nếu lượt nào chưa ký.

**LƯU Ý AN TOÀN — đọc kỹ trước khi dùng thật:**
- Vẫn là bản DEMO: ảnh CCCD, khuôn mặt, chữ ký lưu ngay trong localStorage trình duyệt người dùng — **không mã hoá, không gửi lên server nào, không đối chiếu dữ liệu dân cư thật**, không có kiểm tra chống giả mạo (liveness detection).
- CCCD là dữ liệu cá nhân **nhạy cảm** theo Nghị định 13/2023/NĐ-CP. Dùng thật bắt buộc phải: có chính sách bảo mật rõ ràng người dùng đồng ý trước khi thu thập; mã hoá khi lưu trữ/truyền tải; và nên dùng nhà cung cấp eKYC được cấp phép tại Việt Nam (VNeID, FPT.AI, VNPT eKYC, Trusting Social...) thay vì tự lưu ảnh CCCD trực tiếp.
- Chữ ký vẽ tay trên canvas chỉ minh hoạ, **chưa có giá trị pháp lý như chữ ký số thật** — cần tích hợp nhà cung cấp chữ ký số hợp pháp (VNPT-CA, FPT-CA, Viettel-CA...) nếu muốn hợp đồng có hiệu lực ràng buộc.

---

## 14. Vai trò khi đăng ký: Khách hàng / Người đồng hành
Trang `dang-ky.html` có 2 ô chọn dạng checkbox, tự loại trừ lẫn nhau bằng JS (chỉ chọn được 1 vai trò dù dùng checkbox thay vì radio, theo đúng yêu cầu "ô tích chọn"):
- **Khách hàng:** đăng ký xong vào thẳng trang chủ, làm eKYC khi đặt lịch lần đầu.
- **Người đồng hành (nhân viên):** đăng ký xong chuyển ngay sang `ekyc.html` xác minh danh tính, sau đó đơn xuất hiện trong `admin.html` ở mục "Đơn đăng ký làm người đồng hành (chờ duyệt)". Bạn bấm **Duyệt**, rồi vào mục "Thêm người đồng hành mới" bên dưới để bổ sung ảnh/giá/khu vực/mô tả đầy đủ (đơn đăng ký chỉ có tên + email, chưa đủ để hiện hồ sơ hoàn chỉnh).

---

## 15. Nhiều dịch vụ hơn cho mỗi người đồng hành
Mỗi hồ sơ có **12 lựa chọn dịch vụ** (trước chỉ có 3): Đi ăn/Cafe, Xem phim, Trò chuyện online, Tâm sự, Chơi game, Học tập, Trợ lý cá nhân, Mua sắm, Gym, Sự kiện, Thể thao/Concert, Du lịch theo ngày — giá tự tính theo % giá/giờ cơ bản của từng người. Sửa ở khối `<select id="book-service">` trong từng file `ho-so-X.html`.

---

## 16. Về "web admin bằng WordPress"
Chưa triển khai phần này — cần bạn xác nhận rõ hướng làm trước, vì WordPress dùng công nghệ khác hẳn (PHP + MySQL, cần hosting hỗ trợ PHP) so với site tĩnh HTML/CSS/JS hiện tại, không thể "vá thêm" vào code có sẵn mà cần hướng kết nối riêng:

1. **WordPress làm trang quản trị RIÊNG** (subdomain khác, ví dụ `admin.boyfriendmaterial.io.vn`) quản lý người đồng hành/đơn đặt lịch, site tĩnh hiện tại gọi dữ liệu qua **WordPress REST API** để hiển thị — mình khuyên hướng này, giữ nguyên giao diện đã làm.
2. **Chuyển hẳn toàn bộ site sang WordPress** (theme + PHP), bỏ code tĩnh hiện tại — mất công làm lại giao diện nhưng dễ tự quản trị qua wp-admin quen thuộc sau này.
3. Bạn đã có sẵn 1 site WordPress khác, chỉ cần hướng dẫn nhúng/liên kết 1 phần cụ thể.

Khi bạn xác nhận hướng nào (hoặc gửi thông tin site WordPress), mình sẽ triển khai tiếp.

---

## 17. Cách 2 — Sửa nội dung & thêm ảnh KHÔNG CẦN CODE (Decap CMS)
Đã thiết lập sẵn trang quản trị nội dung tại **`/admin`** (ví dụ `boyfriendmaterial.io.vn/admin`), dùng công cụ mã nguồn mở miễn phí **Decap CMS**. Sau khi hoàn tất thiết lập ở dưới, bạn có thể:
- Sửa tên, tuổi, giá, mô tả, sở thích... của từng người đồng hành.
- Tải ảnh đại diện, ảnh bìa, 5 ảnh gallery bằng cách **kéo-thả** ngay trong trình duyệt.
- Thêm người đồng hành mới hoàn toàn không cần đụng tới file HTML.
- Sửa số hotline, email, địa chỉ, chữ trên trang chủ.

Sửa xong bấm "Publish" — trong khoảng vài chục giây đến vài phút, site thật sẽ tự cập nhật cho MỌI người xem, không chỉ máy bạn.

### Vì sao cần vài bước thiết lập trước?
Decap CMS không tự lưu trữ dữ liệu — nó lưu thẳng vào **kho mã nguồn (Git repository)** của bạn trên GitHub. Vì vậy bắt buộc phải có 2 điều kiện: (1) code site nằm trên GitHub, (2) có cách để Decap CMS "đăng nhập" và ghi thay đổi vào đó một cách an toàn. Cách đơn giản nhất — không cần biết lập trình — là dùng **Netlify Identity + Git Gateway**, làm theo đúng các bước sau.

### Bước 1: Đưa code lên GitHub (nếu chưa có)
1. Vào https://github.com, tạo tài khoản miễn phí nếu chưa có.
2. Bấm **New repository**, đặt tên ví dụ `boyfriend-material-website`, để **Public** hoặc **Private** đều được, bấm **Create repository**.
3. Có 2 cách đưa code lên:
   - **Dễ nhất, không cần cài gì:** vào trang repo vừa tạo → **Add file → Upload files** → kéo thả toàn bộ các file/thư mục trong file zip mình gửi vào → **Commit changes**.
   - Hoặc nếu biết dùng Git: `git init`, `git add .`, `git commit -m "init"`, `git remote add origin <link repo>`, `git push`.

### Bước 2: Deploy site qua Netlify (miễn phí)
1. Vào https://netlify.com, đăng ký bằng tài khoản GitHub (nhanh nhất).
2. Bấm **Add new site → Import an existing project → Deploy with GitHub**, chọn đúng repo vừa tạo.
3. Để trống các ô cấu hình build (site này không cần build, để "Build command" trống, "Publish directory" để `.` hoặc để trống) → **Deploy site**.
4. Netlify cấp cho bạn 1 link dạng `ten-ngau-nhien.netlify.app` — đây sẽ là nơi bạn **quản lý nội dung**, còn `boyfriendmaterial.io.vn` vẫn là nơi khách xem site chính thức (xem Bước 5 để nối 2 bên).

### Bước 3: Bật Identity + Git Gateway (để trang /admin đăng nhập được)
1. Trong Netlify, vào site vừa deploy → tab **Site configuration → Identity** → bấm **Enable Identity**.
2. Vẫn trong Identity, kéo xuống **Registration**, chọn **Invite only** (để người lạ không tự đăng ký được vào trang quản trị của bạn).
3. Kéo xuống mục **Services → Git Gateway** → bấm **Enable Git Gateway**.
4. Quay lại tab **Identity**, bấm **Invite users**, nhập email của bạn → bạn sẽ nhận được email mời, bấm vào link trong email để đặt mật khẩu cho tài khoản quản trị.

### Bước 4: Vào trang quản trị
- Truy cập `ten-ngau-nhien.netlify.app/admin` → đăng nhập bằng email/mật khẩu vừa đặt ở Bước 3 → bắt đầu sửa nội dung.
- **Sau khi mọi thứ chạy ổn, bạn có thể trỏ tên miền `boyfriendmaterial.io.vn` sang chạy trên Netlify luôn** (Site configuration → Domain management → Add custom domain), khi đó `boyfriendmaterial.io.vn/admin` sẽ dùng được trực tiếp, không cần domain phụ `netlify.app` nữa.

### Cách thêm 1 người đồng hành mới qua CMS (không cần code)
1. Vào `/admin` → mục **Người đồng hành** → **New Người đồng hành**.
2. Điền đầy đủ thông tin, tải ảnh lên.
3. Đặt **ID** là số chưa dùng (ví dụ 10) và **slug** viết liền không dấu, không trùng người khác (ví dụ `van-hoang-10`).
4. Bấm **Publish**.
5. **Bước bắt buộc thêm:** vào mục **Danh sách hiển thị trên site** → thêm đúng slug vừa đặt vào danh sách → **Publish**. (Đây là giới hạn kỹ thuật: trình duyệt không tự "quét thư mục" được nên cần 1 danh sách riêng ghi rõ ai đang hiển thị — thiếu bước này người mới sẽ không hiện trên site dù đã lưu xong hồ sơ.)

### Lưu ý quan trọng
- Các trang hồ sơ cũ `ho-so-1.html`…`ho-so-9.html` giờ chỉ là **trang chuyển hướng** sang hệ thống mới (`ho-so.html?id=...`) để không hỏng các link cũ đã chia sẻ — dữ liệu thật nằm trong `content/companions/*.json`, sửa ở đó (qua `/admin`) mới có tác dụng.
- Muốn thêm/sửa các đoạn chữ khác ngoài phạm vi mình đã nối CMS (ví dụ nội dung trang "Về chúng tôi", "Dịch vụ"), hiện vẫn cần sửa trực tiếp file HTML như hướng dẫn ở các mục trên — có thể nhờ mình nối thêm CMS cho các phần đó nếu cần.
- Toàn bộ Bước 1-3 chỉ cần làm **1 lần duy nhất**. Sau đó mỗi lần sửa nội dung chỉ cần vào `/admin` như dùng một trang quản trị bình thường.


Vào Google Maps → tìm địa chỉ thật → "Chia sẻ" → "Nhúng bản đồ" → copy link trong `src="..."` dán vào `<iframe>` trong `lien-he.html`.

## Form liên hệ / đăng ký nhận tin (Formspree)
Đăng ký miễn phí tại formspree.io, tạo form, thay `YOUR_FORM_ID` trong các file `.html` bằng ID thật.

## SEO cơ bản đã thêm
Meta description + Open Graph cho các trang chính; favicon dùng logo thật; `robots.txt` và `sitemap.xml` ở thư mục gốc (nhớ thay `your-domain.com` bằng `boyfriendmaterial.io.vn` thật).
