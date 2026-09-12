// Script tạo SQL nhập danh sách 30 học sinh Lớp 11A1 (Phân hiệu 2)
const fs = require('fs');

const CHU_CAI = 'ABCDEFGHJKMNPQRTUVWXY346789';
function sinhMa(daCo) {
  let ma = '';
  do {
    ma = '';
    for (let i = 0; i < 6; i++) {
      ma += CHU_CAI[Math.floor(Math.random() * CHU_CAI.length)];
    }
  } while (daCo.has(ma));
  daCo.add(ma);
  return ma;
}

const existingCodes = new Set([
  '10A7-DinhQuan-HOQ7G', '123456', '3N7GT9', '44YKP9', '654321', '6JEQFG', '7BQ8AF',
  'AHMTPX', 'AU38F3', 'AVV7TA', 'AWKBHB', 'B8QH9Q', 'BRFM6F', 'C878E3', 'CCAWCK',
  'CN8BPF', 'DQBBYK', 'DRWHDA', 'EPJYHA', 'EUGRGR', 'FX3DJP', 'G8GUUU', 'GJDGME',
  'GV-DUMMY-SAMPLE', 'JBMFX8', 'MCBVBU', 'MGFR73', 'NGCAQT', 'NYMTFX', 'PBV6VV',
  'Pregnanthi1!', 'Pregnanthi2@', 'QFJCY9', 'QTXTHY', 'RHEJKH', 'RP6T47', 'TBWCFD',
  'UET8EU', 'V9FFR9', 'XE76DU', 'Y4QBEP', 'Y68KYU', 'YMDWPP', 'YRBC9X', 'hs123456', 'hs654321'
]);

const rawStudents = [
  { stt: 1, hoTen: 'Nguyễn Trâm Anh', ngaySinh: '2010-09-28', sdt: '0366498385', gioiTinh: 'Nữ' },
  { stt: 2, hoTen: 'Phu Quốc Anh', ngaySinh: '2010-03-31', sdt: '0378715878', gioiTinh: 'Nam' },
  { stt: 3, hoTen: 'Nông Thiên Ân', ngaySinh: '2010-11-09', sdt: '0377456329', gioiTinh: 'Nam' },
  { stt: 4, hoTen: "K' Bình", ngaySinh: '2009-08-15', sdt: '0367634998', gioiTinh: 'Nam' },
  { stt: 5, hoTen: 'Tài Lê Bình', ngaySinh: '2010-04-23', sdt: '0973366532', gioiTinh: 'Nam' },
  { stt: 6, hoTen: 'Lý Mỹ Đình', ngaySinh: '2010-04-07', sdt: '0367731746', gioiTinh: 'Nữ' },
  { stt: 7, hoTen: 'Mai Thanh Hằng', ngaySinh: '2010-04-05', sdt: '0868745152', gioiTinh: 'Nữ' },
  { stt: 8, hoTen: 'Chiều Minh Hiếu', ngaySinh: '2010-06-06', sdt: '0919546950', gioiTinh: 'Nam' },
  { stt: 9, hoTen: 'Huỳnh Thị Ngọc Huyền', ngaySinh: '2009-07-27', sdt: '0399264038', gioiTinh: 'Nữ' },
  { stt: 10, hoTen: 'Gịp Gia Khang', ngaySinh: '2009-12-26', sdt: '0931457268', gioiTinh: 'Nam' },
  { stt: 11, hoTen: 'Lã Thị Tường Lam', ngaySinh: '2010-07-31', sdt: '0981130728', gioiTinh: 'Nữ' },
  { stt: 12, hoTen: 'Nông Tuyết Mai', ngaySinh: '2010-06-16', sdt: '0984317933', gioiTinh: 'Nữ' },
  { stt: 13, hoTen: 'Vày Ngọc Minh', ngaySinh: '2009-12-28', sdt: '0989723924', gioiTinh: 'Nam' },
  { stt: 14, hoTen: 'Nguyễn Thị Bích Ngân', ngaySinh: '2010-03-20', sdt: '0348248728', gioiTinh: 'Nữ' },
  { stt: 15, hoTen: 'Trần Hữu Nghĩa', ngaySinh: '2010-06-05', sdt: '0937364509', gioiTinh: 'Nam' },
  { stt: 16, hoTen: 'Trần Mỹ Ngọc', ngaySinh: '2009-04-04', sdt: '0378057334', gioiTinh: 'Nữ' },
  { stt: 17, hoTen: 'Đỗ Thị Thanh Nhã', ngaySinh: '2010-03-09', sdt: '0914087172', gioiTinh: 'Nữ' },
  { stt: 18, hoTen: "K' Nhật", ngaySinh: '2010-10-20', sdt: '0364953940', gioiTinh: 'Nam' },
  { stt: 19, hoTen: 'Phạm Lâm Minh Nhật', ngaySinh: '2010-08-14', sdt: '0382763091', gioiTinh: 'Nam' },
  { stt: 20, hoTen: 'Ngô Uyển Nhi', ngaySinh: '2010-02-20', sdt: '0789994444', gioiTinh: 'Nữ' },
  { stt: 21, hoTen: 'Nguyễn Quỳnh Như', ngaySinh: '2010-05-17', sdt: '0387919926', gioiTinh: 'Nữ' },
  { stt: 22, hoTen: 'Lâm Phạm Nhật Tiên', ngaySinh: '2010-02-28', sdt: '0779315564', gioiTinh: 'Nữ' },
  { stt: 23, hoTen: 'Nguyễn Dương Bảo Trà', ngaySinh: '2010-03-16', sdt: '0368992664', gioiTinh: 'Nữ' },
  { stt: 24, hoTen: 'Lăng Khâm Ngọc Trâm', ngaySinh: '2010-03-23', sdt: '0389909598', gioiTinh: 'Nữ' },
  { stt: 25, hoTen: 'Lưu Bảo Trân', ngaySinh: '2010-12-20', sdt: '0989737237', gioiTinh: 'Nữ' },
  { stt: 26, hoTen: 'Trần Hoa Trinh', ngaySinh: '2010-04-18', sdt: '0386266686', gioiTinh: 'Nữ' },
  { stt: 27, hoTen: 'Nguyễn Trung Hiếu', ngaySinh: '2007-05-21', sdt: '', gioiTinh: 'Nam' },
  { stt: 28, hoTen: 'Nguyễn Duy Tân', ngaySinh: '2008-03-25', sdt: '', gioiTinh: 'Nam' },
  { stt: 29, hoTen: 'Nguyễn Thị Thảo Uyên', ngaySinh: '2009-02-26', sdt: '', gioiTinh: 'Nữ' },
  { stt: 30, hoTen: 'Hoàng Ngọc Bảo Long', ngaySinh: '2009-07-03', sdt: '', gioiTinh: 'Nam' },
];

