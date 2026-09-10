# Hướng dẫn web quản lý lớp (nhiều lớp)

Trang chạy trên **Cloudflare Pages** — miễn phí vĩnh viễn, băng thông không giới hạn,
tự động có HTTPS, CDN và chống DDoS của Cloudflare.

---

## 0. TRẠNG THÁI HIỆN TẠI — đã chạy thật

| Mục | Giá trị |
|---|---|
| Địa chỉ trang | **https://gdtxdinhquan.pages.dev** (địa chỉ cũ `lop-10a7.pages.dev` vẫn còn, chưa xoá) |
| Mã cho học sinh | xem tin nhắn riêng của giáo viên (biến `CLASS_CODE`) |
| Mã của giáo viên | xem tin nhắn riêng (biến `TEACHER_CODE`) — mở thêm `/giao-vien` |
| Mã nguồn | https://github.com/ledinhphat1994-rgb/lop-10a7 (Private) |
| Tài khoản Cloudflare | ledinhphat1994@gmail.com |

Ba biến bí mật `SESSION_SECRET`, `CLASS_CODE`, `TEACHER_CODE` **đã được nạp lên Cloudflare**.
Đã kiểm tra thực tế: chưa nhập mã thì bị chặn (302), mã sai bị từ chối (401), cookie giả mạo bị từ chối,
học sinh không vào được `/giao-vien` (403).

## 0b. Quản lý nhiều lớp (từ 2026-09-06)

Web giờ phục vụ được **nhiều lớp cùng lúc** trên chung một địa chỉ `gdtxdinhquan.pages.dev` —
mỗi lớp dữ liệu tách biệt tuyệt đối (học sinh, điểm, điểm danh, quỹ, thông báo, thư viện ảnh/
nhạc/video, thời khoá biểu, báo cáo...), không thể lẫn giữa các lớp dù chung một web.

**Nguyên tắc cốt lõi: mỗi lớp có một mã đăng nhập giáo viên RIÊNG.** Không có màn hình "chọn
lớp" — gõ đúng mã của lớp nào thì vào thẳng đúng lớp đó, tự động, không cần chọn gì thêm.

| Lớp | Mã giáo viên |
|---|---|
| Lớp 10A7 | mã bạn đã tự đặt trước đó (xem/đổi ở Mã đăng nhập) |
| Lớp 11A1 | `GV11A1-G3WNFYKN` — mã tạm, **nên đổi ngay** ở bước dưới |

**Biết đang ở lớp nào:** góc trên bên trái khu quản lý luôn ghi rõ *"Đang quản lý: <tên lớp>"*,
tiêu đề tab trình duyệt cũng hiện tên lớp — nhìn một cái là biết ngay, không sợ thao tác nhầm.

**Đổi mã đăng nhập của một lớp:** đăng nhập đúng lớp đó → *Khu quản lý → Mã đăng nhập* → đặt mã
mới. Chỉ đổi mã của lớp đang đăng nhập, không đụng tới lớp kia.

**Xem đồng thời cả 2 lớp cùng lúc (không cần đăng xuất/đăng nhập lại liên tục):** vì cookie phiên
đăng nhập dùng chung theo trình duyệt, 1 cửa sổ chỉ giữ được 1 phiên tại một thời điểm — mở lớp
kia trong cùng cửa sổ sẽ tự đăng xuất lớp đang xem. Muốn xem cả hai cùng lúc:
- Cách 1: 1 cửa sổ Chrome bình thường (đăng nhập lớp A) + 1 cửa sổ **ẩn danh/Incognito** (đăng
  nhập lớp B) — hai cửa sổ giữ hai phiên độc lập.
- Cách 2: dùng 2 trình duyệt khác nhau (vd Chrome cho lớp A, Edge/Cốc Cốc cho lớp B).
- Cách 3 (gọn nhất trên điện thoại): thêm cả 2 địa chỉ vào màn hình chính như 2 "app" riêng —
  Chrome trên Android/iOS coi mỗi app thêm vào màn hình chính là một hồ sơ trình duyệt tách biệt.

**Dung lượng lưu trữ (ảnh/nhạc/video):** chia riêng cho từng lớp (hiện mỗi lớp ~4,75 GB trong
tổng 9,5 GB an toàn) — lớp này tải nhiều không làm hết chỗ của lớp kia.

