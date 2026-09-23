import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import type { KetQuaThaoTac } from '@/hooks/use-campus'
import type { TinCampus } from '@shared/protocol/campus'
import { CHAT_CAMPUS } from '@shared/rooms/constants'
import { MessageSquare, Send, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface CampusChatDrawerProps {
  messages: TinCampus[]
  myPermissions: { accountId: number; xoaMoiTin: boolean } | null
  onSendMessage: (text: string) => Promise<KetQuaThaoTac>
  onDeleteMessage: (id: number) => Promise<KetQuaThaoTac>
  className?: string
  hideHeader?: boolean
}

function dinhDangGio(ms: number): string {
  const d = new Date(ms)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function CampusChatDrawer({
  messages,
  myPermissions,
  onSendMessage,
  onDeleteMessage,
  className = '',
  hideHeader = false,
}: CampusChatDrawerProps) {
  const [noiDung, setNoiDung] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [idDangXoa, setIdDangXoa] = useState<number | null>(null)
  const [bayGio, setBayGio] = useState(() => Date.now())
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setBayGio(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages.length])

  const xuLyGui = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = noiDung.trim()
    if (!text || dangGui) return

    setDangGui(true)
    const kq = await onSendMessage(text)
    setDangGui(false)

    if (kq.ok) {
      setNoiDung('')
    } else {
      toast.error(kq.loi || 'Không gửi được tin nhắn')
    }
  }

  const xuLyXoa = async (id: number) => {
    if (idDangXoa !== null) return
    setIdDangXoa(id)
    const kq = await onDeleteMessage(id)
    setIdDangXoa(null)

    if (kq.ok) {
      toast.success('Đã xoá tin nhắn')
    } else {
      toast.error(kq.loi || 'Không xoá được tin nhắn')
    }
  }

  return (
    <Card className={`flex h-full flex-col border-border/70 bg-card ${className}`}>
      {/* Header */}
      {!hideHeader && (
        <CardHeader className="border-b border-border/50 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Trò chuyện sảnh trường</span>
            </CardTitle>
            <Badge variant="outline" className="border-border/60 bg-muted/30 text-[10px] text-muted-foreground font-medium">
              {messages.length} tin nhắn
            </Badge>
          </div>
        </CardHeader>
      )}

      {/* Messages Scroll Area */}
      <CardContent ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <EmptyState
              compact
              icon={Sparkles}
              title="Chưa có tin nhắn nào"
              description="Hãy là người đầu tiên gửi lời chào tới thầy cô và các bạn trong toàn trường!"
            />
          </div>
        ) : (
          messages.map((msg) => {
            const laCuaMinh = myPermissions?.accountId === msg.accountId
            const trong15Phut = bayGio - msg.taoLuc <= CHAT_CAMPUS.TU_XOA_TRONG_MS
            const coQuyenXoa = myPermissions?.xoaMoiTin || (laCuaMinh && trong15Phut)

            return (
              <div
                key={msg.id}
                className={`group flex flex-col rounded-xl p-2.5 text-xs transition-colors shadow-2xs ${
                  laCuaMinh
                    ? 'bg-primary/10 border border-primary/25 ml-4'
                    : 'bg-muted/40 border border-border/40 hover:bg-muted/60 mr-4'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-bold text-foreground">
                      {msg.ten}
                      {laCuaMinh ? ' (bạn)' : ''}
                    </span>

                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 h-4 font-semibold ${
                        msg.vaiTro === 'giao_vien'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          : 'border-slate-500/30 text-muted-foreground'
                      }`}
                    >
                      {msg.vaiTro === 'giao_vien' ? 'Giáo viên' : (msg.lopTen || 'Học sinh')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground/70">{dinhDangGio(msg.taoLuc)}</span>

                    {coQuyenXoa ? (
                      <button
                        type="button"
                        onClick={() => xuLyXoa(msg.id)}
                        disabled={idDangXoa === msg.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive cursor-pointer"
                        title={myPermissions?.xoaMoiTin && !laCuaMinh ? 'Xoá tin (quyền Giáo viên)' : 'Tự xoá tin'}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <p className="whitespace-pre-wrap break-words text-foreground/90 text-xs leading-relaxed">
                  {msg.noiDung}
                </p>
              </div>
            )
          })
        )}
      </CardContent>

      {/* Composer Footer */}
      <CardFooter className="border-t border-border/50 p-3 pb-6 sm:pb-3 bg-card/80 shrink-0">
        <form onSubmit={xuLyGui} className="flex w-full items-center gap-2">
          <Input
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value.slice(0, CHAT_CAMPUS.TOI_DA_KY_TU))}
            placeholder="Nhập lời nhắn gửi đến toàn trường…"
            className="h-9 text-xs bg-muted/20 border-border/70 focus:bg-background"
            disabled={dangGui}
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 w-9 shrink-0 p-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            disabled={!noiDung.trim() || dangGui}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
