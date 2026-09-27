import type { CSSProperties } from 'react'

// Bàn chơi luôn vừa khung nhìn: không rộng quá mức tối đa và không cao hơn phần còn lại của màn hình
// (trừ thanh đầu trang, thẻ người chơi, vùng trạng thái ván và hàng hành động).

/** Bàn đối kháng 1v1 (Caro, Connect 4, Reversi). */
export const KICH_THUOC_BAN: CSSProperties = { width: 'min(100%, 480px, calc(100svh - 20rem))' }

/** Khu chơi của trò chơi đơn (2048, Trí nhớ, Rắn săn mồi). */
export const KICH_THUOC_BAN_DON: CSSProperties = { width: 'min(100%, 460px, calc(100svh - 18rem))' }