**Thêm lớp thứ 3 trở lên:** chưa làm nút tự thêm trên giao diện vì rất hiếm khi cần — chỉ cần
nhắn Claude "tạo thêm lớp <tên>, cùng/khác trường ra sao" là tạo xong trong vài phút (tạo lớp
mới trong cơ sở dữ liệu + cấp mã đăng nhập riêng), không cần chạm tới lớp đang có.

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
| `/` | Học sinh (mã lớp) | Thông báo (gồm cả mốc sự kiện, mức độ quan trọng), danh sách lớp, thời khoá biểu, hình ảnh |
| `/giao-vien/` | Chỉ mã giáo viên | Điểm danh, hồ sơ học sinh, soạn thông báo |

### Nội dung giờ nằm trong cơ sở dữ liệu, không còn sửa tệp

Từ bản nâng cấp này, thầy/cô **soạn thông báo và điểm danh ngay trên web**, không phải sửa tệp JSON
rồi chạy lệnh nữa. Dữ liệu lưu trong **Cloudflare D1** (cơ sở dữ liệu miễn phí, 5GB).

- **Điểm danh**: mở `/giao-vien/` → tab *Điểm danh* → chạm ✓ / T / P / ✗ cho từng em → *Lưu*.
  Nút *Cả lớp có mặt* điền nhanh rồi chỉ sửa vài em vắng.
- **Thông báo**: soạn trên web, bấm *Đăng*, cả lớp thấy ngay. Ghim để đẩy lên đầu.
- **Hồ sơ học sinh**: bấm vào tên em bất kỳ để xem lịch sử điểm danh, và sửa chức vụ,
  tổ, số điện thoại phụ huynh, hoàn cảnh.

Chỉ còn hai thứ vẫn sửa bằng tệp: **hình ảnh** (`data/hinh-anh.json`) và giao diện.
Sau khi sửa những thứ đó thì chạy:

```bash
npm run deploy
```

### Báo cáo

**Thêm → Báo cáo**: chọn khoảng thời gian rồi tải về tệp `.csv`. Có nhiều loại: danh sách lớp,
chuyên cần, báo cáo tổng hợp, và nhiều mục khác. Tệp mở thẳng bằng Excel, không lỗi font tiếng Việt,
cột ngăn bằng dấu chấm phẩy đúng chuẩn Excel bản tiếng Việt.

### Mã cá nhân cho học sinh

**Thêm → Mã cá nhân**: bấm *Cấp mã cho ... em chưa có*, rồi bấm *In danh sách mã* để in ra,
cắt rời phát cho từng em. Học sinh vào trang lớp → **Kết quả của tôi** → nhập mã → chỉ thấy
chuyên cần, điểm và nhận xét **của chính mình**.

### Cài lên màn hình chính điện thoại

Mở `gdtxdinhquan.pages.dev/giao-vien/` bằng Chrome trên điện thoại → menu ⋮ → **Thêm vào màn hình chính**.
Ứng dụng chạy toàn màn hình như app thật, và phần giao diện vẫn mở được khi mạng chập chờn
(dữ liệu vẫn cần mạng, vì đó là thông tin riêng tư nên không lưu tạm trên máy).

### Ảnh hoạt động

**Thêm → Ảnh hoạt động**: chọn ảnh hoặc chụp thẳng bằng điện thoại. Ảnh được **thu nhỏ ngay trên máy**
xuống cạnh dài 1600 điểm ảnh trước khi gửi đi, nên ảnh 5 MB từ điện thoại chỉ còn khoảng 200 KB —
không tốn dữ liệu di động và không sợ hết dung lượng. Ảnh lưu trong Cloudflare R2 (10 GB miễn phí,
đủ cho khoảng 50.000 tấm và có chốt chặn an toàn không phát sinh chi phí). Học sinh xem ảnh ở mục *Hình ảnh* trên trang lớp.

### Điểm danh khi mất mạng

Lớp học sóng yếu vẫn điểm danh bình thường. Bấm *Lưu* mà không có mạng thì dữ liệu **nằm chờ
trong máy**, có dải báo màu vàng ở đầu trang. Khi máy có mạng trở lại, hệ thống **tự gửi lên**.
Cũng có nút *Gửi ngay* để chủ động.

Dữ liệu chỉ bị xoá khỏi máy **sau khi máy chủ xác nhận đã lưu**, nên không sợ mất.
Gửi lại nhiều lần cũng ra đúng một kết quả, không nhân đôi.

