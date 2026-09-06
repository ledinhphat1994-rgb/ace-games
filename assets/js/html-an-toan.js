// Lọc HTML "an toàn" cho phần định dạng cơ bản trong Hoạt động lớp (in đậm, in nghiêng, cỡ chữ,
// màu chữ, font chữ) — CHỈ cho qua một tập thẻ/khai báo CSS đã được duyệt trước, mọi thứ khác
// (script, thẻ lạ, thuộc tính lạ như onclick/href, giá trị CSS lạ) đều bị loại bỏ hoàn toàn,
// chỉ giữ lại phần CHỮ bên trong. Không dùng DOMParser vì Cloudflare Workers không có DOM — hàm
// này thuần chuỗi/regex nên chạy được cả ở đây lẫn ở trình duyệt.
//
// LƯU Ý: có một bản giống hệt ở functions/_lib/html-an-toan.js (dùng để lọc lại lần nữa ở máy
// chủ trước khi lưu — không tin hoàn toàn vào việc lọc phía trình duyệt) — sửa quy tắc gì ở đây
// thì nhớ sửa luôn bên đó cho khớp.

const THE_CHO_PHEP = new Set(['b', 'strong', 'i', 'em', 'u', 'br', 'span']);
// Chuỗi phải khớp CHÍNH XÁC với cách trình duyệt tự chuẩn hoá khi đọc lại qua .innerHTML —
// CSSOM luôn đổi dấu nháy đơn quanh tên font thành nháy kép, dù lúc gán là nháy đơn.
const FONT_CHO_PHEP = new Set([
  'inherit',
  '"Be Vietnam Pro", sans-serif',
  'Georgia, serif',
  '"Courier New", monospace',
  '"Comic Sans MS", cursive',
]);

// Thuộc tính style khi đi qua .innerHTML có thể bị mã hoá thực thể (vd dấu " quanh tên font
// thành &quot;) để giữ HTML hợp lệ — phải giải mã lại trước khi so khớp trắng, nếu không mọi giá
// trị có dấu nháy kép (như font-family "Be Vietnam Pro") sẽ luôn bị loại nhầm.
function giaiMaThucThe(s) {
  return String(s)
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function locGiaTriStyle(styleStr) {
  const ra = [];
  for (const khai of giaiMaThucThe(styleStr || '').split(';')) {
    const viTri = khai.indexOf(':');
    if (viTri < 0) continue;
    const k = khai.slice(0, viTri).trim().toLowerCase();
    const v = khai.slice(viTri + 1).trim();
    // Trình duyệt thường tự đổi màu hex (#ef4444) mình gán sang dạng rgb(...) khi đọc lại qua
    // .innerHTML (CSSOM tự chuẩn hoá) — phải chấp nhận cả hai dạng, không chỉ hex.
    if (k === 'color' && (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v) || /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(v))) ra.push(`color:${v}`);
    else if (k === 'font-size' && /^\d{1,2}px$/.test(v) && Number.parseInt(v, 10) >= 10 && Number.parseInt(v, 10) <= 40) ra.push(`font-size:${v}`);
    else if (k === 'font-family' && FONT_CHO_PHEP.has(v)) ra.push(`font-family:${v}`);
    else if (k === 'font-weight' && v === 'bold') ra.push('font-weight:bold');
    else if (k === 'font-style' && v === 'italic') ra.push('font-style:italic');
  }
  return ra.join(';');
}

export function locHtmlNoiDung(html, toiDa = 4000) {
  let s = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed)[^>]*>/gi, '');

  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (full, tagRaw, attrs) => {
    const tag = tagRaw.toLowerCase();
    if (!THE_CHO_PHEP.has(tag)) return '';
    if (tag === 'br') return '<br>';
    const dong = full.startsWith('</');
    if (dong) return `</${tag}>`;
    if (tag === 'span') {
      const m = /style\s*=\s*"([^"]*)"/i.exec(attrs) || /style\s*=\s*'([^']*)'/i.exec(attrs);
      const style = m ? locGiaTriStyle(m[1]) : '';
      // font-family hợp lệ có thể chứa dấu " (vd "Be Vietnam Pro") — phải mã hoá lại thành
      // &quot; khi chèn vào thuộc tính style="...", nếu không sẽ làm hỏng cấu trúc thẻ.
      return style ? `<span style="${style.replace(/"/g, '&quot;')}">` : '<span>';
    }
    return `<${tag}>`;
  });

  return s.trim().slice(0, toiDa);
}
