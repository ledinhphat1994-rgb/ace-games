# -*- coding: utf-8 -*-
"""
Đọc file Excel tổng hợp của lớp 10A7 và sinh ra hai tệp dữ liệu cho trang web:

  data/hoc-sinh.json            -> CẢ LỚP xem được: STT, họ tên, giới tính, ngày sinh, lớp nghề, tổ hợp
  giao-vien/data/theo-doi.json  -> CHỈ GIÁO VIÊN xem được: sách giáo khoa, đồng phục, lao động,
                                   kèm ghi chú hoàn cảnh (hộ cận nghèo, gia đình khó khăn...)

Chạy:  python cong-cu/tao-du-lieu-tu-excel.py
"""
import json
import os
import re
import sys
import unicodedata

import openpyxl

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCEL = os.path.join(
    os.path.dirname(GOC), "tài liệu giấy tờ", "Tong_Hop_Phan_Loai_Lop_10A7.xlsx"
)


def khoa(ten):
    """Rút gọn tên thành khoá so khớp: bỏ dấu, bỏ ký tự lạ, viết thường.
    Dùng để nối dữ liệu giữa các sheet khi tên viết hơi khác nhau."""
    s = unicodedata.normalize("NFD", str(ten or ""))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("đ", "d").replace("Đ", "D")
    return re.sub(r"[^a-z]", "", s.lower())


# Cột "Ghi chú gốc" trong Excel trộn nhiều thứ: hoàn cảnh gia đình, ký hiệu sách,
# và ngày nhập học. Chỉ giữ lại phần thực sự là hoàn cảnh.
KY_HIEU_SACH = {"đsách", "cđsách", "-", ""}


def loc_hoan_canh(gia_tri):
    v = str(gia_tri or "").strip()
    if v.lower() in KY_HIEU_SACH:
        return ""
    if re.fullmatch(r"\d{1,2}/\d{1,2}/\d{4}", v):   # ngày nhập học, không phải hoàn cảnh
        return ""
    return v


def doc_sheet(ws, cot):
    """Đọc các dòng dữ liệu thật của một sheet, bỏ tiêu đề và dòng cộng."""
    ket_qua = []
    for row in ws.iter_rows(values_only=True):
        o = ["" if c is None else str(c).strip() for c in row]
        if not any(o):
            continue
        if not re.fullmatch(r"\d+", o[0]):      # cột đầu phải là số thứ tự
            continue
        if len(o) < 3 or not o[1]:
            continue
        ket_qua.append({ten: (o[i] if i < len(o) else "") for ten, i in cot.items()})
    return ket_qua


def main():
    if not os.path.exists(EXCEL):
        sys.exit(f"Không tìm thấy file Excel:\n  {EXCEL}")

    wb = openpyxl.load_workbook(EXCEL, data_only=True)
    s_dp = wb["Phân Loại Đồng Phục"]
    s_ld = wb["Phân Loại Điểm Danh Lao Động"]
    s_sgk = wb["Phân Loại Sách Giáo Khoa"]

    # Sheet sách giáo khoa đầy đủ nhất (đủ 37 em, có tổ hợp) -> dùng làm danh sách gốc.
    goc = doc_sheet(s_sgk, {
        "stt": 0, "hoTen": 1, "gioiTinh": 2, "ngaySinh": 3,
        "lopNghe": 4, "toHop": 5, "sgk": 6, "hoanCanh": 7,
    })
    lao_dong = doc_sheet(s_ld, {
        "stt": 0, "hoTen": 1, "gioiTinh": 2, "ngaySinh": 3,
        "lopNghe": 4, "trangThai": 5, "ghiChu": 6,
    })
    dong_phuc = doc_sheet(s_dp, {
        "stt": 0, "hoTen": 1, "gioiTinh": 2, "size": 3,
        "soLuong": 4, "trangThai": 5, "ghiChu": 6,
    })

    ld_theo_ten = {khoa(r["hoTen"]): r for r in lao_dong}
    dp_theo_ten = {khoa(r["hoTen"]): r for r in dong_phuc}

    hoc_sinh, theo_doi, khong_khop = [], [], []

    for r in sorted(goc, key=lambda x: int(x["stt"])):
        k = khoa(r["hoTen"])
        ld = ld_theo_ten.get(k)
        dp = dp_theo_ten.get(k)
        if ld is None or dp is None:
            khong_khop.append(r["hoTen"])

        # --- Cả lớp xem được: không có gì nhạy cảm ---
        hoc_sinh.append({
            "stt": int(r["stt"]),
            "hoTen": r["hoTen"],
            "gioiTinh": r["gioiTinh"],
            "ngaySinh": r["ngaySinh"],
            "lopNghe": r["lopNghe"],
            "toHop": r["toHop"],
            "chucVu": "",
            "ghiChu": "",
        })

        # --- Chỉ giáo viên xem được ---
        theo_doi.append({
            "stt": int(r["stt"]),
            "hoTen": r["hoTen"],
            "sgk": r["sgk"],
            "hoanCanh": loc_hoan_canh(r["hoanCanh"]),
            "dongPhuc": dp["trangThai"] if dp else "Chưa rõ",
            "sizeDongPhuc": dp["size"] if dp else "",
            "laoDong": ld["trangThai"] if ld else "Chưa rõ",
        })

    ghi(os.path.join(GOC, "du-lieu-goc", "hoc-sinh.json"), hoc_sinh)
    ghi(os.path.join(GOC, "du-lieu-goc", "theo-doi.json"), {
        "capNhat": "03/09/2026",
        "nguon": "Tong_Hop_Phan_Loai_Lop_10A7.xlsx",
        "canhBao": "Dữ liệu nhạy cảm — chỉ giáo viên chủ nhiệm xem. Không chiếu lên máy chiếu trước lớp.",
        "danhSach": theo_doi,
    })

    print(f"Đã tạo danh sách {len(hoc_sinh)} học sinh.")
    if khong_khop:
        print("\nCẢNH BÁO — những tên sau viết KHÁC NHAU giữa các sheet, cần thầy/cô xác nhận:")
        for t in khong_khop:
            print("  -", t)


def ghi(duong_dan, du_lieu):
    os.makedirs(os.path.dirname(duong_dan), exist_ok=True)
    with open(duong_dan, "w", encoding="utf-8") as f:
        json.dump(du_lieu, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("  ->", os.path.relpath(duong_dan, GOC))


if __name__ == "__main__":
    main()