---

## 9b. Chống mất dữ liệu — mọi mục có thể cấp quyền cho người khác

Câu hỏi thầy/cô đặt ra rất đúng: nếu ai đó chiếm được mã đăng nhập (hoặc được cấp quyền) và phá dữ
liệu, làm sao lấy lại? Có **hai lớp** bảo vệ, độc lập với nhau:

### Lớp 1 — Điểm khôi phục tự động (đã bật sẵn cho mọi mục có thể cấp quyền)

**Mỗi lần** ghi/sửa/xoá ở Thủ quỹ, Điểm danh, Thông báo, Thời khoá biểu, Hoạt động lớp, hệ thống
**tự động chụp lại toàn bộ dữ liệu của đúng mục đó ngay trước đó** — không cần thầy/cô làm gì. Vào
trang tương ứng → **🛡️ Lịch sử & khôi phục** để xem danh sách các điểm này (Thủ quỹ/Điểm danh giữ
200 điểm gần nhất; 3 mục còn lại giữ 100 điểm — đều đủ dùng vài tháng).

Nếu phát hiện dữ liệu bị phá: chọn đúng điểm **trước lúc** sự cố xảy ra → **Khôi phục về đây** →
toàn bộ dữ liệu mục đó trở về đúng như lúc đó. Bản thân việc khôi phục cũng tự tạo thêm một điểm
mới, nên nếu lỡ chọn nhầm vẫn quay lại được — không có thao tác nào là "điểm chết".

**Chỉ giáo viên chủ nhiệm khôi phục được**, kể cả tài khoản được cấp quyền (Thủ quỹ, Lớp trưởng...)
cũng chỉ **xem** được lịch sử, không tự khôi phục. Lý do: nếu chính mã đó bị lộ, kẻ xấu phá dữ liệu
xong không thể tự "khôi phục" để xoá dấu vết — chỉ mã giáo viên mới làm được, và mã đó thầy/cô là
người duy nhất giữ.

### Thùng rác riêng cho 3 Thư viện Ảnh / Âm thanh / Video

3 thư viện media không dùng chung cơ chế "điểm khôi phục" ở trên vì file thật nằm trong kho lưu trữ
R2 — xoá thẳng là mất file vĩnh viễn, không "khôi phục" nào cứu lại được. Vì vậy bấm **Xoá** ở 3 thư
viện này chỉ **chuyển vào Thùng rác** (nút **🗑 Thùng rác** ở đầu mỗi trang): file thật vẫn còn nguyên,
**Khôi phục** lại được bất cứ lúc nào trong vòng **30 ngày**, hoặc bấm **Xoá vĩnh viễn** để xoá hẳn
sớm hơn. Sau 30 ngày, mục trong thùng rác tự động bị xoá vĩnh viễn (dọn dẹp mỗi khi có ai mở xem
thùng rác — không cần tiến trình nền riêng). Lưu ý: dung lượng file trong thùng rác **vẫn tính vào
trần lưu trữ của lớp** (file thật vẫn đang chiếm chỗ thật trong kho), nên nếu gần đầy kho hãy xoá
vĩnh viễn sớm thay vì chỉ để trong thùng rác chờ tự dọn.

### Lớp 2 — Cloudflare D1 Time Travel (bảo vệ toàn bộ cơ sở dữ liệu, có sẵn, miễn phí)

Ngoài Thủ quỹ, **toàn bộ cơ sở dữ liệu** (điểm danh, thông báo, hồ sơ học sinh...) được
Cloudflare tự động lưu lại liên tục trong **30 ngày gần nhất**, không tốn thêm phí, không cần cấu hình.
Đây là tính năng có sẵn của D1, độc lập hoàn toàn với mọi thứ thầy/cô hay tôi làm trong ứng dụng —
kể cả nếu toàn bộ mã nguồn bị xoá, dữ liệu này vẫn còn.

Khi cần khôi phục **toàn bộ** cơ sở dữ liệu về một thời điểm bất kỳ trong 30 ngày qua (ví dụ nghi ngờ
tài khoản Cloudflare bị chiếm), chạy:

```bash
npx wrangler d1 time-travel restore lop-10a7-db --timestamp="2026-09-10T08:00:00Z"
```

