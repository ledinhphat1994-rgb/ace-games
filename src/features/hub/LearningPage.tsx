// Digital Campus v2: Canonical Learning Room Lobby (Approved Reference Design)
// src/features/hub/LearningPage.tsx

import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { RoomCard } from './RoomCard'
import { ThongKeHocTap } from './ThongKeHocTap'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { JoinRoomModal } from './components/learning/JoinRoomModal'
import { buildRoomFriendsMap, sortDiscoveryRooms } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import {
  BookOpen,
  DoorOpen,
  Hash,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  WifiOff,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  LEARNING_OCCUPANCY_METRIC_CONFIG,
  deriveActiveFriendStudy,
  deriveLobbyState,
  deriveQuickJoinRoom,
  filterLobbyRooms,
} from './learning-semantics'

export { LEARNING_OCCUPANCY_METRIC_CONFIG }

export function LearningPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  const { nguoiDung, moAuthModal } = usePhien()

  const {
    rooms,
    socialState,
    presenceMap,
    presenceReady,
    trangThai,
    ketNoiLai,
    campusSnapshotReady,
  } = useCampus()

  const [tuKhoa, setTuKhoa] = useState(urlQuery)
  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)
  const [moVaoBangMa, setMoVaoBangMa] = useState(false)

  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const blockedUsers = useMemo(() => socialState?.blockedUsers ?? [], [socialState?.blockedUsers])

  const roomFriendsMap = useMemo(
    () =>
      buildRoomFriendsMap(rooms, friends, presenceMap, blockedUsers, {
        presenceReady,
        connectionStatus: trangThai,
      }),
    [rooms, friends, presenceMap, blockedUsers, presenceReady, trangThai],
  )

  // Authoritative Lobby Readiness State: 'loading' | 'reconnecting' | 'ready'
  const lobbyState = useMemo(
    () => deriveLobbyState({ trangThai, campusSnapshotReady, rooms }),
    [trangThai, campusSnapshotReady, rooms],
  )

  // Filter by search query (room name, host, subject) then sort friends/occupancy first
  const danhSachPhongLoc = useMemo(
    () => sortDiscoveryRooms(filterLobbyRooms(rooms, tuKhoa), roomFriendsMap),
    [rooms, tuKhoa, roomFriendsMap],
  )

  // Smart continuation: friend actively studying (fail-closed, authoritative room)
  const activeFriendStudy = useMemo(
    () =>
      deriveActiveFriendStudy({
        rooms,
        roomFriendsMap,
        presenceReady,
        trangThai,
      }),
    [rooms, roomFriendsMap, presenceReady, trangThai],
  )

  const datTuKhoa = (giaTri: string) => {
    setTuKhoa(giaTri)
    setSearchParams(giaTri ? { q: giaTri } : {}, { replace: true })
  }

  const xuLyVaoPhong = (room: PhongSanh) => {
    if (room.soNguoi >= room.sucChua) {
      toast.error('Phòng học đã đầy số lượng người tham gia!')
      return
    }
    if (room.coMatKhau) {
      setPhongCanMatKhau(room)
      return
    }
    navigate(`/room/phong-${room.id}`)
  }

  const canDangNhap = (viec: () => void) => () => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    viec()
  }

  // Quick join: memoized best open room with capacity and no password, available ONLY when lobby is ready
  const quickJoinRoom = useMemo(
    () => deriveQuickJoinRoom({ lobbyStatus: lobbyState.status, rooms, roomFriendsMap }),
    [lobbyState.status, rooms, roomFriendsMap],
  )

  const vaoPhongNhanh = () => {
    if (!quickJoinRoom) return
    xuLyVaoPhong(quickJoinRoom)
  }

  const laAdminToanQuyen = Boolean(
    nguoiDung && (nguoiDung.isSchoolAdmin || nguoiDung.role === 'admin' || nguoiDung.username === 'ledinhphat'),
  )

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* ── 1. Learning Hero Banner ── */}
      <section
        aria-label="Giới thiệu sảnh học tập"
        className="relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface shadow-xs"
      >
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/learning/learning_hero.webp"
            alt="Không gian học tập Digital Campus"
            className="h-full w-full object-cover object-right opacity-30 dark:opacity-35 img-crisp transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-transparent dark:from-surface dark:via-surface/90" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-9 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-1 text-xs font-semibold text-text-secondary mb-3 shadow-xs">
            <span className="size-2 rounded-full bg-brand animate-pulse" />
            <span>Digital Campus · Không gian học tập</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight leading-[1.25]">
            Phòng học trực tuyến & Học nhóm
          </h1>

          <p className="mt-2.5 text-xs sm:text-sm lg:text-base text-text-secondary leading-relaxed">
            Khám phá các phòng học đang mở, cùng bạn bè ôn luyện bài vở và phát triển kỹ năng mỗi ngày.
          </p>
        </div>
      </section>

      {/* ── 2. Smart Continuation: Friend actively studying ── */}
      {activeFriendStudy && (
        <div
          data-testid="friend-study-continuation"
          className="flex items-center justify-between gap-3 rounded-2xl border border-brand/35 bg-brand/10 p-3.5 sm:p-4 backdrop-blur-md shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-brand border border-brand/30">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                Bạn bè đang học: <span className="text-brand font-black">{activeFriendStudy.friend.displayName}</span>
              </p>
              <p className="text-xs text-text-secondary truncate">
                {activeFriendStudy.room.ten || `Phòng #${activeFriendStudy.room.id}`}
              </p>
            </div>
          </div>

          <Button
            data-testid="join-friend-study-btn"
            size="sm"
            onClick={canDangNhap(() => xuLyVaoPhong(activeFriendStudy.room))}
            className="shrink-0 gap-1.5 bg-brand hover:bg-brand-hover text-brand-foreground font-bold text-xs h-9 px-3.5 shadow-xs"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Vào cùng</span>
          </Button>
        </div>
      )}

      {/* ── 3. Action Bar & Discovery Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-tertiary pointer-events-none" />
          <input
            data-testid="learning-search-input"
            type="text"
            value={tuKhoa}
            onChange={(e) => datTuKhoa(e.target.value)}
            placeholder="Tìm phòng theo tên, môn, người tạo..."
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-border-default/80 bg-surface text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-hidden focus:ring-1 focus:ring-brand shadow-xs transition-colors"
          />
          {tuKhoa && (
            <button
              type="button"
              onClick={() => datTuKhoa('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary cursor-pointer p-0.5"
              aria-label="Xóa tìm kiếm"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons Cluster */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Join (Contextual: only when valid open room is ready) */}
          {quickJoinRoom && (
            <Button
              data-testid="quick-join-btn"
              variant="outline"
              size="sm"
              onClick={canDangNhap(vaoPhongNhanh)}
              className="h-10 px-3.5 rounded-xl border-border-default bg-surface hover:bg-surface-raised text-text-primary font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="size-3.5 mr-1.5 text-brand" />
              <span>Học ngay</span>
            </Button>
          )}

          {/* Join by code / ID */}
          <Button
            data-testid="join-by-code-btn"
            variant="outline"
            size="sm"
            onClick={canDangNhap(() => setMoVaoBangMa(true))}
            className="h-10 px-3.5 rounded-xl border-border-default bg-surface hover:bg-surface-raised text-text-primary font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Hash className="size-3.5 mr-1.5 text-text-tertiary" />
            <span>Vào bằng mã</span>
          </Button>

          {/* Create Room: canonical visible action (hidden when 0 rooms to avoid duplicating empty state CTA) */}
          {danhSachPhongLoc.length > 0 && (
            <Button
              data-testid="create-room-btn"
              size="sm"
              onClick={canDangNhap(() => setMoTaoPhong(true))}
              className="h-10 px-4 rounded-xl bg-brand hover:bg-brand-hover text-brand-foreground font-bold text-xs transition-all cursor-pointer shadow-xs"
            >
              <Plus className="size-4 mr-1.5" />
              <span>Tạo phòng</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── 4. Main Room Discovery Surface ── */}
      <section aria-label="Danh sách phòng học" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-text-primary">
              Phòng đang mở
            </h2>
            {nguoiDung && lobbyState.status === 'ready' && (
              <span className="text-xs text-text-secondary font-mono">
                ({danhSachPhongLoc.length})
              </span>
            )}
          </div>
        </div>

        {/* State A: Guest user (Truthful login required, not "0 rooms") */}
        {!nguoiDung ? (
          <div data-testid="learning-empty-rooms">
            <EmptyState
              icon={LogIn}
              title="Đăng nhập để xem phòng đang mở"
              action={{
                label: 'Đăng nhập ngay',
                onClick: () => moAuthModal('dang_nhap'),
              }}
            />
          </div>
        ) : lobbyState.status === 'loading' ? (
          /* State B: Loading skeleton */
          <div data-testid="learning-lobby-loading" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-border-default/60 bg-surface/50 p-4.5 animate-pulse space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-surface-overlay" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-surface-overlay" />
                    <div className="h-3 w-1/2 rounded bg-surface-overlay" />
                  </div>
                </div>
                <div className="h-4 w-1/3 rounded bg-surface-overlay mt-4" />
                <div className="h-2 w-full rounded-full bg-surface-overlay mt-3" />
              </div>
            ))}
          </div>
        ) : lobbyState.status === 'reconnecting' ? (
          /* State C: Reconnecting notice */
          <div
            data-testid="learning-lobby-reconnecting"
            className="flex flex-col items-center justify-center py-10 px-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center space-y-3"
          >
            <WifiOff className="size-8 text-amber-400" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-text-primary">Đang kết nối lại sảnh học tập...</p>
              <p className="text-xs text-text-secondary">Vui lòng chờ trong giây lát hoặc nhấn thử lại.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={ketNoiLai}
              className="h-8.5 px-3.5 text-xs font-semibold gap-1.5 border-border-default bg-surface hover:bg-surface-raised cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>Thử kết nối lại</span>
            </Button>
          </div>
        ) : tuKhoa.trim() && danhSachPhongLoc.length === 0 ? (
          /* State D: Search empty */
          <div data-testid="learning-search-empty">
            <EmptyState
              icon={Search}
              title="Không tìm thấy phòng phù hợp"
              action={{
                label: 'Xóa tìm kiếm',
                onClick: () => datTuKhoa(''),
              }}
            />
          </div>
        ) : danhSachPhongLoc.length === 0 ? (
          /* State E: Authoritative 0 rooms */
          <div data-testid="learning-empty-rooms">
            <EmptyState
              icon={BookOpen}
              title="Chưa có phòng học nào đang mở"
              action={{
                label: 'Tạo phòng học ngay',
                onClick: canDangNhap(() => setMoTaoPhong(true)),
              }}
            />
          </div>
        ) : (
          /* State F: Active room list */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {danhSachPhongLoc.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                friends={roomFriendsMap.get(room.id)}
                onVaoPhong={xuLyVaoPhong}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 5. Admin-Only Statistics (Contained, non-dominating) ── */}
      {laAdminToanQuyen && (
        <section aria-label="Thống kê quản trị" className="mt-8 pt-6 border-t border-border-subtle">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2 rounded-full bg-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Thống kê quản trị sảnh học tập
            </h2>
          </div>
          <ThongKeHocTap rooms={rooms} sanSang={lobbyState.status === 'ready'} />
        </section>
      )}

      {/* ── Dialogs & Modals ── */}
      {phongCanMatKhau && (
        <PasswordRoomDialog
          room={phongCanMatKhau}
          onSuccess={(roomId) => {
            setPhongCanMatKhau(null)
            navigate(`/room/phong-${roomId}`)
          }}
          onClose={() => setPhongCanMatKhau(null)}
        />
      )}

      <JoinRoomModal
        open={moVaoBangMa}
        onOpenChange={setMoVaoBangMa}
        onJoinRoomId={(id) => navigate(`/room/phong-${id}`)}
      />

      <CreateStudyRoomDialog
        open={moTaoPhong}
        onOpenChange={setMoTaoPhong}
        onSuccess={(roomId) => {
          setMoTaoPhong(false)
          navigate(`/room/phong-${roomId}`)
        }}
      />
    </div>
  )
}
