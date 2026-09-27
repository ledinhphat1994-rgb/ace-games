// Digital Campus v2: Milestone R1 — Study Room Document Validation & MIME Allowlist
// worker/lib/document-validation.ts

import { UPLOAD_ERROR_CODES, type UploadErrorCode } from '../../shared/protocol/room'

export interface DocumentValidationResult {
  ok: boolean
  fileType?: 'pdf' | 'pptx' | 'image'
  errorCode?: UploadErrorCode
  error?: string
  pageCount?: number
}

// ── Upload magic-byte signatures ────────────────────────────────────────────
export const MAGIC_BYTES: Record<string, (b: Uint8Array) => boolean> = {
  pdf:  (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, // %PDF
  png:  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
               b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  jpg:  (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
               b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  // PPTX / DOCX / XLSX: ZIP-based OOXML (cấu trúc bên trong kiểm tra thêm bằng kiemTraGoiOoxml)
  pptx: (b) => b[0] === 0x50 && b[1] === 0x4b, // PK
  docx: (b) => b[0] === 0x50 && b[1] === 0x4b, // PK
  xlsx: (b) => b[0] === 0x50 && b[1] === 0x4b, // PK
  // DOC / XLS: chỉ kiểm tra vỏ OLE Compound File, không đọc luồng bên trong
  doc:  (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0, // OLE
  xls:  (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0, // OLE
}

// fileType 'pptx' = nhóm "tài liệu Office xem qua Office Online" (cột phong_tai_lieu.file_type chỉ nhận pdf/pptx/image),
// nên Word/Excel cũng mang fileType 'pptx'.
export const ALLOWED_DOCUMENT_RULES: Record<
  string,
  { maxBytes: number; folder: string; allowedMimes: string[]; fileType: 'pdf' | 'pptx' | 'image' }
> = {
  pdf: {
    maxBytes: 30 * 1024 * 1024, // 30 MB
    folder: 'slides',
    allowedMimes: [
      'application/pdf',
      'application/x-pdf',
      'application/acrobat',
      'applications/vnd.pdf',
      'text/pdf',
      'text/x-pdf',
      'application/octet-stream',
    ],
    fileType: 'pdf',
  },
  pptx: {
    maxBytes: 30 * 1024 * 1024, // 30 MB
    folder: 'slides',
    allowedMimes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/x-zip-compressed',
      'application/zip',
      'application/vnd.ms-powerpoint',
      'application/octet-stream',
    ],
    fileType: 'pptx',
  },
  docx: {
    maxBytes: 30 * 1024 * 1024,
    folder: 'slides',
    allowedMimes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/octet-stream',
      'application/zip',
    ],
    fileType: 'pptx',
  },
  doc: {
    maxBytes: 30 * 1024 * 1024,
    folder: 'slides',
    allowedMimes: ['application/msword', 'application/octet-stream'],
    fileType: 'pptx',
  },
  xlsx: {
    maxBytes: 30 * 1024 * 1024,
    folder: 'slides',
    allowedMimes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
      'application/zip',
    ],
    fileType: 'pptx',
  },
  xls: {
    maxBytes: 30 * 1024 * 1024,
    folder: 'slides',
    allowedMimes: ['application/vnd.ms-excel', 'application/octet-stream'],
    fileType: 'pptx',
  },
  png: {
    maxBytes: 10 * 1024 * 1024, // 10 MB
    folder: 'images',
    allowedMimes: ['image/png', 'application/octet-stream'],
    fileType: 'image',
  },
  jpg: {
    maxBytes: 10 * 1024 * 1024,
    folder: 'images',
    allowedMimes: ['image/jpeg', 'image/pjpeg', 'application/octet-stream'],
    fileType: 'image',
  },
  jpeg: {
    maxBytes: 10 * 1024 * 1024,
    folder: 'images',
    allowedMimes: ['image/jpeg', 'image/pjpeg', 'application/octet-stream'],
    fileType: 'image',
  },
  webp: {
    maxBytes: 10 * 1024 * 1024,
    folder: 'images',
    allowedMimes: ['image/webp', 'application/octet-stream'],
    fileType: 'image',
  },
}

/** Phần chính mà mỗi loại gói OOXML bắt buộc phải có, cùng kiểu nội dung khai báo trong [Content_Types].xml. */
const OOXML_PHAN_CHINH = {
  pptx: {
    ten: 'PowerPoint',
    part: 'ppt/presentation.xml',
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml',
    thieuPart: 'Thiếu tệp ppt/presentation.xml (không phải bản trình chiếu PowerPoint).',
  },
  docx: {
    ten: 'Word',
    part: 'word/document.xml',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
    thieuPart: 'Thiếu tệp word/document.xml (không phải văn bản Word).',
  },
  xlsx: {
    ten: 'Excel',
    part: 'xl/workbook.xml',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
    thieuPart: 'Thiếu tệp xl/workbook.xml (không phải bảng tính Excel).',
  },
} as const

export type LoaiOoxml = keyof typeof OOXML_PHAN_CHINH

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

/**
 * PPTX ZIP Inspection:
 * Validates that an uploaded archive is a genuine PowerPoint (.pptx) OOXML package.
 */
export function validatePptx(fileBytes: Uint8Array): Promise<{ ok: boolean; reason?: string }> {
  return kiemTraGoiOoxml(fileBytes, 'pptx')
}

/**
 * OOXML ZIP Inspection (pptx / docx / xlsx): gói phải có [Content_Types].xml, có phần chính của đúng loại, và
 * [Content_Types].xml khai báo đúng kiểu nội dung chính cho phần đó — đổi đuôi một tệp ZIP bất kỳ không qua được.
 */
export async function kiemTraGoiOoxml(fileBytes: Uint8Array, loai: LoaiOoxml): Promise<{ ok: boolean; reason?: string }> {
  const phanChinh = OOXML_PHAN_CHINH[loai]
  const MAX_EOCD_SCAN = 65536
  const MAX_ENTRIES = 500
  const MAX_TOTAL_UNCOMPRESSED = 100 * 1024 * 1024 // 100 MiB
  const MAX_CONTENT_TYPES_BYTES = 1024 * 1024       // 1 MiB

  if (fileBytes.length < 22) return { ok: false, reason: 'Tệp quá nhỏ.' }

  // 1. Find EOCD signature (PK\x05\x06) scanning backwards from end
  const scanStart = Math.max(0, fileBytes.length - MAX_EOCD_SCAN)
  let eocdOffset = -1
  for (let i = fileBytes.length - 22; i >= scanStart; i--) {
    if (
      fileBytes[i] === 0x50 &&
      fileBytes[i + 1] === 0x4b &&
      fileBytes[i + 2] === 0x05 &&
      fileBytes[i + 3] === 0x06
    ) {
      eocdOffset = i
      break
    }
  }
  if (eocdOffset === -1) return { ok: false, reason: 'Không tìm thấy cấu trúc ZIP (End of Central Directory).' }

  const view = new DataView(fileBytes.buffer, fileBytes.byteOffset, fileBytes.byteLength)
  const totalEntries = view.getUint16(eocdOffset + 10, true)
  const cdSize = view.getUint32(eocdOffset + 12, true)
  const cdOffset = view.getUint32(eocdOffset + 16, true)

  if (totalEntries > MAX_ENTRIES) return { ok: false, reason: `Số lượng mục trong tệp ZIP vượt quá giới hạn (${totalEntries} > ${MAX_ENTRIES}).` }
  if (cdOffset + cdSize > fileBytes.length) return { ok: false, reason: 'Cấu trúc Central Directory bị hỏng.' }

  // 2. Walk Central Directory
  let ptr = cdOffset
  let totalUncompressed = 0
  let hasContentTypes = false
  let hasMainPart = false
  let contentTypesLocalHeaderOffset = -1
  let contentTypesCompressedSize = 0
  let contentTypesCompressionMethod = 0

  for (let i = 0; i < totalEntries; i++) {
    if (ptr + 46 > fileBytes.length) return { ok: false, reason: 'Central Directory bị cắt cụt.' }
    const sig = view.getUint32(ptr, true)
    if (sig !== 0x02014b50) return { ok: false, reason: 'Chữ ký Central Directory không hợp lệ.' }

    const compressionMethod = view.getUint16(ptr + 10, true)
    const compressedSize = view.getUint32(ptr + 20, true)
    const uncompressedSize = view.getUint32(ptr + 24, true)
    const nameLen = view.getUint16(ptr + 28, true)
    const extraLen = view.getUint16(ptr + 30, true)
    const commentLen = view.getUint16(ptr + 32, true)
    const localHeaderOffset = view.getUint32(ptr + 42, true)

    totalUncompressed += uncompressedSize
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
      return { ok: false, reason: 'Tổng dung lượng giải nén vượt quá 100 MiB (cảnh báo tệp nén độc hại).' }
    }

    const nameBytes = fileBytes.subarray(ptr + 46, ptr + 46 + nameLen)
    const name = new TextDecoder('utf-8').decode(nameBytes)

    if (name === '[Content_Types].xml') {
      hasContentTypes = true
      contentTypesLocalHeaderOffset = localHeaderOffset
      contentTypesCompressedSize = compressedSize
      contentTypesCompressionMethod = compressionMethod
    } else if (name === phanChinh.part) {
      hasMainPart = true
    }

    ptr += 46 + nameLen + extraLen + commentLen
  }

  if (!hasContentTypes) return { ok: false, reason: `Thiếu tệp [Content_Types].xml trong gói ${loai.toUpperCase()}.` }
  if (!hasMainPart) return { ok: false, reason: phanChinh.thieuPart }

  // 3. Decompress [Content_Types].xml
  if (contentTypesLocalHeaderOffset + 30 > fileBytes.length) return { ok: false, reason: 'Offset của [Content_Types].xml không hợp lệ.' }
  const localSig = view.getUint32(contentTypesLocalHeaderOffset, true)
  if (localSig !== 0x04034b50) return { ok: false, reason: 'Chữ ký Local File Header của [Content_Types].xml không hợp lệ.' }

  const localNameLen = view.getUint16(contentTypesLocalHeaderOffset + 26, true)
  const localExtraLen = view.getUint16(contentTypesLocalHeaderOffset + 28, true)
  const dataStart = contentTypesLocalHeaderOffset + 30 + localNameLen + localExtraLen
  const dataEnd = dataStart + contentTypesCompressedSize

  if (dataEnd > fileBytes.length) return { ok: false, reason: 'Dữ liệu nén của [Content_Types].xml bị cắt cụt.' }
  const compressedData = fileBytes.subarray(dataStart, dataEnd)

  let xmlBytes: Uint8Array
  if (contentTypesCompressionMethod === 0) {
    xmlBytes = compressedData
  } else if (contentTypesCompressionMethod === 8) {
    try {
      const ds = new DecompressionStream('deflate-raw')
      const writer = ds.writable.getWriter()
      const reader = ds.readable.getReader()
      void writer.write(new Uint8Array(compressedData))
      void writer.close()

      const chunks: Uint8Array[] = []
      let total = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.length
        if (total > MAX_CONTENT_TYPES_BYTES) {
          return { ok: false, reason: '[Content_Types].xml quá lớn (> 1 MiB).' }
        }
        chunks.push(value)
      }
      xmlBytes = new Uint8Array(total)
      let offset = 0
      for (const chunk of chunks) {
        xmlBytes.set(chunk, offset)
        offset += chunk.length
      }
    } catch {
      return { ok: false, reason: 'Không thể giải nén [Content_Types].xml.' }
    }
  } else {
    return { ok: false, reason: `Phương thức nén không được hỗ trợ (${contentTypesCompressionMethod}).` }
  }

  // 4. Verify ContentType in [Content_Types].xml
  const xmlText = new TextDecoder('utf-8').decode(xmlBytes)
  const partName = escapeRegex(`/${phanChinh.part}`)
  const contentType = escapeRegex(phanChinh.contentType)
  const mainContentTypePattern = new RegExp(
    `<Override\\b[^>]*(?:PartName=["']${partName}["'][^>]*ContentType=["']${contentType}["']|ContentType=["']${contentType}["'][^>]*PartName=["']${partName}["'])[^>]*\\/?>`,
    'i',
  )
  if (!mainContentTypePattern.test(xmlText)) {
    return {
      ok: false,
      reason: `[Content_Types].xml không khai báo kiểu nội dung ${phanChinh.ten} chính thức (${phanChinh.contentType}) cho /${phanChinh.part}.`,
    }
  }

  return { ok: true }
}

