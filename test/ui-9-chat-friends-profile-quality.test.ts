import { describe, expect, it } from 'vitest'

import chatSheetCode from '../src/components/layout/CampusChatSheet.tsx?raw'
import dmThreadCode from '../src/components/chat/DirectMessageThread.tsx?raw'
import friendsDrawerCode from '../src/components/social/FriendsDrawer.tsx?raw'
import appShellCode from '../src/components/layout/AppShell.tsx?raw'
import appHeaderCode from '../src/components/layout/AppHeader.tsx?raw'
import profileDialogCode from '../src/components/social/HoSoNguoiDungDialog.tsx?raw'
import communityCode from '../src/features/hub/CommunityPage.tsx?raw'

describe('UI-9 Chat / Friends + Profile Quality & Invariants', () => {
  describe('1. Canonical Communication Surface (CampusChatSheet)', () => {
    it('supports both Campus Chat and 1:1 Direct Messages in on-demand Sheet', () => {
      expect(chatSheetCode).toContain('DirectMessageThread')
      expect(chatSheetCode).toContain('CampusChatDrawer')
      expect(chatSheetCode).toContain('activeConversation')
      expect(chatSheetCode).toContain("type: 'campus'")
      expect(chatSheetCode).toContain("type: 'dm'")
    })

    it('implements responsive 2-column desktop split and mobile drill-down navigation', () => {
      expect(chatSheetCode).toContain("mobileView === 'thread' ? 'hidden sm:flex' : 'flex'")
      expect(chatSheetCode).toContain("mobileView === 'list' ? 'hidden sm:flex' : 'flex'")
      expect(chatSheetCode).toContain('Quay lại danh sách hội thoại')
    })

    it('contains conversation list with search filter and friends presence dots', () => {
      expect(chatSheetCode).toContain('Search')
      expect(chatSheetCode).toContain('friendsFiltered')
      expect(chatSheetCode).toContain('friendsPresence')
      expect(chatSheetCode).toContain('presenceReady')
      expect(chatSheetCode).toContain('bg-emerald-500')
    })
  })

  describe('2. Direct Message Flow & Realtime Data Truth', () => {
    it('uses authoritative D1 backend APIs and CampusDO realtime events', () => {
      expect(dmThreadCode).toContain('layTinNhanRieng')
      expect(dmThreadCode).toContain('guiTinNhanRieng')
      expect(dmThreadCode).toContain('campus:direct_message')
    })

    it('does NOT fabricate attachments, typing status, or fake read receipts', () => {
      expect(dmThreadCode).not.toContain('Đang nhập')
      expect(dmThreadCode).not.toContain('typing')
      expect(dmThreadCode).not.toContain('attachment')
      expect(dmThreadCode).not.toContain('fake')
    })

    it('gates non-friend DM attempts truthfully with friend request action', () => {
      expect(dmThreadCode).toContain('isFriend')
      expect(dmThreadCode).toContain('Hai bạn chưa là bạn bè')
      expect(dmThreadCode).toContain('sendFriendRequest')
    })

    it('provides smart scroll without hijacking whole-window scroll', () => {
      expect(dmThreadCode).toContain('khungRef')
      expect(dmThreadCode).toContain('scrollTop')
      expect(dmThreadCode).not.toContain('scrollIntoView')
    })
  })

  describe('3. FriendsDrawer Consolidation & Purging Fake DM', () => {
    it('has completely purged toy client-only DMPanel and sessionStorage mock storage', () => {
      expect(friendsDrawerCode).not.toContain('DMPanel')
      expect(friendsDrawerCode).not.toContain('layDMTuSession')
      expect(friendsDrawerCode).not.toContain('luuDMVaoSession')
      expect(friendsDrawerCode).not.toContain('sessionStorage.getItem(`dm_')
      expect(friendsDrawerCode).not.toContain('demTinChuaDoc')
    })

    it('routes 1:1 messaging directly to canonical campus:open-dm and closes drawer', () => {
      expect(friendsDrawerCode).toContain("new CustomEvent('campus:open-dm'")
      expect(friendsDrawerCode).toContain('handleOpenChange(false)')
    })

    it('provides clear navigation route to canonical /community Social Hub', () => {
      expect(friendsDrawerCode).toContain("navigate('/community')")
      expect(friendsDrawerCode).toContain('Mở không gian Cộng đồng')
    })

    it('uses truthful badge based strictly on real incomingRequests', () => {
      expect(friendsDrawerCode).toContain('incomingRequests.length')
      expect(friendsDrawerCode).not.toContain('tinChuaDoc')
    })
  })

  describe('4. Global Shell Ownership & Canonical Integration', () => {
    it('AppHeader preserves fast Chat and Notifications access while friends belong to Community', () => {
      expect(appHeaderCode).toContain('data-testid="header-chat-button"')
      expect(appHeaderCode).toContain('<NotificationCenter />')
    })

    it('AppShell listens to campus:open-dm and passes activeDmTarget to CampusChatSheet', () => {
      expect(appShellCode).toContain("window.addEventListener('campus:open-dm'")
      expect(appShellCode).toContain('activeDmTarget')
      expect(appShellCode).toContain('onSelectDmTarget')
      expect(appShellCode).toContain('coTinNhanMoiCampus')
    })

    it('AppShell listens to campus:open-chat and resets to campus chat', () => {
      expect(appShellCode).toContain("window.addEventListener('campus:open-chat'")
      expect(appShellCode).toContain('setActiveDmTarget(null)')
    })
  })

  describe('5. Profile & Community DM Triggers', () => {
    it('HoSoNguoiDungDialog dispatches campus:open-dm with friend details', () => {
      expect(profileDialogCode).toContain("new CustomEvent('campus:open-dm'")
    })

    it('CommunityPage dispatches campus:open-dm with friend details', () => {
      expect(communityCode).toContain("new CustomEvent('campus:open-dm'")
    })
  })
})
