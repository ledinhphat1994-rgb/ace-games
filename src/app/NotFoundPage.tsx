import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-semibold">Không tìm thấy trang</p>
      <p className="max-w-sm text-sm text-muted-foreground">Đường dẫn này không tồn tại hoặc đã được đổi.</p>
      <Link to="/" className={buttonVariants({ className: 'h-11 px-4' })}>
        Về Campus
      </Link>
    </div>
  )
}
