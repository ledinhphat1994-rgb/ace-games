import { useState, type FormEvent } from 'react'
import { MessageSquare, SendHorizontal, Trash2, RefreshCw } from 'lucide-react'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { CHAT_CAMPUS } from '@shared/rooms/constants'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
const time = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
export function CampusFeed() {
  const { nguoiDung, moAuthModal } = usePhien()
  const { messages, guiChat, xoaChat, myPermissions, campusSnapshotReady, trangThai, ketNoiLai } = useCampus()
  const [text, setText] = useState(''), [sending, setSending] = useState(false), [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null), [person, setPerson] = useState<NguoiXem | null>(null)
  const online = trangThai === 'da_ket_noi'
  const send = async (event: FormEvent) => {
    event.preventDefault(); if (!text.trim() || sending || !online) return
    setSending(true); setError(null)
    try { const result = await guiChat(text); if (result.ok) setText(''); else setError(result.loi ?? 'Không gửi được nội dung. Hãy thử lại.') } catch { setError('Không gửi được nội dung. Hãy thử lại.') } finally { setSending(false) }
  }
  return <section className="min-w-0 space-y-5" aria-label="Bảng tin trường" data-testid="campus-feed">
    <div className="rounded-2xl bg-surface p-4 sm:p-5">
      <h2 className="mb-3 text-base font-semibold text-text-primary">Bảng tin trường</h2>
      {!nguoiDung ? <Button variant="outline" onClick={() => moAuthModal('dang_nhap')}>Đăng nhập để tham gia</Button> : <form onSubmit={send} className="space-y-3">
        <label htmlFor="campus-feed-input" className="sr-only">Chia sẻ với mọi người</label><textarea id="campus-feed-input" data-testid="campus-feed-input" value={text} onChange={e => setText(e.target.value)} maxLength={CHAT_CAMPUS.TOI_DA_KY_TU} placeholder="Bạn muốn chia sẻ điều gì?" rows={3} className="w-full resize-y rounded-xl border border-border-default bg-canvas px-3 py-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-brand" />
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-text-tertiary">Mọi người trong trường đều có thể xem.</span><Button type="submit" disabled={!online || !text.trim() || sending} data-testid="campus-feed-send"><SendHorizontal className="size-4" />{sending ? 'Đang gửi…' : 'Chia sẻ'}</Button></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </form>}
    </div>
    {nguoiDung && (!campusSnapshotReady || !online) && <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-warning-muted px-4 py-3 text-sm text-warning"><RefreshCw className="size-4" /><span>{campusSnapshotReady ? 'Đang kết nối lại — nội dung có thể chưa mới nhất.' : 'Đang đồng bộ bảng tin…'}</span><Button size="sm" variant="ghost" onClick={ketNoiLai}>Kết nối lại</Button></div>}
    {campusSnapshotReady && messages.length === 0 && <div className="rounded-2xl bg-surface px-5 py-12 text-center"><MessageSquare className="mx-auto mb-3 size-6 text-text-tertiary" /><p className="text-sm text-text-secondary">Chưa có nội dung được chia sẻ.</p></div>}
    <div className="divide-y divide-border-subtle rounded-2xl bg-surface px-4 sm:px-5">{[...messages].reverse().map(message => <article key={message.id} className="py-5" data-testid={'campus-post-' + message.id}>
      <div className="mb-3 flex min-w-0 items-start gap-3"><button type="button" className="flex min-h-11 min-w-0 flex-1 items-start gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label={'Xem thông tin ' + message.ten} onClick={e => setPerson({ id: message.accountId, ten: message.ten, avatar: message.avatar ?? null, lopTen: message.lopTen, vaiTro: message.vaiTro, anchorRect: e.currentTarget.getBoundingClientRect() })}>
        {message.avatar ? <img src={message.avatar} alt="" className="size-10 shrink-0 rounded-full object-cover" /> : <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">{message.ten.slice(0, 1)}</span>}
        <span className="min-w-0"><span className="block break-words text-sm font-semibold text-text-primary">{message.ten}</span><span className="mt-1 block text-xs text-text-secondary">{message.lopTen ? message.lopTen + ' · ' : ''}{time.format(message.taoLuc)}</span></span></button>
        {myPermissions && (myPermissions.xoaMoiTin || myPermissions.accountId === message.accountId) && <Button size="icon-lg" variant="ghost" aria-label="Xóa nội dung" onClick={() => setDeleting(message.id)}><Trash2 className="size-4" /></Button>}
      </div><p className="break-words whitespace-pre-wrap text-sm leading-7 text-text-primary">{message.noiDung}</p>
    </article>)}</div>
    <HoSoNguoiDungDialog nguoi={person} onDong={() => setPerson(null)} />
    <AlertDialog open={deleting !== null} onOpenChange={open => { if (!open) setDeleting(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa nội dung này?</AlertDialogTitle><AlertDialogDescription>Nội dung sẽ được xóa khỏi bảng tin và trò chuyện toàn trường.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={async () => { if (deleting === null) return; const result = await xoaChat(deleting); if (!result.ok) setError(result.loi ?? 'Không xóa được nội dung.'); setDeleting(null) }}>Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>
}
