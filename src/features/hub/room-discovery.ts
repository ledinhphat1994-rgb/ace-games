import type { PhongSanh } from '../../../shared/protocol/campus'
import type { BlockedUserItem, FriendItem, FriendPresence } from '../../../shared/protocol/social'

export interface RoomFriendInfo {
  id: number
  displayName: string
  username: string
  avatar: string | null
  lopTen?: string | null
}

export interface DiscoveryFilterOptions {
  tabPhamVi?: 'tat_ca' | 'truong' | 'lop'
  nodeDangChon?: 'tat_ca' | 'hoc_tap' | 'game' | 'sinh_hoat'
  tuKhoa?: string
  chiHienCoBanBe?: boolean
  userLopId?: number | null
}

/**
 * Xây dựng projection map từ danh sách phòng, danh sách bạn bè và presence hiện tại.
 * O(rooms + visible friends) — không N+1, không gọi API, hoàn toàn thuần túy.
 */
export function buildRoomFriendsMap(
  rooms: PhongSanh[],
  friends: FriendItem[],
  presenceMap: Record<number, FriendPresence>,
  blockedUsers?: BlockedUserItem[],
  freshness?: {
    presenceReady?: boolean
    connectionStatus?: string
  },
): Map<number, RoomFriendInfo[]> {
  const roomMap = new Map<number, RoomFriendInfo[]>()
  for (const r of rooms) {
    roomMap.set(r.id, [])
  }

  // Fail-closed: UNKNOWN / STALE presence must NEVER be shown as current live activity.
  // Only derive friend-in-room badges when presenceReady === true AND connectionStatus === 'da_ket_noi'.
  if (freshness) {
    const { presenceReady, connectionStatus } = freshness
    if (presenceReady !== true || connectionStatus !== 'da_ket_noi') {
      return roomMap
    }
  }

  const blockedSet = new Set((blockedUsers ?? []).map((b) => b.id))
  const friendById = new Map<number, FriendItem>()
  for (const f of friends) {
    if (!blockedSet.has(f.id)) {
      friendById.set(f.id, f)
    }
  }

  for (const [accountIdStr, presence] of Object.entries(presenceMap)) {
    const accountId = Number(accountIdStr)
    if (blockedSet.has(accountId)) continue

    // Chỉ tính bạn bè đang online hoặc away
    if (presence.state !== 'online' && presence.state !== 'away') continue

    // Chỉ tính bạn bè có hoạt động trong phòng học cụ thể
    if (presence.activity?.type !== 'room' || typeof presence.activity.roomId !== 'number') {
      continue
    }

    const roomId = presence.activity.roomId
    const roomFriendList = roomMap.get(roomId)
    // Nếu phòng không tồn tại trong sảnh (stale/unknown), bỏ qua an toàn
    if (!roomFriendList) continue

    const friend = friendById.get(accountId)
    // Nếu không phải là bạn bè trong danh sách, bỏ qua
    if (!friend) continue

    // Tránh trùng lặp tài khoản trong cùng 1 phòng
    if (!roomFriendList.some((rf) => rf.id === friend.id)) {
      roomFriendList.push({
        id: friend.id,
        displayName: friend.displayName,
        username: friend.username,
        avatar: friend.avatar,
        lopTen: friend.lopTen,
      })
    }
  }

  // Sắp xếp danh sách bạn bè trong từng phòng theo thứ tự tất định (tên, sau đó ID)
  for (const list of roomMap.values()) {
    list.sort((a, b) => a.displayName.localeCompare(b.displayName) || a.id - b.id)
  }

  return roomMap
}

/**
 * Sắp xếp phòng tất định:
 * 1. Phòng có bạn bè đang tham gia
 * 2. Phòng đang hoạt động (có người tham gia > 0)
 * 3. Phòng còn lại
 *
 * Tiêu chí phụ: số bạn bè giảm dần, số người giảm dần, thời gian tạo giảm dần, id tăng dần.
 */
export function sortDiscoveryRooms(
  rooms: PhongSanh[],
  roomFriendsMap: Map<number, RoomFriendInfo[]>,
): PhongSanh[] {
  return [...rooms].sort((a, b) => {
    const prioA = (roomFriendsMap.get(a.id)?.length ?? 0) > 0 ? 1 : a.soNguoi > 0 ? 2 : 3
    const prioB = (roomFriendsMap.get(b.id)?.length ?? 0) > 0 ? 1 : b.soNguoi > 0 ? 2 : 3
    if (prioA !== prioB) return prioA - prioB

    if (prioA === 1) {
      const friendsA = roomFriendsMap.get(a.id)?.length ?? 0
      const friendsB = roomFriendsMap.get(b.id)?.length ?? 0
      if (friendsB !== friendsA) return friendsB - friendsA
      if (b.soNguoi !== a.soNguoi) return b.soNguoi - a.soNguoi
      if (b.taoLuc !== a.taoLuc) return b.taoLuc - a.taoLuc
      return a.id - b.id
    }

    if (prioA === 2) {
      if (b.soNguoi !== a.soNguoi) return b.soNguoi - a.soNguoi
      if (b.taoLuc !== a.taoLuc) return b.taoLuc - a.taoLuc
      return a.id - b.id
    }

    // prioA === 3
    if (b.taoLuc !== a.taoLuc) return b.taoLuc - a.taoLuc
    return a.id - b.id
  })
}

/**
 * Lọc danh sách phòng theo các bộ lọc kết hợp (composite filtering).
 */
export function filterDiscoveryRooms(
  rooms: PhongSanh[],
  roomFriendsMap: Map<number, RoomFriendInfo[]>,
  options: DiscoveryFilterOptions,
): PhongSanh[] {
  let ketQua = sortDiscoveryRooms(rooms, roomFriendsMap)

  // Bộ lọc "Có bạn bè"
  if (options.chiHienCoBanBe) {
    ketQua = ketQua.filter((r) => (roomFriendsMap.get(r.id)?.length ?? 0) > 0)
  }

  // Bộ lọc theo phạm vi
  if (options.tabPhamVi === 'truong') {
    ketQua = ketQua.filter((r) => r.phamVi === 'truong')
  } else if (options.tabPhamVi === 'lop') {
    ketQua = ketQua.filter((r) => {
      if (options.userLopId) return r.lopId === options.userLopId
      return r.phamVi === 'lop'
    })
  }

  // Bộ lọc theo Hub Node
  if (options.nodeDangChon === 'sinh_hoat') {
    ketQua = ketQua.filter((r) => r.phamVi === 'truong')
  }

  // Bộ lọc theo từ khoá
  const q = options.tuKhoa?.trim().toLowerCase()
  if (q) {
    ketQua = ketQua.filter(
      (r) =>
        r.ten.toLowerCase().includes(q) ||
        (r.chuPhongTen && r.chuPhongTen.toLowerCase().includes(q)) ||
        (r.lopTen && r.lopTen.toLowerCase().includes(q)),
    )
  }

  return ketQua
}

/**
 * Vào phòng nhanh: phòng đầu tiên theo đúng thứ tự khám phá của sảnh (có bạn bè → đông người → mới tạo)
 * còn chỗ và không cần mật khẩu. Không có phòng nào như vậy thì trả null.
 */
export function chonPhongVaoNhanh(
  rooms: PhongSanh[],
  roomFriendsMap: Map<number, RoomFriendInfo[]>,
): PhongSanh | null {
  return sortDiscoveryRooms(rooms, roomFriendsMap).find((r) => !r.coMatKhau && r.soNguoi < r.sucChua) ?? null
}
