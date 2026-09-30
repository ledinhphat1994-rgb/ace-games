// Ảnh đại diện tròn của một người: ảnh thật của tài khoản; không có / tải lỗi thì chữ cái đầu trên nền màu theo tên.

import { useState } from 'react'
import { cn, getInitials } from '@/lib/utils'

const MAU_NEN = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500']

function mauTheoTen(ten: string): string {
  let h = 0
  for (let i = 0; i < ten.length; i++) h = (h * 31 + ten.charCodeAt(i)) % 997
  return MAU_NEN[h % MAU_NEN.length]
}

interface AnhNguoiDungProps {
  ten: string
  avatar?: string | null
  /** Lớp kích thước, ví dụ `size-8 text-xs`. */
  className?: string
}

export function AnhNguoiDung({ ten, avatar, className = 'size-8 text-xs' }: AnhNguoiDungProps) {
  const [loi, setLoi] = useState(false)
  return (
    <span
      className={cn(
        'flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-text-primary select-none',
        avatar && !loi ? 'bg-surface-overlay' : mauTheoTen(ten),
        className,
      )}
    >
      {avatar && !loi ? (
        <img
          key={avatar}
          src={avatar}
          alt=""
          draggable={false}
          onError={() => setLoi(true)}
          className="size-full object-cover"
          data-testid="anh-nguoi-dung"
        />
      ) : (
        getInitials(ten)
      )}
    </span>
  )
}