/**
 * Validates an uploaded document file.
 */
export async function validateDocumentUpload(
  filename: string,
  declaredMime: string,
  fileBytes: Uint8Array,
): Promise<DocumentValidationResult> {
  if (!fileBytes || fileBytes.length === 0) {
    return {
      ok: false,
      errorCode: UPLOAD_ERROR_CODES.EMPTY_FILE,
      error: 'Tệp tải lên rỗng hoặc không có dữ liệu.',
    }
  }

  const rawExt = filename.includes('.') ? filename.toLowerCase().split('.').pop() || '' : ''

  // Explicit rejection of legacy binary PPT with informative guidance
  if (rawExt === 'ppt') {
    return {
      ok: false,
      errorCode: UPLOAD_ERROR_CODES.UNSUPPORTED_TYPE,
      error: 'Định dạng .ppt cũ không được hỗ trợ hiển thị trực tiếp. Vui lòng xuất hoặc lưu tệp thành .pdf hoặc .pptx để trình chiếu.',
    }
  }

  const rule = ALLOWED_DOCUMENT_RULES[rawExt]
  if (!rule) {
    return {
      ok: false,
      errorCode: UPLOAD_ERROR_CODES.UNSUPPORTED_TYPE,
      error: `Định dạng tệp ".${rawExt}" không được hỗ trợ. Hệ thống hỗ trợ .pdf, .pptx, Word (.docx/.doc), Excel (.xlsx/.xls) và ảnh.`,
    }
  }

  if (fileBytes.length > rule.maxBytes) {
    const maxMb = Math.round(rule.maxBytes / (1024 * 1024))
    return {
      ok: false,
      errorCode: UPLOAD_ERROR_CODES.FILE_TOO_LARGE,
      error: `Dung lượng tệp (${(fileBytes.length / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn tối đa ${maxMb}MB.`,
    }
  }

  // Check declared MIME against allowlist (if provided)
  if (declaredMime && !rule.allowedMimes.includes(declaredMime.toLowerCase())) {
    return {
      ok: false,
      errorCode: UPLOAD_ERROR_CODES.UNSUPPORTED_TYPE,
      error: `Kiểu tệp (MIME type: ${declaredMime}) không khớp với định dạng .${rawExt}.`,
    }
  }

  // Magic bytes check
  const magicChecker = MAGIC_BYTES[rawExt]
  if (magicChecker && !magicChecker(fileBytes)) {
    return {
      ok: false,
      errorCode: UPLOAD_ERROR_CODES.UNSUPPORTED_TYPE,
      error: 'Nội dung tệp không khớp với chữ ký định dạng khai báo.',
    }
  }

  // OOXML deep inspection (pptx / docx / xlsx)
  if (rawExt === 'pptx' || rawExt === 'docx' || rawExt === 'xlsx') {
    const ooxmlCheck = await kiemTraGoiOoxml(fileBytes, rawExt)
    if (!ooxmlCheck.ok) {
      return {
        ok: false,
        errorCode: UPLOAD_ERROR_CODES.UNSUPPORTED_TYPE,
        error: `Tệp ${rawExt.toUpperCase()} không hợp lệ: ${ooxmlCheck.reason}`,
      }
    }
  }

  // Lightweight page count estimate for PDF if possible
  let pageCount = 1
  if (rule.fileType === 'pdf') {
    try {
      const text = new TextDecoder('latin1').decode(fileBytes.subarray(0, Math.min(fileBytes.length, 200000)))
      const m = text.match(/\/Count\s+(\d+)/)
      if (m) pageCount = Math.max(1, parseInt(m[1], 10))
    } catch {}
  }

  return {
    ok: true,
    fileType: rule.fileType,
    pageCount,
  }
}
