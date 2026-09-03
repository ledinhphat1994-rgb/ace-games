# Hướng dẫn đưa trang lớp 10A7 lên mạng (miễn phí 100%)

Trang này chạy trên **Cloudflare Pages** — miễn phí vĩnh viễn, băng thông không giới hạn,
tự động có HTTPS, CDN và chống DDoS của Cloudflare.

---

## 1. Cách bảo mật hoạt động (điều quan trọng nhất)

Nhiều mẫu web "khoá bằng mật khẩu" kiểm tra mã ngay trong trình duyệt bằng JavaScript.
**Cách đó là bảo mật giả**: học sinh chỉ cần bấm F12 hoặc xem mã nguồn là thấy mã và thấy hết nội dung.

Trang này làm khác:

```
Người lạ mở web  →  Cloudflare chạy functions/_middleware.js
                 →  chưa có phiên hợp lệ → CHUYỂN VỀ TRANG ĐĂNG NHẬP
                 →  máy chủ KHÔNG gửi index.html, không gửi danh sách học sinh,
                    không gửi bất cứ tệp nào trong /data
```

- Mã bảo mật được lưu trong **biến môi trường trên Cloudflare**, không nằm trong mã nguồn.
- Sau khi nhập đúng mã, máy chủ cấp một cookie đã **ký bằng HMAC-SHA256**. Không ai tự chế được cookie hợp lệ.
- Cookie đặt `HttpOnly` + `Secure` + `SameSite=Lax`, có hạn **7 ngày**, JavaScript của trang không đọc được.
- Có **2 mã**: mã học sinh (`CLASS_CODE`) và mã giáo viên (`TEACHER_CODE`) — mã giáo viên mở thêm khu vực `/giao-vien`.
- Trang gắn `noindex` và `robots.txt` chặn toàn bộ, nên Google không đưa trang lên kết quả tìm kiếm.

---

## 2. Đưa mã nguồn lên GitHub

1. Tạo tài khoản tại <https://github.com> (miễn phí).
2. Bấm **New repository** → tên ví dụ `lop-10a7` → chọn **Private** → **Create**.
3. Bấm **uploading an existing file**, kéo thả **toàn bộ nội dung thư mục này** (giữ nguyên cấu trúc thư mục
   `assets/`, `data/`, `functions/`, `index.html`, `login.html`) → **Commit changes**.

> Nếu quen dùng Git, chạy trong thư mục dự án:
> ```bash
> git init && git add . && git commit -m "Trang lop 10A7" && git branch -M main && git remote add origin <URL-repo> && git push -u origin main
> ```

---

## 3. Tạo trang trên Cloudflare Pages

1. Đăng ký tài khoản miễn phí tại <https://dash.cloudflare.com>.
2. Vào **Workers & Pages → Create → Pages → Connect to Git**, chọn repo `lop-10a7`.
3. Phần cấu hình build để **trống hết**:
   - Framework preset: `None`
   - Build command: *(để trống)*
   - Build output directory: `/`
4. Bấm **Save and Deploy**.

Sau khoảng 1 phút sẽ có địa chỉ dạng `lop-10a7.pages.dev`.
Lúc này trang **chưa vào được** vì chưa khai báo mã bảo mật — đúng như thiết kế.

---

## 4. Khai báo mã bảo mật (bắt buộc)

Vào **Settings → Variables and Secrets → Add**, thêm 3 biến, kiểu **Secret**,
áp dụng cho cả **Production** và **Preview**:

| Tên biến | Giá trị | Ý nghĩa |
|---|---|---|
| `SESSION_SECRET` | chuỗi ngẫu nhiên dài (xem bên dưới) | Khoá ký cookie. **Không được để lộ.** |
| `CLASS_CODE` | ví dụ `10A7-DinhQuan-2627` | Mã học sinh trong lớp dùng để vào |
| `TEACHER_CODE` | ví dụ `GVCN-10A7-xxxxx` | Mã riêng của giáo viên chủ nhiệm |

Tạo `SESSION_SECRET` ngẫu nhiên bằng cách chạy lệnh sau trên máy:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Sau khi thêm biến, vào tab **Deployments → Retry deployment** để áp dụng.

Mở `https://lop-10a7.pages.dev` → hiện trang nhập mã → nhập `CLASS_CODE` → vào được trang lớp. ✅

**Đổi mã sau này:** chỉ cần sửa giá trị `CLASS_CODE` rồi deploy lại. Muốn *đá tất cả mọi người ra ngoài*
(ví dụ mã bị lộ), hãy đổi luôn `SESSION_SECRET` — mọi cookie cũ lập tức mất hiệu lực.

---

## 5. Tên miền đẹp, miễn phí

Thứ tự ưu tiên tôi khuyên dùng:

1. **`lop10a7.pages.dev`** — có sẵn, miễn phí vĩnh viễn, không cần làm gì thêm.
   Bạn được đổi tên project để chọn tiền tố đẹp (Settings → General → Project name).
