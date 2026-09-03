# Hướng dẫn trang lớp 10A7

Trang chạy trên **Cloudflare Pages** — miễn phí vĩnh viễn, băng thông không giới hạn,
tự động có HTTPS, CDN và chống DDoS của Cloudflare.

---

## 0. TRẠNG THÁI HIỆN TẠI — đã chạy thật

| Mục | Giá trị |
|---|---|
| Địa chỉ trang | **https://lop-10a7.pages.dev** |
| Mã cho học sinh | xem tin nhắn riêng của giáo viên (biến `CLASS_CODE`) |
| Mã của giáo viên | xem tin nhắn riêng (biến `TEACHER_CODE`) — mở thêm `/giao-vien` |
| Mã nguồn | https://github.com/ledinhphat1994-rgb/lop-10a7 (Private) |
| Tài khoản Cloudflare | ledinhphat1994@gmail.com |

Ba biến bí mật `SESSION_SECRET`, `CLASS_CODE`, `TEACHER_CODE` **đã được nạp lên Cloudflare**.
Đã kiểm tra thực tế: chưa nhập mã thì bị chặn (302), mã sai bị từ chối (401), cookie giả mạo bị từ chối,
học sinh không vào được `/giao-vien` (403).

### Tài khoản đã được khoá cứng cho thư mục này

Máy này có nhiều tài khoản GitHub. `gh auth switch` là cài đặt **toàn máy**, không theo thư mục,
nên nó có thể tự nhảy sang tài khoản khác. Vì vậy thư mục lớp 10A7 đã được ghim cứng:

| Ghim ở đâu | Nội dung |
|---|---|
| `.git/config` (riêng thư mục này) | `user.email` = ledinhphat1994@gmail.com; remote ghi rõ `ledinhphat1994-rgb@` |
| `.git/config` — credential helper riêng | Lấy **thẳng token của tài khoản ledinhphat1994-rgb**, không dùng "tài khoản đang active" của `gh` |
| `deploy.js` | `CLOUDFLARE_ACCOUNT_ID` của tài khoản ledinhphat1994 |
| `kiem-tra-tai-khoan.js` | Xác nhận bằng cách **thử vào repo thật**, rồi mới cho deploy |

Nghĩa là: **dù máy đang đăng nhập tài khoản GitHub nào, `git push` và `npm run deploy` trong thư mục này
vẫn chạy đúng vào trang lớp 10A7.** Đã kiểm chứng: cố tình để `gh` ở tài khoản `lephat94` rồi chạy
`npm run deploy` và `git push` — cả hai vẫn thành công và commit vẫn mang tên ledinhphat1994.

Không cần chạy `gh auth switch` cho project này nữa. Bao giờ cũng vậy.

Muốn kiểm tra bất cứ lúc nào:

```bash
npm run kiem-tra
```

### Hai khu vực của trang

| Địa chỉ | Ai vào được | Dùng để làm gì |
|---|---|---|
| `/` | Học sinh (mã lớp) | Thông báo, danh sách lớp, thời khoá biểu, kế hoạch, hình ảnh |
| `/giao-vien/` | Chỉ mã giáo viên | Tổng quan, điểm danh, hồ sơ học sinh, nhật ký lớp, soạn thông báo |

### Nội dung giờ nằm trong cơ sở dữ liệu, không còn sửa tệp

Từ bản nâng cấp này, thầy/cô **soạn thông báo và điểm danh ngay trên web**, không phải sửa tệp JSON
rồi chạy lệnh nữa. Dữ liệu lưu trong **Cloudflare D1** (cơ sở dữ liệu miễn phí, 5GB).

- **Điểm danh**: mở `/giao-vien/` → tab *Điểm danh* → chạm ✓ / T / P / ✗ cho từng em → *Lưu*.
  Nút *Cả lớp có mặt* điền nhanh rồi chỉ sửa vài em vắng.
- **Nhật ký lớp**: ghi khen thưởng, nhắc nhở, vi phạm, cần hỗ trợ — gắn với từng em hoặc cả lớp.
- **Thông báo**: soạn trên web, bấm *Đăng*, cả lớp thấy ngay. Ghim để đẩy lên đầu.
- **Hồ sơ học sinh**: bấm vào tên em bất kỳ để xem lịch sử điểm danh, nhật ký, và sửa chức vụ,
  tổ, số điện thoại phụ huynh, hoàn cảnh.

Chỉ còn hai thứ vẫn sửa bằng tệp: **hình ảnh** (`data/hinh-anh.json`) và giao diện.
Sau khi sửa những thứ đó thì chạy:

```bash
npm run deploy
```

### Sổ điểm

Vào `/giao-vien/` → **Sổ điểm** → chọn học kì → bấm tên môn để nhập điểm.
Mỗi môn có các cột TX (thường xuyên), Giữa kì, Cuối kì. Điểm trung bình tự tính theo công thức
Thông tư 22/2021:

```
ĐTBmhk = (tổng ĐĐGtx + 2 × ĐĐGgk + 3 × ĐĐGck) / (số ĐĐGtx + 5)
```

