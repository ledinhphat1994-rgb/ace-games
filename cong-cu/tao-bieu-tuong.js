// Tạo biểu tượng PNG cho ứng dụng (dùng khi cài lên màn hình chính điện thoại).
// Vẽ bằng phép tính thuần, không cần thư viện ngoài.
// Chạy:  node cong-cu/tao-bieu-tuong.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const THU_MUC = path.join(path.dirname(__dirname), 'assets', 'img');

/* ---------- Bộ mã hoá PNG tối giản ---------- */
function chunk(loai, duLieu) {
  const daiPhan = Buffer.alloc(4);
  daiPhan.writeUInt32BE(duLieu.length);
  const than = Buffer.concat([Buffer.from(loai, 'ascii'), duLieu]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(tinhCrc(than) >>> 0);
  return Buffer.concat([daiPhan, than, crc]);
}

const BANG_CRC = (() => {
  const b = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    b[n] = c >>> 0;
  }
  return b;
})();

function tinhCrc(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = BANG_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function taoPng(rong, cao, layMau) {
  const hang = [];
  for (let y = 0; y < cao; y++) {
    const dong = Buffer.alloc(1 + rong * 4);   // 1 byte bộ lọc + RGBA
    for (let x = 0; x < rong; x++) {
      const [r, g, b, a] = layMau(x, y);
      dong[1 + x * 4] = r; dong[2 + x * 4] = g; dong[3 + x * 4] = b; dong[4 + x * 4] = a;
    }
    hang.push(dong);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(rong, 0);
  ihdr.writeUInt32BE(cao, 4);
  ihdr[8] = 8;    // 8 bit mỗi kênh
  ihdr[9] = 6;    // màu RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(hang), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- Hình học ---------- */
const trongDaGiac = (x, y, dinh) => {
  let trong = false;
  for (let i = 0, j = dinh.length - 1; i < dinh.length; j = i++) {
    const [xi, yi] = dinh[i];
    const [xj, yj] = dinh[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) trong = !trong;
  }
  return trong;
};

/** Biểu tượng: nền xanh bo góc, chiếc mũ tốt nghiệp trắng ở giữa. */
function veBieuTuong(canh, vien) {
  const r = canh * 0.22;                    // bán kính bo góc
  const m = vien ? canh * 0.14 : 0;          // lề an toàn cho biểu tượng dạng "maskable"
  const tam = canh / 2;

  return (x, y) => {
    // Bo góc
    const dx = Math.max(m - x, 0, x - (canh - m));
    const dy = Math.max(m - y, 0, y - (canh - m));
    const trongKhung = x >= m && x <= canh - m && y >= m && y <= canh - m;
    if (!trongKhung) return [0, 0, 0, 0];

    const gx = Math.min(x - m, canh - m - x);
    const gy = Math.min(y - m, canh - m - y);
    if (gx < r && gy < r && Math.hypot(r - gx, r - gy) > r) return [0, 0, 0, 0];

    // Nền chuyển màu chéo từ xanh đậm sang xanh sáng
    const t = (x + y) / (2 * canh);
    const nen = [
      Math.round(13 + (42 - 13) * t),
      Math.round(63 + (124 - 63) * t),
      Math.round(112 + (199 - 112) * t),
      255,
    ];

    // Mũ tốt nghiệp: phần mái hình thoi
    const s = canh * (vien ? 0.30 : 0.34);
    const cy = tam - canh * 0.05;
    const mai = [
      [tam, cy - s * 0.55],
      [tam + s, cy],
      [tam, cy + s * 0.55],
      [tam - s, cy],
    ];
    if (trongDaGiac(x, y, mai)) return [255, 255, 255, 255];

    // Phần thân mũ phía dưới
    const than = [
      [tam - s * 0.52, cy + s * 0.30],
      [tam + s * 0.52, cy + s * 0.30],
      [tam + s * 0.52, cy + s * 0.95],
      [tam - s * 0.52, cy + s * 0.95],
    ];
    if (trongDaGiac(x, y, than)) return [255, 255, 255, 255];

    // Dây tua bên phải
    const dayX = tam + s * 0.86;
    if (Math.abs(x - dayX) < canh * 0.018 && y > cy && y < cy + s * 0.95) return [255, 255, 255, 255];
    if (Math.hypot(x - dayX, y - (cy + s * 1.02)) < canh * 0.045) return [255, 255, 255, 255];

    return nen;
  };
}

fs.mkdirSync(THU_MUC, { recursive: true });
[[192, false], [512, false], [512, true]].forEach(([canh, vien]) => {
  const ten = vien ? `bieu-tuong-${canh}-vien.png` : `bieu-tuong-${canh}.png`;
  fs.writeFileSync(path.join(THU_MUC, ten), taoPng(canh, canh, veBieuTuong(canh, vien)));
  console.log('  ->', 'assets/img/' + ten);
});
console.log('Đã tạo biểu tượng ứng dụng.');
