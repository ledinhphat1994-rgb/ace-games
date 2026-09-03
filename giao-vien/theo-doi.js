/* Khu vực giáo viên — dữ liệu lấy từ /giao-vien/data/theo-doi.json.
   Đường dẫn nằm trong /giao-vien nên middleware chỉ cho mã giáo viên tải về;
   học sinh dù đã đăng nhập cũng nhận lỗi 403. */

const $ = (s) => document.querySelector(s);

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined && text !== null) n.textContent = String(text);
  return n;
}

// Mức độ ưu tiên hiển thị của từng trạng thái.
const MAU = {
  'Chưa có sách': 'danger', 'Có nhưng thiếu': 'warn', 'Đủ bộ sách': 'ok',
  'Chưa nhận': 'warn', 'Chưa có đ/phục': 'danger', 'Đã nhận': 'ok', 'Đợt 2': 'ok',
  'Không đi LĐ': 'danger', 'Vắng có phép': 'warn', 'Chưa ĐD sau LĐ': 'warn', 'Có mặt đầy đủ': 'ok',
  'Chưa rõ': '',
};

function the(giaTri) {
  const span = el('span', 'tag ' + (MAU[giaTri] ?? ''), giaTri || '—');
  return span;
}

function dem(ds, khoa) {
  return ds.reduce((acc, x) => {
    const k = x[khoa] || 'Chưa rõ';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function theCard(tieuDe, bang, tong) {
  const card = el('div', 'card');
  card.append(el('h3', null, tieuDe));
  const ul = el('ul', 'thong-ke');
  Object.entries(bang)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ten, so]) => {
      const li = el('li');
      li.append(the(ten), el('b', null, `${so} em`), el('span', null, `${Math.round((so / tong) * 100)}%`));
      ul.append(li);
    });
  card.append(ul);
  return card;
}

(async function () {
  let dl;
  try {
    const res = await fetch('/giao-vien/data/theo-doi.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    dl = await res.json();
  } catch (e) {
    $('#bangTheoDoi').replaceChildren(
      Object.assign(el('td', 'empty', 'Không tải được dữ liệu theo dõi.'), { colSpan: 6 })
    );
    return;
  }

  const ds = dl.danhSach || [];
  $('#nguonDuLieu').textContent = `Nguồn: ${dl.nguon || '—'} · cập nhật ${dl.capNhat || '—'} · ${ds.length} học sinh`;

  // --- Tổng quan ---
  $('#tongQuan').replaceChildren(
    theCard('Sách giáo khoa', dem(ds, 'sgk'), ds.length),
    theCard('Đồng phục', dem(ds, 'dongPhuc'), ds.length),
    theCard('Lao động 3/9/2026', dem(ds, 'laoDong'), ds.length)
  );

  // --- Cần xử lý ---
  const nhom = [
    ['Chưa có sách giáo khoa', ds.filter((x) => x.sgk === 'Chưa có sách'), 'danger',
     'Cần rà soát để đề xuất hỗ trợ hoặc mượn sách thư viện.'],
    ['Hoàn cảnh cần quan tâm', ds.filter((x) => x.hoanCanh && !/^\d/.test(x.hoanCanh)), 'warn',
     'Ưu tiên khi xét hỗ trợ, miễn giảm, tặng sách vở.'],
    ['Chưa nhận đồng phục', ds.filter((x) => /Chưa/.test(x.dongPhuc)), 'warn',
     'Nhắc các em lên nhận, hoặc báo trường bổ sung.'],
    ['Vắng lao động không phép', ds.filter((x) => x.laoDong === 'Không đi LĐ'), 'danger',
     'Cần liên hệ phụ huynh và ghi nhận vào sổ chủ nhiệm.'],
  ];

  const boxCanXuLy = $('#canXuLy');
  boxCanXuLy.replaceChildren();
  nhom.forEach(([tieuDe, danhSach, mau, huongDan]) => {
    const card = el('div', 'card');
    const h = el('h3');
    h.append(document.createTextNode(tieuDe + ' '), el('span', 'tag ' + mau, `${danhSach.length} em`));
    card.append(h, el('p', 'empty', huongDan));
    if (danhSach.length) {
      const ul = el('ul', 'ds-ten');
      danhSach.forEach((x) => {
        const li = el('li', null, `${x.stt}. ${x.hoTen}`);
        if (x.hoanCanh && !/^\d/.test(x.hoanCanh)) li.append(document.createTextNode(' '), el('span', 'tag warn', x.hoanCanh));
        ul.append(li);
      });
      card.append(ul);
    }
    boxCanXuLy.append(card);
  });

  // --- Bảng chi tiết ---
  const body = $('#bangTheoDoi');
  let loc = '';
  let tuKhoa = '';

  const cacLoc = [
    ['', 'Tất cả'],
    ['sach', 'Chưa có sách'],
    ['dongphuc', 'Chưa nhận đ/phục'],
    ['laodong', 'Vắng lao động'],
    ['hoancanh', 'Hoàn cảnh khó khăn'],
  ];

  function hopLe(x) {
    if (loc === 'sach') return x.sgk === 'Chưa có sách';
    if (loc === 'dongphuc') return /Chưa/.test(x.dongPhuc);
    if (loc === 'laodong') return x.laoDong === 'Không đi LĐ' || x.laoDong === 'Vắng có phép';
    if (loc === 'hoancanh') return x.hoanCanh && !/^\d/.test(x.hoanCanh);
    return true;
  }

  function veLoc() {
    const box = $('#boLoc');
    box.replaceChildren();
    cacLoc.forEach(([giaTri, nhan]) => {
      const b = el('button', 'chip' + (loc === giaTri ? ' active' : ''), nhan);
      b.type = 'button';
      b.addEventListener('click', () => { loc = giaTri; veLoc(); ve(); });
      box.append(b);
    });
  }

  function ve() {
    const q = tuKhoa.trim().toLowerCase();
    const rows = ds.filter((x) => hopLe(x) && (!q || x.hoTen.toLowerCase().includes(q)));
    $('#soDong').textContent = `Đang hiện ${rows.length}/${ds.length} học sinh`;

    body.replaceChildren();
    if (!rows.length) {
      const tr = el('tr');
      tr.append(Object.assign(el('td', 'empty', 'Không có học sinh nào.'), { colSpan: 6 }));
      body.append(tr);
      return;
    }

    rows.forEach((x) => {
      const tr = el('tr');
      const tdSgk = el('td'); tdSgk.append(the(x.sgk));
      const tdDp = el('td'); tdDp.append(the(x.dongPhuc));
      if (x.sizeDongPhuc) tdDp.append(document.createTextNode(' ' + x.sizeDongPhuc));
      const tdLd = el('td'); tdLd.append(the(x.laoDong));
      const tdHc = el('td');
      if (x.hoanCanh) tdHc.append(/^\d/.test(x.hoanCanh) ? el('span', 'empty', x.hoanCanh) : el('span', 'tag warn', x.hoanCanh));

      tr.append(el('td', 'num', x.stt), el('td', null, x.hoTen), tdSgk, tdDp, tdLd, tdHc);
      body.append(tr);
    });
  }

  veLoc();
  ve();
  $('#timKiem').addEventListener('input', (e) => { tuKhoa = e.target.value; ve(); });
})();
