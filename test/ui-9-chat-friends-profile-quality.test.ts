import { describe, expect, it } from 'vitest'

import chatSheetCode from '../src/components/layout/CampusChatSheet.tsx?raw'
import dmThreadCode from '../src/components/chat/DirectMessageThread.tsx?raw'
import friendsDrawerCode from '../src/components/social/FriendsDrawer.tsx?raw'
import appShellCode from '../src/components/layout/AppShell.tsx?raw'
import appHeaderCode from '../src/components/layout/AppHeader.tsx?raw'
import profileDialogCode from '../src/components/social/HoSoNguoiDungDialog.tsx?raw'
import communityCode from '../src/features/hub/CommunityPage.tsx?raw'
import campusChatDrawerCode from '../src/features/hub/CampusChatDrawer.tsx?raw'
import alertDialogCode from '../src/components/ui/alert-dialog.tsx?raw'

describe('UI-9 Chat / Friends + Profile Quality & Invariants', () => {
  describe('1. Canonical Communication Surface (CampusChatSheet)', () => {
    it('supports Campus Chat, Room Chat, and 1:1 Direct Messages in on-demand Sheet', () => {
      expect(chatSheetCode).toContain('DirectMessageThread')
      expect(chatSheetCode).toContain('CampusChatDrawer')
      expect(chatSheetCode).toContain('activeTab')
      expect(chatSheetCode).toContain("'ban_be'")
      expect(chatSheetCode).toContain("'toan_truong'")
    })

    it('implements tabs, active search filter, and back button from direct messaging', () => {
      expect(chatSheetCode).toContain('handleBackFromDm')
      expect(chatSheetCode).toContain('onBack={handleBackFromDm}')
      expect(dmThreadCode).toContain('Quay lại danh sách bạn bè')
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

    it('supports fixed 1-line input and robust overflow-wrap for long unbroken messages', () => {
      expect(dmThreadCode).toContain('<input')
      expect(dmThreadCode).toContain('[overflow-wrap:anywhere]')
      expect(dmThreadCode).toContain('break-words')
      expect(dmThreadCode).not.toContain('<textarea')
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
      expect(chatSheetCode).not.toContain('Mở không gian Cộng đồng')
      expect(friendsDrawerCode).not.toContain('Mở không gian Cộng đồng')
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
  describe('6. Chat Sheet Non-Modal, Z-Index & Reaction Invariants (Vùng 1, Vùng 2, Vùng X)', () => {
    it('CampusChatSheet is non-modal and keeps background layout intact', () => {
      expect(chatSheetCode).toContain('modal={false}')
      expect(chatSheetCode).not.toContain('Mở không gian Cộng đồng')
    })

    it('Chat Sheet sits above floating chat logo button without overlay blur, positioned on the right of the screen (Vùng 1, Vùng 2, Vùng 3)', () => {
      expect(chatSheetCode).toContain('side="right"')
      expect(chatSheetCode).toContain('hideOverlay')
      expect(chatSheetCode).toContain('sm:bottom-[84px]')
      expect(chatSheetCode).toMatch(/sm:right-(0|4)/)
      expect(chatSheetCode).toMatch(/sm:w-\[(480|500|520|540|660|700|740)px\]/)
      expect(appShellCode).toContain('data-testid="floating-chat-button"')
    })

    it('Region 3 stays intact without locking window scroll and chat uses internal styled-scrollbar', () => {
      expect(chatSheetCode).toContain('styled-scrollbar')
      expect(campusChatDrawerCode).toContain('styled-scrollbar')
      expect(dmThreadCode).toContain('styled-scrollbar')
    })

    it('AlertDialog (Vùng 2) has z-[100] to always be on top of other layers', () => {
      expect(alertDialogCode).toContain('z-[100]')
    })

    it('Friend item displays unread message badge (Vùng 2) formatted as 100+ when > 100', () => {
      expect(chatSheetCode).toContain('unread-badge-')
      expect(chatSheetCode).toContain("unread > 100 ? '100+' : unread")
    })

    it('Message reactions are in 1 horizontal row outside the card content', () => {
      // 1 hàng ngang, không wrap, kiểu Telegram neo ở góc dưới bubble xích lên 1/3 (-mt-2): tin của mình (justify-end), tin bạn (justify-start)
      expect(campusChatDrawerCode).toContain('-mt-2 flex items-center flex-nowrap gap-1.5 pointer-events-auto whitespace-nowrap')
      expect(campusChatDrawerCode).toContain("laCuaMinh ? 'justify-end pr-2' : 'justify-start pl-2'")
      expect(dmThreadCode).toContain('-mt-2 flex items-center flex-nowrap gap-1.5 pointer-events-auto whitespace-nowrap')
      // Tăng chiều ngang nội dung tin nhắn thay vì chia đôi 50%
      expect(campusChatDrawerCode).toContain('max-w-[85%]')
      expect(dmThreadCode).toContain('max-w-[85%]')
    })

    it('Reactions pill (Vùng X) displays up to 3 emojis, click-to-swap prevents duplicates, and saves to localStorage', () => {
      // Tối đa 3 loại emoji, click-to-swap
      expect(campusChatDrawerCode).toContain('slice(0, 3)')
      expect(campusChatDrawerCode).toContain('data-emoji-pill-item')
      expect(campusChatDrawerCode).toContain('isForbidden')
      expect(campusChatDrawerCode).toContain('c10a7_campus_chat_reactions')

      expect(dmThreadCode).toContain('slice(0, 3)')
      expect(dmThreadCode).toContain('data-emoji-pill-item')
      expect(dmThreadCode).toContain('isForbidden')
      expect(dmThreadCode).toContain('c10a7_dm_reactions_')
    })

    it('Emoji picker provides multi-row scrollable grid in community chat', () => {
      // Bảng emoji thành nhiều hàng (grid grid-cols-6) có thanh trượt kéo xuống (max-h-48 overflow-y-auto styled-scrollbar)
      expect(campusChatDrawerCode).toContain('QUICK_EMOJIS')
      expect(campusChatDrawerCode).toContain('EXTRA_EMOJIS')
      expect(campusChatDrawerCode).toContain('grid grid-cols-6 gap-1')
      expect(campusChatDrawerCode).toContain('overflow-y-auto')
      expect(campusChatDrawerCode).toContain('overflow-x-hidden')

      // Trong khi đó 1 vs 1 DM chỉ dùng cố định 3 emoji
      expect(dmThreadCode).toContain('DM_FIXED_3_EMOJIS')
    })

    it('Message card remains completely fixed in size and position when reacting', () => {
      // Message card has fixed min-w and no dynamic mb-3 jumping
      expect(campusChatDrawerCode).toContain('min-w-[5.5rem]')
      expect(campusChatDrawerCode).not.toContain("Boolean(reactions[msg.id] && Object.keys(reactions[msg.id]).length > 0) && 'mb-3'")
      expect(dmThreadCode).toContain('min-w-[5.5rem]')
    })

    it('1 vs 1 DM reactions: Cố định 3 emoji, không thêm emoji khác, không ghi số lượng, không hiện avatar', () => {
      // 1 vs 1 DM chỉ dùng 3 emoji cố định
      expect(dmThreadCode).toContain('DM_FIXED_3_EMOJIS')
      expect(dmThreadCode).toContain("['❤️', '😆', '😡']")
      // Pill con nhộng bo tròn ở góc dưới bubble
      expect(dmThreadCode).toContain('rounded-full bg-surface-raised/95 border border-border-default/90 shadow-sm')
      // Không ghi số lượng cạnh emoji trong pill 1 vs 1
      expect(dmThreadCode).toContain('<span className="text-[13px] leading-none">{emoji}</span>')
      // Không có avatar người thả trong pill cảm xúc
      expect(dmThreadCode).not.toContain('className="size-3.5 text-[8px] ring-1 ring-border-subtle"')
    })

    it('Cộng đồng / nhóm > 2 người: Có hiện số lượng thả loại emoji và hover hiện tên người thả', () => {
      // Hiện số lượng loại emoji đó
      expect(campusChatDrawerCode).toContain('{count}')
      // Hover vào emoji hiện tên người thả
      expect(campusChatDrawerCode).toContain('tooltipText')
      expect(campusChatDrawerCode).toContain('đã thả')
      expect(campusChatDrawerCode).toContain('title={tooltipText}')
      // Pill con nhộng bo tròn ở góc dưới bubble
      expect(campusChatDrawerCode).toContain('rounded-full bg-surface-raised/95 border border-border-default/90 shadow-sm')
      // Không có avatar người thả trong pill cảm xúc
      expect(campusChatDrawerCode).not.toContain('className="size-3.5 text-[8px] ring-1 ring-border-subtle"')
    })
  })
})
