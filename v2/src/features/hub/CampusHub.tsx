import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRoomPresence, type TrangThaiKetNoi } from '@/hooks/useRoomPresence'
import type { NguoiDung } from '@/lib/api'

const TEN_VAI_TRO: Record<string, string> = {
  teacher: 'Giáo viên',
  student: 'Học sinh',
  admin: 'Quản trị',
  school_admin: 'Quản trị trường',
}

const NHAN_TRANG_THAI: Record<TrangThaiKetNoi, string> = {
  dang_ket_noi: 'Đang kết nối…',
  da_ket_noi: 'Đã kết nối',
  mat_ket_noi: 'Mất kết nối',
}

const MAU_TRANG_THAI: Record<TrangThaiKetNoi, string> = {
  dang_ket_noi: 'text-muted-foreground',
  da_ket_noi: 'text-emerald-400',
  mat_ket_noi: 'text-destructive',
}

function nhanVaiTro(nd: NguoiDung): string {
  if (nd.isSchoolAdmin) return 'Quản trị trường'
  if (nd.role === 'teacher' && nd.teacherPending) return 'Giáo viên (chờ duyệt)'
  return TEN_VAI_TRO[nd.role ?? ''] ?? 'Thành viên'
}

export function CampusHub({ nguoiDung, onDangXuat }: { nguoiDung: NguoiDung; onDangXuat: () => void }) {
  const { trangThai, thanhVien, doTreMs, doDoTre, ketNoiLai } = useRoomPresence('sanh-thu-nghiem')

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border">
        {/* Màn hẹp: header cao lên và xuống dòng, không ẩn thông tin người dùng. */}
        <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">Digital Campus</p>
            <p className="truncate text-xs text-muted-foreground">GDTX Định Quán · bản thử nghiệm v2</p>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-medium">{nguoiDung.ten || nguoiDung.username}</p>
              <p className="truncate text-xs text-muted-foreground">
                {nhanVaiTro(nguoiDung)}
                {nguoiDung.lop ? ` · ${nguoiDung.lop.ten}` : ''}
              </p>
            </div>
            <Button variant="outline" className="h-11" onClick={onDangXuat}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 content-start gap-4 px-4 py-6 md:grid-cols-[1fr_20rem]">
        <Card className="min-h-64">
          <CardHeader>
            <CardTitle>Phòng đang mở</CardTitle>
            <CardDescription>Học tập và Game sẽ được xây ở các phase tiếp theo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center py-10 text-center text-sm text-muted-foreground">
            Chưa có phòng nào.
          </CardContent>
        </Card>

        <Card className="min-h-64">
          <CardHeader>
            <CardTitle>Kiểm tra real-time</CardTitle>
            <CardDescription>Mở trang này ở 2 tab để thấy nhau trong phòng thử.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm">
              Trạng thái: <span className={MAU_TRANG_THAI[trangThai]}>{NHAN_TRANG_THAI[trangThai]}</span>
            </p>
            <ul className="flex min-h-20 flex-col gap-1.5" aria-live="polite">
              {thanhVien.map((tv) => (
                <li
                  key={tv.key}
                  className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    {tv.ten || tv.key}
                    {tv.key === nguoiDung.actorKey ? ' (bạn)' : ''}
                  </span>
                  {tv.soKetNoi > 1 && (
                    <span className="shrink-0 text-xs text-muted-foreground">{tv.soKetNoi} tab</span>
                  )}
                </li>
              ))}
            </ul>
            {trangThai === 'mat_ket_noi' ? (
              <Button className="h-11" onClick={ketNoiLai}>
                Kết nối lại
              </Button>
            ) : (
              <Button variant="secondary" className="h-11" onClick={doDoTre} disabled={trangThai !== 'da_ket_noi'}>
                {doTreMs === null ? 'Đo độ trễ' : `Độ trễ: ${doTreMs} ms · đo lại`}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