Hoặc khôi phục về một "bookmark" cụ thể (xem danh sách bằng `wrangler d1 time-travel info lop-10a7-db`).
Việc này cần token của tài khoản Cloudflare nên thầy/cô nhờ tôi thực hiện khi cần, hoặc tự chạy lệnh trên
nếu đã đăng nhập `wrangler`.

**Tóm gọn:** việc nhỏ (nhập nhầm một khoản thu) → tự khôi phục ngay trong Thủ quỹ, mất vài giây.
Việc lớn (nghi ngờ bị hack toàn bộ) → khôi phục cả cơ sở dữ liệu về trước thời điểm đó, còn nguyên trong 30 ngày.

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

Các bảng nằm trong `co-so-du-lieu/01-khoi-tao.sql`: `hoc_sinh`, `diem_danh`,
`thong_bao`, `theo_doi`, `thoi_khoa_bieu`. (`ke_hoach` không còn dùng từ bản cập nhật
"18-thong-bao-mo-rong.sql" — chức năng đã gộp vào `thong_bao`, bảng cũ vẫn giữ nguyên dữ liệu.
`nhat_ky` — "Nhật ký lớp" — đã bỏ hẳn từ "40-xoa-nhat-ky-lop.sql". `diem`/`ren_luyen`/`mon_hoc`
— "Sổ điểm" — đã bỏ hẳn từ "42-xoa-so-diem.sql".)

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

1. **`<tên>.pages.dev`** — có sẵn, miễn phí vĩnh viễn, không cần làm gì thêm.
   **Đính chính (2026-09):** Cloudflare KHÔNG cho đổi tên một project Pages đã tạo (tài liệu
   chính thức xác nhận `*.pages.dev` không đổi được sau khi tạo) — muốn đổi tiền tố phải tạo
   MỘT PROJECT MỚI với tên khác (đổi `name` trong `wrangler.toml` rồi deploy lại), project cũ
   vẫn còn nguyên cho tới khi tự tay xoá trên dashboard.
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
- **Turnstile**: ĐÃ BẬT (2026-09-09) — xem chi tiết bên dưới.
- **Under Attack Mode**: chỉ bật khi thực sự bị tấn công.

**Giới hạn số lần nhập sai (tuỳ chọn, làm trong code):** vào **Workers & Pages → KV → Create namespace**
đặt tên `RATE_LIMIT`, rồi vào Pages project → **Settings → Bindings → KV namespace**, thêm binding
tên biến `RATE_LIMIT` trỏ tới namespace vừa tạo. Khi có binding này, hệ thống tự khoá IP nhập sai
quá 8 lần trong 10 phút. Không có binding thì trang vẫn chạy bình thường.

### 6b. Turnstile — chặn dò mã tự động kể cả khi đổi IP liên tục

Rate limiting ở trên tính theo IP, nên kẻ dò mã có thể né bằng cách đổi IP qua VPN/proxy liên tục.
Turnstile đòi hỏi một trình duyệt thật giải được thử thách (gần như vô hình với người dùng thật),
chặn được cả trường hợp đó. **Đã bật từ 2026-09-09** cho widget domain `gdtxdinhquan.com` +
`www.gdtxdinhquan.com`, Widget Mode **Managed** — người dùng thật hầu như không thấy gì cả, chỉ
khựng lại và báo lỗi thân thiện nếu là trình duyệt tự động/máy giả lập.

- `TURNSTILE_SITE_KEY` (công khai) nằm sẵn trong `login.html`.
- `TURNSTILE_SECRET_KEY` (bí mật) đặt qua Pages project → **Settings → Variables and Secrets**
  (không nằm trong code, không lên GitHub).

**Muốn đổi/xoá khoá sau này:** vào **Cloudflare Dashboard → Turnstile** để xem/xoá widget, hoặc
tạo widget mới rồi lặp lại 2 bước: sửa `TURNSTILE_SITE_KEY` trong `login.html` (`npm run deploy`),
và cập nhật `TURNSTILE_SECRET_KEY` trên Pages project → **Settings → Variables and Secrets**.
Muốn tắt hẳn: xoá giá trị `TURNSTILE_SITE_KEY` trong `login.html` (đăng nhập vẫn chạy bình thường
như trước khi có Turnstile, không cần xoá biến secret).

### 6c. Cảnh báo đăng nhập từ IP lạ (không tự chặn)

