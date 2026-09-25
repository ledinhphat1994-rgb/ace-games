import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-5 text-center">
      <p className="text-[4.5rem] leading-none font-semibold tracking-[-0.04em] text-text-primary/15 tabular-nums">404</p>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">Không tìm thấy trang</h1>
        <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
          Đường dẫn này không tồn tại hoặc đã được đổi. Kiểm tra lại liên kết, hoặc quay về trang chính.
        </p>
      </div>
      <Link to="/" className={buttonVariants({ size: 'lg' })}>
        <ArrowLeft />
        Về Digital Campus
      </Link>
    </div>
  )
}