let sql = `-- Nhập danh sách 30 học sinh thật của Lớp 11A1 (Phân hiệu 2)
-- Thay thế 2 học sinh thử nghiệm ban đầu (id 38, 39).

DELETE FROM ma_ca_nhan WHERE lop_id = 2;
DELETE FROM theo_doi WHERE lop_id = 2;
DELETE FROM diem_danh WHERE lop_id = 2;
DELETE FROM diem WHERE lop_id = 2;
DELETE FROM nhat_ky WHERE lop_id = 2;
DELETE FROM ren_luyen WHERE lop_id = 2;
DELETE FROM quy_dong WHERE lop_id = 2;
DELETE FROM tai_khoan_phu WHERE lop_id = 2;
DELETE FROM hoc_sinh WHERE lop_id = 2;

`;

const studentsWithCodes = [];

rawStudents.forEach((hs) => {
  const id = 37 + hs.stt; // 38..67
  const ma = sinhMa(existingCodes);
  studentsWithCodes.push({ ...hs, id, ma });

  const hoTenSql = hs.hoTen.replace(/'/g, "''");
  sql += `INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)\n`;
  sql += `  VALUES (${id}, 2, ${hs.stt}, '${hoTenSql}', '${hs.gioiTinh}', '${hs.ngaySinh}', '${hs.sdt}', '11A1-PH2', 1);\n`;
  sql += `INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)\n`;
  sql += `  VALUES (${id}, '${ma}', 2);\n\n`;
});

fs.writeFileSync('co-so-du-lieu/29-danh-sach-lop-11a1.sql', sql, 'utf8');
console.log('Đã tạo xong co-so-du-lieu/29-danh-sach-lop-11a1.sql với 30 học sinh.');
