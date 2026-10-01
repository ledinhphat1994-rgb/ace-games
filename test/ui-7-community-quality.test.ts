import { describe, expect, it } from 'vitest'
import communityRaw from '../src/features/hub/CommunityPage.tsx?raw'

describe('UI-7: Community Social Hub Consolidation', () => {
  describe('1. Non-negotiable Data Truth & Elimination of Fabricated Content', () => {
    it('does NOT render CampusFeed, fake feed tabs, or fake posts', () => {
      expect(communityRaw).not.toContain('CampusFeed')
      expect(communityRaw).not.toContain('Dành cho bạn')
      expect(communityRaw).not.toContain('toggleLike')
      expect(communityRaw).not.toContain('likedPosts')
      expect(communityRaw).not.toContain('handleShare')
    })

    it('does NOT render fake groups, fake events, or fake discussion tags', () => {
      expect(communityRaw).not.toContain('Nhóm nổi bật')
      expect(communityRaw).not.toContain('48 thành viên')
      expect(communityRaw).not.toContain('Sự kiện trường học')
      expect(communityRaw).not.toContain('Giải Cờ Vua Mùa Thu 10A7')
      expect(communityRaw).not.toContain('#Lop10A7')
      expect(communityRaw).not.toContain('#HocTapThongMinh')
      expect(communityRaw).not.toContain('#DauTruongCaro')
      expect(communityRaw).not.toContain('#KhoTaiLieuPDF')
    })

    it('does NOT render duplicate leaderboard sheet or second chat system', () => {
      expect(communityRaw).not.toContain('GameArenaLeaderboard')
      expect(communityRaw).not.toContain('rankingOpen')
      expect(communityRaw).not.toContain('setRankingOpen')
    })
  })

  describe('2. Area A: Lightweight Social Overview', () => {
    it('renders truthful social overview with friends, online, requests, and in-room stats', () => {
      expect(communityRaw).toContain('data-testid="community-social-overview"')
      expect(communityRaw).toContain('totalActive')
      expect(communityRaw).toContain('presenceView.inRoom.length')
      expect(communityRaw).toContain('incomingRequests.length')
      expect(communityRaw).toContain('friends.length')
    })

    it('provides clear canonical actions: Find Friends and Campus Chat', () => {
      expect(communityRaw).toContain('data-testid="community-find-friends-cta"')
      expect(communityRaw).toContain('data-testid="community-open-chat-cta"')
      expect(communityRaw).toContain("openDrawerTab('search')")
      expect(communityRaw).toContain("window.dispatchEvent(new CustomEvent('campus:open-chat'))")
    })
  })

  describe('3. Area B: Friends & Connections Workspace', () => {
    it('renders the primary friends workspace with filter tabs and search input', () => {
      expect(communityRaw).toContain('data-testid="community-friends-workspace"')
      expect(communityRaw).toContain('data-testid="community-friends-tab-all"')
      expect(communityRaw).toContain('data-testid="community-friends-tab-online"')
      expect(communityRaw).toContain('data-testid="community-friends-tab-requests"')
      expect(communityRaw).toContain('data-testid="community-search-input"')
    })

    it('preserves authoritative presence view & degraded network banners', () => {
      expect(communityRaw).toContain('derivePresenceView')
      expect(communityRaw).toContain('data-testid="community-degraded-banner"')
      expect(communityRaw).toContain('data-testid="community-degraded-retry-btn"')
      expect(communityRaw).toContain('data-testid="presence-disconnected-banner"')
      expect(communityRaw).toContain('data-testid="presence-unknown-banner"')
      expect(communityRaw).toContain('data-testid="friends-unconfirmed-list"')
    })

    it('preserves test IDs for friend rows in all presence states', () => {
      expect(communityRaw).toContain('friend-unconfirmed-${friend.username}')
      expect(communityRaw).toContain('friend-in-room-${friend.username}')
      expect(communityRaw).toContain('join-room-btn-${friend.username}')
      expect(communityRaw).toContain('friend-online-${friend.username}')
      expect(communityRaw).toContain('friend-offline-${friend.username}')
    })

    it('provides 1:1 chat entry points using existing campus:open-dm protocol', () => {
      expect(communityRaw).toContain('community-dm-btn-${friend.username}')
      expect(communityRaw).toContain("new CustomEvent('campus:open-dm'")
    })

    it('supports incoming friend requests with accept & reject actions', () => {
      expect(communityRaw).toContain('acceptFriendRequest')
      expect(communityRaw).toContain('rejectFriendRequest')
      expect(communityRaw).toContain('handleAcceptRequest')
      expect(communityRaw).toContain('handleRejectRequest')
    })

    it('supports blocked users view and unblock action', () => {
      expect(communityRaw).toContain('unblockUser')
      expect(communityRaw).toContain('handleUnblock')
      expect(communityRaw).toContain('blockedUsers')
    })

    it('preserves loading, error, and honest empty states', () => {
      expect(communityRaw).toContain('data-testid="community-loading"')
      expect(communityRaw).toContain('data-testid="community-error"')
      expect(communityRaw).toContain('data-testid="community-retry-btn"')
      expect(communityRaw).toContain('data-testid="community-empty"')
    })
  })

  describe('4. Area C: My Identity (Digital Campus Passport)', () => {
    it('renders identity card with real user profile, avatar, name, and class', () => {
      expect(communityRaw).toContain('data-testid="community-identity-card"')
      expect(communityRaw).toContain('nguoiDung.avatar')
      expect(communityRaw).toContain('nguoiDung.ten || nguoiDung.username')
      expect(communityRaw).toContain('nguoiDung.username')
      expect(communityRaw).toContain('nguoiDung.lop?.ten')
      expect(communityRaw).toContain('nguoiDung.tieuDeHoSo')
    })

    it('queries authoritative engagement profile and real achievements', () => {
      expect(communityRaw).toContain("queryKey: ['engagement', 'me']")
      expect(communityRaw).toContain("queryKey: ['engagement', 'achievements']")
      expect(communityRaw).toContain('profileData?.profile?.currentStreak')
      expect(communityRaw).toContain('profileData?.profile?.totalXp')
      expect(communityRaw).toContain('unlockedBadgesCount')
      expect(communityRaw).toContain('totalBadgesCount')
      expect(communityRaw).toContain("navigate('/me')")
    })

    it('provides quick discovery and campus chat shortcuts', () => {
      expect(communityRaw).toContain('openDrawerTab(\'search\')')
      expect(communityRaw).toContain('handleOpenChat')
    })
  })

  describe('5. Canonical Component Integration & Safety', () => {
    it('reuses FriendsDrawer as canonical drawer for search/requests', () => {
      expect(communityRaw).toContain('<FriendsDrawer')
      expect(communityRaw).toContain('drawerOpen')
      expect(communityRaw).toContain('drawerDefaultTab')
    })

    it('reuses HoSoNguoiDungDialog for member profile popover', () => {
      expect(communityRaw).toContain('<HoSoNguoiDungDialog')
      expect(communityRaw).toContain('nguoiXem')
    })
  })
})