Mỗi lượt đăng nhập thành công đều được ghi lại (giáo viên, tài khoản có quyền, học sinh thường).
Nếu một mã đăng nhập từ IP KHÁC với lần thành công gần nhất, dòng đó được đánh dấu ⚠️ ở
**Khu quản lý → Thêm → Mã cá nhân → 📜 Nhật ký đăng nhập** — CHỈ để thầy/cô tự xem xét, hệ thống
không tự khoá, vì mạng di động (4G/5G) đổi IP liên tục là chuyện bình thường, khoá cứng theo IP sẽ
khoá nhầm học sinh dùng điện thoại.

### 6d. Cloudflare Access + Google — ĐÃ THỬ, GỠ BỎ vì không hợp với web kiểu SPA (2026-09-09)

Từng bật Cloudflare Access (bắt đăng nhập Google trước) cho đúng tiền tố `/api/gv/rieng/*` — API
mà CHỈ giáo viên chủ nhiệm gọi được, tách sẵn trong mã nguồn để dễ đặt thêm lớp bảo vệ kiểu này
sau này nếu muốn. Đã BẬT THỬ, GẶP LỖI THẬT trên production rồi GỠ BỎ, ghi lại để không lặp lại:

**Vì sao gỡ:** Access thỉnh thoảng cần "làm mới" phiên xác thực bằng cách chuyển hướng (302) — cách
này chỉ hoạt động khi trình duyệt tải LẠI CẢ TRANG. Nhưng khu giáo viên là một SPA (tải 1 lần, sau
đó gọi API ngầm bằng `fetch()` không tải lại trang) — khi Access cố chuyển hướng một lệnh `fetch()`
ngầm như vậy, trình duyệt chặn vì lỗi CORS, giáo viên thấy "Không kết nối được máy chủ" dù đã đăng
nhập đúng, không rõ nguyên nhân. Lỗi này lặp lại ĐỊNH KỲ (mỗi khi phiên Access cần làm mới), không
sửa được bằng cách đăng nhập lại app hay đổi mã — đã kiểm chứng thật trên production, xem lại lịch
sử trò chuyện ngày 2026-09-09 nếu cần chi tiết.

**Thay vào đó, dùng mục 6e (TOTP)** — đạt đúng mục tiêu "mã giáo viên bị lộ vẫn cần thêm 1 yếu tố"
nhưng xử lý hoàn toàn trong code của web (không qua Cloudflare edge), nên không dính lỗi CORS/SPA
kiểu này, và còn bảo vệ được TOÀN BỘ đăng nhập giáo viên (không riêng gì `/api/gv/rieng/*`).

**Nếu sau này muốn thử lại Access** (ví dụ đổi sang kiến trúc không phải SPA, hoặc chấp nhận thêm
việc code để tự làm mới phiên Access qua iframe ẩn): hạ tầng `/api/gv/rieng/*` trong mã nguồn vẫn
còn nguyên, chỉ cần tạo lại Application ở Zero Trust → Access → Applications trỏ đúng path đó.

### 6e. Xác thực 2 lớp bằng Authenticator — ngay trong bước đăng nhập giáo viên

Khác với Access ở mục 6d (chặn Ở NGOÀI web, trước cả khi vào), đây là lớp thứ 2 nằm NGAY BÊN
TRONG chính bước nhập mã: bật lên thì đăng nhập giáo viên cần **đúng mã đăng nhập VÀ đúng mã 6 số**
đổi mỗi 30 giây từ app Authenticator (Google Authenticator, Authy...) mới vào được. Không cần cấu
hình gì trên Cloudflare — tự bật/tắt ngay trên web, không cần deploy lại.

**Bật lên:** Khu quản lý → Thêm → Mã cá nhân → mục **"🔐 Xác thực 2 lớp (Authenticator)"** → bấm
**"Bật xác thực 2 lớp"** → **"Bắt đầu"** → web hiện ra một **mã thiết lập dạng chữ** (vd
`MKQ6 O6I2 5QGC YJHE...`) → mở app Authenticator trên điện thoại → **Thêm tài khoản → "Nhập mã
thiết lập"/"Enter a setup key"** (không phải quét QR) → dán đúng chuỗi đó vào → app hiện ra mã 6
số → gõ đúng mã đó vào web → **"Xác nhận, bật ngay"**.

