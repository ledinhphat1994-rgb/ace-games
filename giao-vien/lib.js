import { $ } from '/assets/js/chung.js';
export const KHUNG = $('#noiDung');
export function gioNgayVN(value) {
  if (!value) return '—';
  const d = new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : value.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}