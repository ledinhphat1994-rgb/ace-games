/** Mốc đồng bộ video do máy chủ phát: vị trí (giây) tại thời điểm capNhatLuc (ms theo đồng hồ máy chủ). */
export interface MocVideo {
  dangPhat: boolean
  viTri: number
  tocDo: number
  capNhatLuc: number
}

export function viTriHienTai(moc: MocVideo, bayGio: number): number {
  if (!moc.dangPhat) return Math.max(0, moc.viTri)
  return Math.max(0, moc.viTri + (Math.max(0, bayGio - moc.capNhatLuc) / 1000) * moc.tocDo)
}

/** Mốc Pomodoro: số giây còn lại tại thời điểm capNhatLuc (ms theo đồng hồ máy chủ). */
export interface MocPomodoro {
  dangChay: boolean
  conLai: number
  capNhatLuc: number
}

// Như phong-focus.js: chỉ trừ số giây tròn đã trôi qua, không bao giờ âm.
export function conLaiPomodoro(moc: MocPomodoro, bayGio: number): number {
  if (!moc.dangChay) return Math.max(0, moc.conLai)
  return Math.max(0, moc.conLai - Math.floor(Math.max(0, bayGio - moc.capNhatLuc) / 1000))
}