**Tắt đi:** cũng ở mục đó, bấm **"Tắt xác thực 2 lớp"** → nhập đúng mã 6 số app đang hiện → xác
nhận. Bắt buộc phải đúng mã hiện tại mới tắt được, để một phiên trình duyệt bị đánh cắp (không
phải chính giáo viên) không tự ý tắt lớp bảo vệ này đi.

**Lưu ý quan trọng:** mã thiết lập (chuỗi chữ lúc bật) chỉ hiện ĐÚNG MỘT LẦN lúc thiết lập, không
xem lại được sau đó. Nếu đổi điện thoại hoặc xoá nhầm app Authenticator, cách duy nhất để vào lại
được là: **bấm "Tắt xác thực 2 lớp" TRÊN MỘT THIẾT BỊ CÒN ĐANG ĐĂNG NHẬP SẴN** (phiên cũ vẫn còn
hiệu lực trong 7 ngày kể từ lần đăng nhập gần nhất), rồi bật lại từ đầu trên điện thoại mới. Nếu
không còn thiết bị nào đang đăng nhập sẵn nữa, cần nhắn Claude hỗ trợ xoá trực tiếp trong cơ sở dữ
liệu (`UPDATE ma_dang_nhap SET totp_secret = NULL WHERE lop_id = ... AND vai_tro = 'teacher'`).

### 6f. Trần tải lên mỗi ngày cho tài khoản được cấp quyền (2026-09-09)

Tài khoản được cấp quyền (lớp trưởng, thủ quỹ, tổ trưởng... — không áp dụng giáo viên chủ nhiệm,
giáo viên không giới hạn) chỉ tải lên tối đa **50 MB/ngày**, gộp chung cả 3 thư viện (Ảnh, Âm
thanh, Video) — tính theo giờ Việt Nam, hết ngày tự làm mới. **Không giới hạn số bài đăng** ở
Hoạt động lớp/Thông báo, chỉ giới hạn dung lượng file đính kèm nếu có. Mục đích: một tài khoản bị
lộ/lạm dụng chỉ phá được tối đa ngần ấy dung lượng mỗi ngày, không "cháy" hết trần lưu trữ chung
của cả lớp (mục 6 ở trên) chỉ trong một lần.

**Tự đổi mức trên web** (không cần sửa code/deploy): **Khu quản lý → Thêm → Mã cá nhân →
"📊 Trần tải lên mỗi ngày" → ✎ Đổi mức này** — để trống ô nhập để quay lại dùng mặc định 50 MB.
Cùng chỗ này còn hiện danh sách **"Đã tải hôm nay"** của từng tài khoản (chỉ hiện ai đã tải gì
đó), để biết ai sắp chạm trần hoặc có dấu hiệu bất thường trước khi cân nhắc đổi mức.

