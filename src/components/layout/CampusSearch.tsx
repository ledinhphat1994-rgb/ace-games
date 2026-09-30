import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, BookOpen, Gamepad2, Users, Loader2 } from 'lucide-react'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { GAME_CATALOG } from '@/features/games/game-catalog'
import { filterLobbyRooms } from '@/features/hub/learning-semantics'
import { timKiemNguoiDung } from '@/lib/api'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
export function CampusSearch() {
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''), [debounced, setDebounced] = useState('')
  const [person, setPerson] = useState<NguoiXem | null>(null)
  const { rooms, campusSnapshotReady } = useCampus(); const { nguoiDung, moAuthModal } = usePhien(); const navigate = useNavigate()
  useEffect(() => { const timer = setTimeout(() => setDebounced(query.trim()), 250); return () => clearTimeout(timer) }, [query])
  useEffect(() => { const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(value => !value) } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key) }, [])
  const people = useQuery({ queryKey: ['campus-search', debounced], queryFn: () => timKiemNguoiDung(debounced), enabled: open && Boolean(nguoiDung) && debounced.length >= 2, staleTime: 15000 })
  const games = GAME_CATALOG.filter(game => (game.shortTitle + ' ' + game.title).toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))
  const foundRooms = campusSnapshotReady ? filterLobbyRooms(rooms, query).slice(0, 6) : []
  const go = (url: string) => { setOpen(false); navigate(url) }
  return <><Button variant="ghost" size="icon-lg" aria-label="Tìm kiếm" title="Tìm kiếm · Ctrl K" onClick={() => setOpen(true)} data-testid="campus-search-trigger"><Search className="size-4.5" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Tìm kiếm</DialogTitle><DialogDescription>Phòng học, trò chơi và bạn học.</DialogDescription></DialogHeader><label htmlFor="campus-search-input" className="sr-only">Từ khóa tìm kiếm</label><Input id="campus-search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Bạn muốn tìm gì?" className="h-12" />
      <div className="max-h-[55dvh] space-y-5 overflow-y-auto overscroll-contain">
        <section><h2 className="mb-2 text-xs font-semibold text-text-secondary">Trò chơi</h2>{games.map(game => <button type="button" key={game.id} onClick={() => go('/arena/' + game.id)} className="search-result"><Gamepad2 className="size-4 text-brand" /><span>{game.shortTitle}</span></button>)}{games.length === 0 && <p className="text-sm text-text-secondary">Không tìm thấy trò chơi.</p>}</section>
        <section><h2 className="mb-2 text-xs font-semibold text-text-secondary">Phòng học</h2>{!nguoiDung ? <Button variant="outline" onClick={() => { setOpen(false); moAuthModal('dang_nhap') }}>Đăng nhập để tìm phòng</Button> : !campusSnapshotReady ? <p className="text-sm text-text-secondary">Đang đồng bộ phòng học…</p> : foundRooms.length === 0 ? <p className="text-sm text-text-secondary">Không có phòng phù hợp.</p> : foundRooms.map(room => <button type="button" key={room.id} className="search-result" onClick={() => go(room.coMatKhau ? '/learn?q=' + encodeURIComponent(room.ten) : '/room/phong-' + room.id)}><BookOpen className="size-4 text-brand" /><span className="min-w-0 break-words">{room.ten}</span></button>)}</section>
        {nguoiDung && debounced.length >= 2 && <section><h2 className="mb-2 text-xs font-semibold text-text-secondary">Bạn học</h2>{people.isPending ? <Loader2 className="size-4 animate-spin" aria-label="Đang tìm bạn học" /> : people.isError ? <Button variant="outline" onClick={() => void people.refetch()}>Thử tìm lại bạn học</Button> : people.data?.length ? people.data.slice(0, 6).map(user => <button type="button" key={user.id} className="search-result" onClick={e => { setPerson({ id: user.id, ten: user.displayName, avatar: user.avatar, vaiTro: user.role, lopTen: user.lopTen, anchorRect: e.currentTarget.getBoundingClientRect() }); setOpen(false) }}><Users className="size-4 text-social" /><span className="min-w-0 break-words">{user.displayName}</span></button>) : <p className="text-sm text-text-secondary">Không tìm thấy bạn học.</p>}</section>}
      </div></DialogContent></Dialog><HoSoNguoiDungDialog nguoi={person} onDong={() => setPerson(null)} /></>
}
