// src/features/study/docx-vietnamese-utils.ts
// Các tiện ích làm sạch bảng mã và ghép nối âm tiết tiếng Việt cho tệp Word cũ (.doc).

/**
 * Làm sạch và ghép nối các âm tiết, dấu thanh tiếng Việt bị bẻ gãy khi trích xuất từ tệp Word cũ (.doc).
 * Xử lý triệt để các trường hợp như:
 * - ĐỒ`NG NAI -> ĐỒNG NAI
 * - KẾ'T / kế ' t quả -> KẾT / kết quả
 * - sĩ số ' đề n cuố i năm ho c -> sĩ số đến cuối năm học
 * - Xuất sắ c+Giỏi -> Xuất sắc + Giỏi
 * - cấ p tỉnh THPT -> cấp tỉnh THPT
 * - 1 Nhấ t -> 1 Nhất
 */
export function cleanAndStitchVietnamese(text: string): string {
  if (!text) return ''
  // 1. Chuẩn hóa Unicode NFC (ghép các ký tự tổ hợp với nguyên âm gốc)
  let s = text.normalize('NFC')

  // 2. Loại bỏ các byte điều khiển nhị phân (trừ tab và xuống dòng)
  s = s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')

  // 3. Sửa từ "đến" bị tách/lỗi dấu trong các báo cáo giáo dục: "đề n" -> "đến", "đế n" -> "đến"
  s = s.replace(/(?<![A-Za-zÀ-ỹ])([đĐ])(ề|ế)\s+n(?![A-Za-zÀ-ỹ])/gi, (m) => (m[0] === 'Đ' ? 'Đến' : 'đến'))

  // 4. Ghép nối từ bị chèn dấu nháy / backtick giữa nguyên âm và phụ âm cuối (coda)
  // Coda tiếng Việt: c, ch, m, n, ng, nh, p, t, i, u, y, o
  // Ví dụ: ĐỒ`NG -> ĐỒNG, KẾ'T -> KẾT, tắ' t -> tắt, Xuấ' t -> Xuất, sắ' c -> sắc, cấ' p -> cấp
  s = s.replace(
    /([A-Za-zÀ-ỹ]+)\s*['`’‘´ˊˋˆˇ˜]\s*(ch|ng|nh|[cmnptiuoyo])(?![A-Za-zÀ-ỹ])/gi,
    '$1$2'
  )

  // 5. Nếu dấu nháy / backtick nằm giữa 2 chữ cái không phải là ghép âm tiết coda, thay bằng dấu cách
  // Ví dụ: sĩ số ' đề -> sĩ số đề
  s = s.replace(/([A-Za-zÀ-ỹ])\s*['`’‘´ˊˋˆˇ˜]\s*([A-Za-zÀ-ỹ])/gu, '$1 $2')

  // 6. Loại bỏ dấu nháy đơn / dấu sắc thừa ở đuôi từ đứng trước khoảng trắng hoặc dấu câu
  // Ví dụ: một số' -> một số, y tế' : -> y tế:
  s = s.replace(/([A-Za-zÀ-ỹ]+)['`’‘´ˊˋˆˇ˜]+(?=[\s:;,.\?!)]|$)/gu, '$1')

  // 7. Ghép nối các âm tiết tiếng Việt bị gãy âm đệm/phụ âm cuối do phân tách run font
  // Lưu ý: coda phải là âm tiết kết thúc, không được là chữ đầu của từ tiếp theo (dùng (?![A-Za-zÀ-ỹ]))
  // Ví dụ: Nhấ t -> Nhất, cuố i -> cuối, cấ p -> cấp, Xế p -> Xếp, sắ c -> sắc
  s = s.replace(
    /(?<![A-Za-zÀ-ỹ])([A-Za-zÀ-ỹ]*[áàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ])\s+(ch|ng|nh|[cmnptiuoyo])(?![A-Za-zÀ-ỹ])/gi,
    '$1$2'
  )

  // 8. Sửa các cặp từ đặc biệt bị lỗi bảng mã trong báo cáo giáo dục
  s = s.replace(/(?<![A-Za-zÀ-ỹ])kế['`’‘´ˊˋˆˇ˜]?\s+quả(?![A-Za-zÀ-ỹ])/gi, (m) => (m[0] === 'K' ? 'Kết quả' : 'kết quả'))
  s = s.replace(/(?<![A-Za-zÀ-ỹ])KẾ['`’‘´ˊˋˆˇ˜]?\s+QUẢ(?![A-Za-zÀ-ỹ])/g, 'KẾT QUẢ')
  s = s.replace(/(?<![A-Za-zÀ-ỹ])ho\s+c(?![A-Za-zÀ-ỹ])/gi, (m) => (m[0] === 'H' ? 'Học' : 'học'))
  s = s.replace(/(?<![A-Za-zÀ-ỹ])HO\s+C(?![A-Za-zÀ-ỹ])/g, 'HỌC')
  s = s.replace(/(?<![A-Za-zÀ-ỹ])da\s+o\s+ta\s+o(?![A-Za-zÀ-ỹ])/gi, (m) => (m[0] === 'D' ? 'Đào tạo' : 'đào tạo'))

  // 9. Tinh chỉnh khoảng cách quanh các ký hiệu số học, tỷ lệ
  s = s.replace(/(\d+)\s+%/g, '$1%')
  s = s.replace(/\s+(:|;|,)/g, '$1')
  s = s.replace(/([A-Za-zÀ-ỹ0-9])\+([A-Za-zÀ-ỹ0-9])/g, '$1 + $2')
  s = s.replace(/^(\d+\.)([A-ZÀ-Ỹa-zà-ỹ])/g, '$1 $2')

  // 10. Chuẩn hóa khoảng trắng
  s = s.replace(/[ \t]+/g, ' ').trim()

  return s
}

function joinCoherentLines(prev: string, next: string): string {
  const p = prev.trim()
  const n = next.trim()
  if (!p) return n
  if (!n) return p

  // Nếu dòng sau bắt đầu bằng dấu câu (phẩy, đóng ngoặc, hai chấm, phần trăm), gắn sát
  if (/^[,\)\]%\:]/.test(n)) {
    return `${p}${n}`
  }

  // Nếu dòng trước kết thúc bằng gạch nối từ (ví dụ "phương-", "trung-"), gắn sát
  if (p.endsWith('-') && !p.endsWith(' -')) {
    return `${p.slice(0, -1)}${n}`
  }

  return `${p} ${n}`
}

/**
 * Gom các dòng văn bản bị ngắt vụn do mã font nhị phân thành các đoạn văn mạch lạc hoàn chỉnh.
 */
export function assembleCoherentParagraphs(rawLines: string[]): string[] {
  const paragraphs: string[] = []
  let current = ''

  const isExplicitNewSection = (line: string): boolean => {
    const t = line.trim()
    if (!t) return false
    if (/^CỘNG\s*HÒA\s*XÃ\s*HỘI/i.test(t)) return true
    if (/^Độc\s*lập\s*[-–—]/i.test(t)) return true
    if (
      /^(BẢN\s+CAM\s+KẾT|BÁO\s+CÁO|ĐƠN\s+XIN|KẾ\s+HOẠCH|QUYẾT\s+ĐỊNH|BIÊN\s+BẢN|TỜ\s+TRÌNH|THÔNG\s+BÁO|NỘI\s+QUY|QUY\s+CHẾ|GIẤY\s+XÁC\s+NHẬN|GIẤY\s+ĐỀ\s+NGHỊ|HỢP\s+ĐỒNG)\b/i.test(
        t
      )
    )
      return true
    if (/^(CHƯƠNG|PHẦN|ĐIỀU|MỤC)\s+[0-9IVXLCDM]+/i.test(t)) return true
    if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/i.test(t)) return true
    if (/^\d+(\.\d+)*\.\s*[A-ZÀ-Ỹ]/.test(t)) return true
    if (/^Kính\s+gửi\s*:/i.test(t)) return true
    if (/^(\d+\.|\w\)|[-*•])\s*/.test(t)) return true
    if (
      /^(NGƯỜI\s+LÀM|HỌC\s+SINH\s+CAM|Ý\s+KIẾN|CHA\s+MẸ|GIÁO\s+VIÊN|HIỆU\s+TRƯỞNG|BAN\s+GIÁM\s+ĐỐC|XÁC\s+NHẬN)\b/i.test(
        t
      )
    )
      return true
    if (/^\(Ký/i.test(t)) return true
    return false
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim()
    if (!line) continue

    if (!current) {
      current = line
      continue
    }

    if (isExplicitNewSection(line)) {
      paragraphs.push(cleanAndStitchVietnamese(current))
      current = line
    } else {
      current = joinCoherentLines(current, line)
    }
  }

  if (current) {
    paragraphs.push(cleanAndStitchVietnamese(current))
  }

  return paragraphs.filter((p) => p.length > 0)
}
