import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  School,
  Search,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import { useCampusContext } from '@/app/CampusContext'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CampusChatDrawer } from '@/features/hub/CampusChatDrawer'
import { formatLastSeen } from '@/features/hub/social-semantics'
import type { KetQuaThaoTac } from '@/hooks/use-campus'
import { cn } from '@/lib/utils'
import type { TinCampus } from '@shared/protocol/campus'
import type { FriendItem } from '@shared/protocol/social'
import { DirectMessageThread, type DmTargetUser } from '@/components/chat/DirectMessageThread'

export type { DmTargetUser }

interface CampusChatSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: TinCampus[]
  myPermissions: { accountId: number; xoaMoiTin: boolean } | null
  onSendMessage: (text: string) => Promise<KetQuaThaoTac>
  onDeleteMessage: (id: number) => Promise<KetQuaThaoTac>
  activeDmTarget?: DmTargetUser | null
  onSelectDmTarget?: (target: DmTargetUser | null) => void
  coTinNhanMoiCampus?: boolean
}

type ActiveConversation =
  | { type: 'campus' }
  | { type: 'dm'; target: DmTargetUser }

export function CampusChatSheet({
  open,
  onOpenChange,
  messages,
  myPermissions,
  onSendMessage,
  onDeleteMessage,
  activeDmTarget,
  onSelectDmTarget,
  coTinNhanMoiCampus = false,
}: CampusChatSheetProps) {
  const navigate = useNavigate()
  const { socialState, friendsPresence, presenceReady } = useCampusContext()
  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])

  const [activeConversation, setActiveConversation] = useState<ActiveConversation>({ type: 'campus' })
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('thread')
  const [searchQuery, setSearchQuery] = useState('')

  const [prevTargetId, setPrevTargetId] = useState<number | null>(activeDmTarget?.id ?? null)
  if (activeDmTarget && activeDmTarget.id !== prevTargetId) {
    setPrevTargetId(activeDmTarget.id)
    setActiveConversation({ type: 'dm', target: activeDmTarget })
    setMobileView('thread')
  }

  // Lọc danh sách bạn bè theo từ khóa tìm kiếm
  const friendsFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return friends
    return friends.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q) ||
        (f.lopTen && f.lopTen.toLowerCase().includes(q)),
    )
  }, [friends, searchQuery])

  const handleSelectCampus = () => {
    setActiveConversation({ type: 'campus' })
    onSelectDmTarget?.(null)
    setMobileView('thread')
  }

  const handleSelectFriend = (friend: FriendItem) => {
    const target: DmTargetUser = {
      id: friend.id,
      displayName: friend.displayName,
      avatar: friend.avatar,
      lopTen: friend.lopTen,
    }
    setActiveConversation({ type: 'dm', target })
    onSelectDmTarget?.(target)
    setMobileView('thread')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl data-[side=right]:md:max-w-3xl data-[side=right]:lg:max-w-4xl h-full flex flex-col overflow-hidden [&_[data-slot=sheet-close]]:size-10"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Trung tâm trò chuyện và tin nhắn</SheetTitle>
          <SheetDescription>Trò chuyện toàn trường và tin nhắn riêng trực tiếp với bạn bè</SheetDescription>
        </SheetHeader>

        <div className="flex h-full w-full min-h-0 overflow-hidden">
          {/* ════════════════════════════════════════════════════════════════════════════════
              CỘT TRÁI: DANH SÁCH HỘI THOẠI (Hiện trên Desktop, chuyển đổi trên Mobile)
              ════════════════════════════════════════════════════════════════════════════════ */}
          <aside
            aria-label="Danh sách hội thoại"
            className={cn(
              'flex flex-col border-r border-border-subtle bg-surface shrink-0 w-full sm:w-72 lg:w-80 h-full min-h-0',
              mobileView === 'thread' ? 'hidden sm:flex' : 'flex',
            )}
          >
            {/* Header danh sách hội thoại */}
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3.5 pr-14 sm:pr-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4.5 text-brand" />
                <h2 className="text-sm font-semibold text-text-primary">Tin nhắn & Trò chuyện</h2>
              </div>
            </div>

            {/* Ô tìm kiếm hội thoại / bạn bè */}
            <div className="p-3 border-b border-border-subtle">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm bạn bè…"
                  aria-label="Tìm bạn bè trong danh sách trò chuyện"
                  className="h-9 pl-9 pr-3 text-xs bg-surface-raised border-border-subtle"
                />
              </div>
            </div>

            {/* Danh sách hội thoại cuộn nội bộ */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-1 min-h-0">
              {/* 1. Trò chuyện toàn trường (Kênh cố định trên cùng) */}
              <button
                type="button"
                onClick={handleSelectCampus}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors cursor-pointer group',
                  activeConversation.type === 'campus'
                    ? 'bg-brand/12 text-brand font-medium'
                    : 'text-text-primary hover:bg-surface-raised',
                )}
              >
                <div className="relative shrink-0 flex size-10 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <School className="size-5" />
                  {coTinNhanMoiCampus && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full size-2.5 bg-destructive" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold truncate">Toàn trường</span>
                    {coTinNhanMoiCampus && (
                      <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider shrink-0">
                        Mới
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary truncate">Sảnh trò chuyện chung</p>
                </div>
              </button>

              {/* Phân cách danh sách bạn bè */}
              <div className="pt-3 pb-1 px-2.5 flex items-center justify-between text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                <span>Bạn bè</span>
                <span className="tabular-nums font-normal">{friends.length}</span>
              </div>

              {/* Danh sách bạn bè */}
              {friendsFiltered.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <Users className="size-8 mx-auto text-text-tertiary opacity-40 mb-2" />
                  <p className="text-xs text-text-secondary">
                    {searchQuery ? 'Không tìm thấy bạn nào khớp.' : 'Chưa có bạn bè nào.'}
                  </p>
                  {!searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs gap-1.5 h-8"
                      onClick={() => {
                        onOpenChange(false)
                        navigate('/community')
                      }}
                    >
                      <span>Tìm bạn tại Cộng đồng</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  )}
                </div>
              ) : (
                friendsFiltered.map((friend) => {
                  const presence = presenceReady ? friendsPresence[friend.id] : undefined
                  const status = presenceReady ? (presence?.state ?? 'offline') : 'unknown'
                  const isOnline = status === 'online'
                  const isAway = status === 'away'
                  const activity = presenceReady ? presence?.activity : undefined
                  const isSelected =
                    activeConversation.type === 'dm' && activeConversation.target.id === friend.id

                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleSelectFriend(friend)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors cursor-pointer group',
                        isSelected
                          ? 'bg-brand/12 text-brand font-medium'
                          : 'text-text-primary hover:bg-surface-raised',
                      )}
                    >
                      <div className="relative shrink-0">
                        <AnhNguoiDung ten={friend.displayName} avatar={friend.avatar} className="size-10 text-sm" />
                        <span
                          className={cn(
                            'absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-surface',
                            !presenceReady
                              ? 'bg-slate-500'
                              : isOnline
                                ? 'bg-emerald-500'
                                : isAway
                                  ? 'bg-amber-400'
                                  : 'bg-slate-500',
                          )}
                          title={
                            !presenceReady
                              ? 'Đang kết nối lại'
                              : isOnline
                                ? 'Trực tuyến'
                                : isAway
                                  ? 'Tạm vắng'
                                  : 'Ngoại tuyến'
                          }
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold truncate">{friend.displayName}</span>
                          {friend.lopTen && (
                            <span className="text-[10px] text-text-tertiary rounded bg-surface-overlay px-1 py-0.2 shrink-0">
                              {friend.lopTen}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-tertiary truncate">
                          {!presenceReady
                            ? 'Đang đồng bộ…'
                            : activity
                              ? activity.roomTitle
                                ? `Trong phòng: ${activity.roomTitle}`
                                : 'Đang học nhóm'
                              : isOnline
                                ? 'Trực tuyến'
                                : isAway
                                  ? 'Tạm vắng'
                                  : formatLastSeen(presence?.lastSeen ?? null)}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer cột trái: Lối tắt tới /community */}
            <div className="p-3 border-t border-border-subtle bg-surface-raised/40">
              <Button
                variant="ghost"
                className="w-full justify-between text-xs text-text-secondary hover:text-text-primary h-8.5 px-2.5"
                onClick={() => {
                  onOpenChange(false)
                  navigate('/community')
                }}
              >
                <span>Mở không gian Cộng đồng</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </aside>

          {/* ════════════════════════════════════════════════════════════════════════════════
              CỘT PHẢI: KHUNG TRÒ CHUYỆN HOẠT ĐỘNG (Toàn trường hoặc Tin nhắn riêng 1-1)
              ════════════════════════════════════════════════════════════════════════════════ */}
          <main
            aria-label="Khung trò chuyện hoạt động"
            className={cn(
              'flex flex-col flex-1 min-w-0 bg-canvas h-full min-h-0',
              mobileView === 'list' ? 'hidden sm:flex' : 'flex',
            )}
          >
            {activeConversation.type === 'campus' ? (
              <div className="flex flex-col h-full min-h-0">
                {/* Header trò chuyện toàn trường */}
                <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-4 py-3 pr-14 sm:pr-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      onClick={() => setMobileView('list')}
                      className="sm:hidden -ml-2 text-text-secondary hover:text-text-primary"
                      aria-label="Quay lại danh sách hội thoại"
                    >
                      <ArrowLeft className="size-4.5" />
                    </Button>
                    <div className="flex size-9 items-center justify-center rounded-full bg-brand/15 text-brand shrink-0">
                      <School className="size-4.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-text-primary">Trò chuyện toàn trường</h2>
                      <p className="text-xs text-text-tertiary">Mọi thành viên trường đều thấy tin nhắn</p>
                    </div>
                  </div>
                </div>

                {/* Danh sách tin nhắn toàn trường */}
                <CampusChatDrawer
                  messages={messages}
                  myPermissions={myPermissions}
                  onSendMessage={onSendMessage}
                  onDeleteMessage={onDeleteMessage}
                  hideHeader
                  className="min-h-0 flex-1"
                />
              </div>
            ) : (
              <DirectMessageThread
                target={activeConversation.target}
                onBack={() => setMobileView('list')}
                className="min-h-0 flex-1"
              />
            )}
          </main>
        </div>
      </SheetContent>
    </Sheet>
  )
}
