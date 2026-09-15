// Luật Study Room chuyển nguyên từ bản cũ: functions/_lib/rooms.js, api/phong.js, phong-watch.js,
// phong-queue.js, phong-focus.js, phong-chat.js, phong-collab.js, api/campus-chat.js và
// docs/product/CURRENT_PRODUCT_CONTRACT.md. Dùng chung cho Worker và giao diện — máy chủ luôn quyết định.

export const SUC_CHUA = { MIN: 2, MAC_DINH: 8, MAX: 12 } as const

export const CAC_CAPABILITY = [
  'video_control',
  'video_change',
  'queue',
  'chat',
  'notes',
  'whiteboard',
  'sheet',
  'voice',
  'invite',
  'moderation',
] as const
export type Capability = (typeof CAC_CAPABILITY)[number]

export const CAC_CHE_DO_QUYEN = ['staff_only', 'selected_members', 'everyone'] as const
export type CheDoQuyen = (typeof CAC_CHE_DO_QUYEN)[number]

export interface ChinhSach {
  enabled: boolean
  accessMode: CheDoQuyen
}

// Mặc định đã khoá trong hợp đồng sản phẩm: điều khiển/đổi video/hàng đợi chỉ staff; chat, ghi chú,
// bảng vẽ, bảng tính, mời: mọi người; voice: thành viên được chọn; moderation: luôn staff.
export const CHINH_SACH_MAC_DINH: Readonly<Record<Capability, ChinhSach>> = {
  video_control: { enabled: true, accessMode: 'staff_only' },
  video_change: { enabled: true, accessMode: 'staff_only' },
  queue: { enabled: true, accessMode: 'staff_only' },
  chat: { enabled: true, accessMode: 'everyone' },
  notes: { enabled: true, accessMode: 'everyone' },
  whiteboard: { enabled: true, accessMode: 'everyone' },
  sheet: { enabled: true, accessMode: 'everyone' },
  voice: { enabled: true, accessMode: 'selected_members' },
  invite: { enabled: true, accessMode: 'everyone' },
  moderation: { enabled: true, accessMode: 'staff_only' },
}

/** Capability không bao giờ mở rộng quá staff_only và không cấp riêng cho thành viên. */
export const CAPABILITY_CHI_STAFF: readonly Capability[] = ['moderation']

/** Lease thành viên (NHIP_HIEU_LUC của bản cũ): rời phòng quá thời gian này mới mất chỗ và mất co-host. */
export const LEASE_THANH_VIEN_MS = 15 * 60 * 1000

export const SO_PHONG_MO_TOI_DA = 3
export const TEN_PHONG = { MIN: 2, MAX: 80 } as const
export const MO_TA_PHONG_TOI_DA = 300
export const MAT_KHAU_PHONG = { TOI_DA_KY_TU: 100, SAI_TOI_DA: 5, CUA_SO_MS: 10 * 60 * 1000 } as const

export const CAC_TOC_DO = [0.5, 0.75, 1, 1.25, 1.5, 2] as const
export const VI_TRI_VIDEO_TOI_DA = 86400

export const HANG_DOI_TOI_DA = 30
export const DE_XUAT_TOI_DA = 20
export const TIEU_DE_VIDEO_TOI_DA = 150

export const POMODORO_PRESET = {
  '25_5': { focus: 1500, break: 300 },
  '50_10': { focus: 3000, break: 600 },
} as const
export type PomodoroPreset = keyof typeof POMODORO_PRESET

export const CHAT_PHONG = { TOI_DA_KY_TU: 500, GIAN_CACH_MS: 3000, GUI_KEM: 100, LUU_TOI_DA: 500 } as const

export const CHAT_CAMPUS = {
  TOI_DA_KY_TU: 500,
  GIAN_CACH_MS: 2000,
  TOI_DA_MOI_PHUT: 30,
  TU_XOA_TRONG_MS: 15 * 60 * 1000,
  GUI_KEM: 50,
} as const

/** Bảng vẽ dùng hệ toạ độ logic cố định để nét vẽ khớp nhau trên mọi kích thước màn hình. */
export const BANG_VE = {
  RONG: 1600,
  CAO: 1000,
  LE: 50,
  DIEM_TOI_DA: 2000,
  OP_TOI_DA: 3000,
  OP_GIU_LAI: 2500,
  NET_MIN: 1,
  NET_MAX: 40,
} as const

/** Giới hạn mỗi kết nối WebSocket. */
export const GIOI_HAN_SOCKET = { KHUNG_TOI_DA_BYTE: 64 * 1024, LENH_TOI_DA: 30, CUA_SO_MS: 10_000 } as const

export const MON_HOC = [
  { id: 'toan', ten: 'Toán' },
  { id: 'ngu-van', ten: 'Ngữ văn' },
  { id: 'tieng-anh', ten: 'Tiếng Anh' },
  { id: 'vat-li', ten: 'Vật lí' },
  { id: 'hoa-hoc', ten: 'Hoá học' },
  { id: 'sinh-hoc', ten: 'Sinh học' },
  { id: 'lich-su', ten: 'Lịch sử' },
  { id: 'dia-li', ten: 'Địa lí' },
  { id: 'tin-hoc', ten: 'Tin học' },
  { id: 'khac', ten: 'Tự học / khác' },
] as const
export type MonHoc = (typeof MON_HOC)[number]['id']