2. **Tên miền `.id.vn` / `.io.vn`** — chương trình tên miền quốc gia của VNNIC, phí đăng ký rất thấp
   và có chương trình miễn phí cho cá nhân/học sinh (đăng ký qua các nhà đăng ký trong nước như iNET, Tenten,
   Nhân Hoà). Ví dụ `10a7dinhquan.id.vn`. **Lưu ý:** điều kiện và thời hạn miễn phí do VNNIC/nhà đăng ký quy định
   theo từng thời điểm, bạn cần kiểm tra lại khi đăng ký.
3. **`.eu.org`** — miễn phí vĩnh viễn tại <https://nic.eu.org>, nhưng duyệt chậm (vài tuần) và tên không "Việt Nam" lắm.

Gắn tên miền riêng vào Pages: **Custom domains → Set up a domain** → nhập tên miền →
Cloudflare hướng dẫn trỏ NS/CNAME. HTTPS được cấp tự động, miễn phí.

---

## 6. Bật thêm lớp bảo vệ của Cloudflare (khuyến nghị)

Trong dashboard Cloudflare, ở phần **Security**:

- **Bot Fight Mode**: bật — chặn bot dò quét tự động.
- **WAF → Rate limiting rules** (gói free cho 1 rule): tạo rule cho đường dẫn `/api/login`,
  giới hạn **10 request / 10 phút / 1 IP**, hành động **Block**. Đây là lá chắn tốt nhất chống dò mã.
- **Turnstile**: nếu muốn thêm ô "xác minh không phải robot" ở trang đăng nhập.
- **Under Attack Mode**: chỉ bật khi thực sự bị tấn công.

**Giới hạn số lần nhập sai (tuỳ chọn, làm trong code):** vào **Workers & Pages → KV → Create namespace**
đặt tên `RATE_LIMIT`, rồi vào Pages project → **Settings → Bindings → KV namespace**, thêm binding
tên biến `RATE_LIMIT` trỏ tới namespace vừa tạo. Khi có binding này, hệ thống tự khoá IP nhập sai
quá 8 lần trong 10 phút. Không có binding thì trang vẫn chạy bình thường.

---

## 7. Cách cập nhật nội dung hằng ngày

Toàn bộ nội dung nằm trong thư mục `data/`, chỉ cần sửa tệp trên GitHub
(bấm vào tệp → biểu tượng bút chì → sửa → **Commit changes**).
Cloudflare tự động deploy lại sau ~30 giây.

| Tệp | Nội dung |
|---|---|
| `data/config.json` | Tên lớp, giới thiệu, các ô thống kê, thông tin liên hệ |
| `data/thong-bao.json` | Thông báo. `"ghim": true` để đẩy lên đầu và tô màu nổi bật |
| `data/hoc-sinh.json` | Danh sách lớp (có ô tìm kiếm sẵn) |
| `data/thoi-khoa-bieu.json` | Thời khoá biểu theo tiết × thứ |
| `data/ke-hoach.json` | Kế hoạch, lịch kiểm tra, sự kiện |
| `data/hinh-anh.json` | Ảnh hoạt động |

**Thêm một thông báo mới** — chèn vào đầu mảng trong `data/thong-bao.json`:

```json
{
  "ngay": "2026-09-15",
  "tieuDe": "Họp phụ huynh đầu năm",
  "loai": "Chủ nhiệm",
  "ghim": true,
  "noiDung": "7h30 Chủ nhật ngày 20/9 tại phòng học lớp 10A7. Kính mời quý phụ huynh tham dự đầy đủ."
}
```

**Thêm ảnh:** tải ảnh vào thư mục `assets/img/` trên GitHub, rồi khai báo trong `data/hinh-anh.json`:

```json
[
  { "anh": "/assets/img/khai-giang.jpg", "chuThich": "Lễ khai giảng 05/9/2026" }
]
```

> Lưu ý: `ngay` luôn viết theo dạng `NĂM-THÁNG-NGÀY` (`2026-09-15`), trang sẽ tự hiển thị thành `15/09/2026`.
> Sau khi sửa, nếu trang trắng thì gần như chắc chắn là **thiếu dấu phẩy hoặc thừa dấu phẩy** trong JSON —
> dán nội dung vào <https://jsonlint.com> để kiểm tra.

---

## 8. Chạy thử trên máy trước khi đưa lên mạng

```bash
npx wrangler pages dev . --binding SESSION_SECRET=test-secret CLASS_CODE=10A7 TEACHER_CODE=GVCN
```

Mở `http://localhost:8788`, nhập `10A7` để kiểm tra.

---

## 9. Vài lời khuyên thực tế

- **Đưa mã cho học sinh trực tiếp trên lớp**, đừng đăng lên Zalo/Facebook nhóm công khai.
- Mỗi học kì nên **đổi `CLASS_CODE` một lần**, và đổi ngay khi nghi ngờ bị lộ.
- **Không đăng lên trang này**: số điện thoại phụ huynh, địa chỉ nhà, căn cước, ảnh chụp học bạ/điểm chi tiết
  gắn với tên từng em. Mã bảo mật bảo vệ khỏi người ngoài, nhưng không ngăn được học sinh trong lớp chụp màn hình.
- Repo trên GitHub nên để **Private**; dù vậy trong mã nguồn cũng không hề chứa mã bảo mật.