Vượt trần thì tài khoản đó thấy thông báo rõ ràng ("đã tải lên X MB hôm nay, vượt giới hạn Y
MB/ngày..."), không có cách "chờ tí rồi thử lại" — phải đợi sang ngày hôm sau (giờ Việt Nam) hoặc
nhờ giáo viên chủ nhiệm tải giúp.

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

## 7b. Thư viện Âm thanh & Nhạc nền trang chủ

Khu quản lý có mục **Thư viện Âm thanh** (`#/thu-vien-am-thanh`) dùng để tải bài hát (.mp3) và chọn bài phát làm nhạc nền trang chủ:

- **Đặt nhạc nền:** Bấm nút **`🎵 Đặt làm nhạc nền`** trên thẻ của bài hát muốn chọn. Thẻ bài hát sẽ chuyển sang trạng thái **`🔊 Đang làm nhạc nền`**, đồng thời biểu tượng chiếc loa trên thanh đầu trang sẽ sáng lên.
- **Tắt nhạc nền:** Nếu không muốn phát nhạc nền nữa, bấm nút **`⏹ Tắt nhạc nền`** trên bài đang phát.
- **Cách nghe trên web / điện thoại:** Theo quy định bảo mật của các trình duyệt hiện nay (Chrome, Safari, Edge), trang web **không được tự ý phát tiếng** khi vừa mở. Giáo viên và học sinh muốn nghe nhạc nền hãy **bấm vào biểu tượng chiếc loa 🎵 ở góc trên bên phải thanh đầu trang**. Có thể trượt thanh âm lượng khi rê chuột/chạm vào biểu tượng này.
- **Xoá bài:** Ô tích `Chọn xoá` ở đầu mỗi bài chỉ dùng khi cần xoá bài (chuyển vào thùng rác), không liên quan đến việc chọn bài làm nhạc nền.

---

## 8. Chạy thử trên máy trước khi đưa lên mạng

Mã dùng thử nằm trong tệp `.dev.vars` ở thư mục dự án (tệp này không bao giờ lên GitHub).

```bash
npm run dev
```

Mở `http://localhost:8788` rồi đăng nhập bằng mã trong `.dev.vars`.
Lúc chạy thử, trang đọc bản cơ sở dữ liệu **trên máy**, nên thêm/xoá thử thoải mái,
không ảnh hưởng gì tới dữ liệu thật của lớp.

### Soát một lượt trước khi đăng

```bash
npm run kiem-tra-du-lieu
```

Lệnh này tự tìm: tệp JSON sai dấu phẩy, JS sai cú pháp, đường dẫn gõ sai,
câu SQL xoá cả bảng, và mã bảo mật lỡ viết thẳng vào mã nguồn.
Nếu có lỗi thì `npm run deploy` **dừng lại**, không đăng gì cả — cứ sửa rồi chạy lại.
Muốn soát kỹ hơn cách viết mã thì thêm `npm run lint`.

---

## 9. Vài lời khuyên thực tế

- **Đưa mã cho học sinh trực tiếp trên lớp**, đừng đăng lên Zalo/Facebook nhóm công khai.
- Mỗi học kì nên **đổi `CLASS_CODE` một lần**, và đổi ngay khi nghi ngờ bị lộ.
- **Không đăng lên trang này**: số điện thoại phụ huynh, địa chỉ nhà, căn cước, ảnh chụp học bạ/điểm chi tiết
  gắn với tên từng em. Mã bảo mật bảo vệ khỏi người ngoài, nhưng không ngăn được học sinh trong lớp chụp màn hình.
- Repo trên GitHub nên để **Private**; dù vậy trong mã nguồn cũng không hề chứa mã bảo mật.

---

## 10. Tối ưu hoá, Mở rộng & Bảo trì lâu dài

### A. Tối ưu tốc độ tải trang
- Khi chạy lệnh `npm run build` hoặc `npm run deploy`, hệ thống **tự động nén (minify) 100% các tệp JavaScript và CSS** trong `dist/`.
- Tiết kiệm hơn **250 KB (gần 40% dung lượng)**, giúp học sinh mở trang nhanh gấp đôi ngay cả khi dùng mạng 3G/4G yếu.
- Mã nguồn gốc trong thư mục dự án vẫn giữ nguyên dạng rõ ràng, đầy đủ chú thích tiếng Việt để giáo viên dễ đọc và sửa chữa.

### B. Bảo trì cơ sở dữ liệu dễ dàng
- Tệp `co-so-du-lieu/00-schema-chuan-toan-bo.sql` đã tổng hợp toàn bộ 54 đợt nâng cấp thành một cấu trúc chuẩn duy nhất.
- Khi cần tạo lớp mới, kiểm thử hoặc chuyển giao hệ thống, chỉ cần chạy 1 tệp này là có đầy đủ toàn bộ bảng, khóa và chỉ mục.
- Chi tiết hướng dẫn xem tại: `co-so-du-lieu/README-CSDL.md`.

### C. Mở rộng dung lượng & Cấu hình mạnh hơn
1. **Lưu trữ tài liệu nặng (R2 Object Storage):**
   - Đã liên kết sẵn bucket Cloudflare R2 `lop-10a7-anh` với 10 GB miễn phí và không giới hạn băng thông tải về.
   - Khi cần mở rộng kho đề thi, tài liệu ôn thi THPT (.pdf, .docx), chỉ cần tải lên R2 và lưu khoá vào bảng dữ liệu — không tốn dung lượng cơ sở dữ liệu D1.
2. **Nâng cấp cấu hình chịu tải (Khi mở rộng toàn trường):**
   - Hệ thống chạy Serverless trên hạ tầng toàn cầu của Cloudflare, tự động chịu tải hàng ngàn học sinh cùng lúc mà không lo sập RAM hay nghẽn CPU như máy chủ VPS.
   - Khi cần nâng cấp dung lượng cao hơn (50 GB D1, 10 triệu lượt truy cập/tháng), chỉ cần kích hoạt gói **Workers Paid ($5/tháng)** trên Cloudflare.