Xếp loại học lực (Tốt / Khá / Đạt / Chưa đạt) tự suy ra theo Điều 9 Thông tư 22.
Cột **Rèn luyện** ở bảng tổng hợp chọn tay, lưu ngay khi chọn.

> Công thức và ngưỡng xếp loại được viết đúng theo Thông tư 22, nhưng **thầy/cô nên đối chiếu lại
> với hướng dẫn hiện hành của Sở/Trung tâm** trước khi dùng kết quả để vào học bạ.

### Báo cáo

**Thêm → Báo cáo**: chọn khoảng thời gian rồi tải về tệp `.csv`. Có 5 loại: danh sách lớp,
chuyên cần, sổ điểm, sổ nhật ký, báo cáo tổng hợp. Tệp mở thẳng bằng Excel, không lỗi font tiếng Việt,
cột ngăn bằng dấu chấm phẩy đúng chuẩn Excel bản tiếng Việt.

### Mã cá nhân cho học sinh

**Thêm → Mã cá nhân**: bấm *Cấp mã cho ... em chưa có*, rồi bấm *In danh sách mã* để in ra,
cắt rời phát cho từng em. Học sinh vào trang lớp → **Kết quả của tôi** → nhập mã → chỉ thấy
chuyên cần, điểm và nhận xét **của chính mình**.

### Cài lên màn hình chính điện thoại

Mở `lop-10a7.pages.dev/giao-vien/` bằng Chrome trên điện thoại → menu ⋮ → **Thêm vào màn hình chính**.
Ứng dụng chạy toàn màn hình như app thật, và phần giao diện vẫn mở được khi mạng chập chờn
(dữ liệu vẫn cần mạng, vì đó là thông tin riêng tư nên không lưu tạm trên máy).

### Ảnh hoạt động

**Thêm → Ảnh hoạt động**: chọn ảnh hoặc chụp thẳng bằng điện thoại. Ảnh được **thu nhỏ ngay trên máy**
xuống cạnh dài 1600 điểm ảnh trước khi gửi đi, nên ảnh 5 MB từ điện thoại chỉ còn khoảng 200 KB —
không tốn dữ liệu di động và không sợ hết dung lượng. Ảnh lưu trong Cloudflare KV (1 GB miễn phí,
đủ cho khoảng 5000 tấm). Học sinh xem ảnh ở mục *Hình ảnh* trên trang lớp.

### Điểm danh khi mất mạng

Lớp học sóng yếu vẫn điểm danh bình thường. Bấm *Lưu* mà không có mạng thì dữ liệu **nằm chờ
trong máy**, có dải báo màu vàng ở đầu trang. Khi máy có mạng trở lại, hệ thống **tự gửi lên**.
Cũng có nút *Gửi ngay* để chủ động.

Dữ liệu chỉ bị xoá khỏi máy **sau khi máy chủ xác nhận đã lưu**, nên không sợ mất.
Gửi lại nhiều lần cũng ra đúng một kết quả, không nhân đôi.

---

## 10. Tự động đăng khi sửa mã nguồn trên GitHub

Tệp `.github/workflows/dang-len-cloudflare.yml` đã sẵn sàng. Cần khai báo **một lần** hai thứ:

**Bước 1 — Tạo API token** tại <https://dash.cloudflare.com/profile/api-tokens>
→ *Create Token* → chọn mẫu **Edit Cloudflare Workers** → *Continue* → *Create Token* → sao chép chuỗi hiện ra.

**Bước 2 — Dán vào GitHub**: mở <https://github.com/ledinhphat1994-rgb/lop-10a7/settings/secrets/actions>
→ *New repository secret*, thêm hai mục:

| Name | Secret |
|---|---|
| `CLOUDFLARE_API_TOKEN` | chuỗi vừa sao chép ở bước 1 |
| `CLOUDFLARE_ACCOUNT_ID` | `bfc647e65d847f61ca386b7f11c27173` |

Xong. Từ đó mỗi lần `git push` là trang tự đăng lại, không cần chạy `npm run deploy` nữa.

> Tôi cố ý **không** tự tạo và tự dán token này. Token cho quyền sửa toàn bộ Workers của tài khoản,
> nên chỉ thầy/cô mới nên cầm nó. Đây là ranh giới an toàn, không phải hạn chế kỹ thuật.

---

### Cấu trúc cơ sở dữ liệu

Các bảng nằm trong `co-so-du-lieu/01-khoi-tao.sql`: `hoc_sinh`, `diem_danh`, `nhat_ky`,
`thong_bao`, `ke_hoach`, `theo_doi`, `thoi_khoa_bieu`.

Xem nhanh dữ liệu bằng lệnh:

```bash
npx wrangler d1 execute lop-10a7-db --remote --command "SELECT COUNT(*) FROM diem_danh"
```

Muốn **sửa trên GitHub là tự động đăng** (không cần chạy lệnh), làm một lần trong dashboard Cloudflare:
**Workers & Pages → lop-10a7 → Settings → Build → Connect to Git** → chọn repo `lop-10a7`,
production branch `main`, build command để trống, output directory `/`.

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
