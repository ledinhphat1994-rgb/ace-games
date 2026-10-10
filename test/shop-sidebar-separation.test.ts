import { describe, it, expect } from 'vitest'
import achievementsModalRaw from '../src/features/engagement/AchievementsModal.tsx?raw'
import shopPageRaw from '../src/features/shop/ShopPage.tsx?raw'
import navConfigRaw from '../src/components/layout/navigation-config.ts?raw'
import appSidebarRaw from '../src/components/layout/AppSidebar.tsx?raw'
import mainRaw from '../src/main.tsx?raw'
import { MAIN_NAV_ITEMS } from '../src/components/layout/navigation-config'

describe('Cửa hàng vật phẩm Separation & Sidebar Integration', () => {
  it('1. Vùng 1: Tách Cửa hàng vật phẩm ra khỏi AchievementsModal', () => {
    // AchievementsModal không còn chứa tab hoặc chữ Cửa hàng vật phẩm
    expect(achievementsModalRaw).not.toContain('Cửa hàng vật phẩm')
    expect(achievementsModalRaw).not.toContain('activeTab')
    expect(achievementsModalRaw).not.toContain('selectedShopId')

    // AchievementsModal không còn chứa nút Nạp tiền ngay
    expect(achievementsModalRaw).not.toContain('Nạp tiền ngay')
    // Vẫn giữ nút Thoát ở chân modal
    expect(achievementsModalRaw).toContain('Thoát')
  })

  it('2. Vùng 2: Cửa hàng vật phẩm được ẩn ở bên sidebar theo yêu cầu', () => {
    // MAIN_NAV_ITEMS có item /shop được ẩn (hidden: true)
    expect(MAIN_NAV_ITEMS.find((item) => item.to === '/shop')?.hidden).toBe(true)

    // Các item hiển thị trên sidebar không bao gồm /shop
    const visibleItems = MAIN_NAV_ITEMS.filter((item) => !item.hidden)
    expect(visibleItems.some((item) => item.to === '/shop')).toBe(false)

    // AppSidebar sử dụng MAIN_NAV_ITEMS để render danh sách điều hướng
    expect(appSidebarRaw).toContain('MAIN_NAV_ITEMS')

    // navigation-config khai báo đúng icon ShoppingBag
    expect(navConfigRaw).toContain("to: '/shop'")
    expect(navConfigRaw).toContain("label: 'Cửa hàng vật phẩm'")
  })

  it('3. ShopPage chứa đầy đủ 6 vật phẩm 3D từ Vùng 1 và chức năng Nạp tiền ngay', () => {
    // 6 vật phẩm từ Vùng 1
    expect(shopPageRaw).toContain('Gói Mảnh Tướng')
    expect(shopPageRaw).toContain('Giao diện Tinh tú')
    expect(shopPageRaw).toContain('Hậu vệ Caro Cổ điển')
    expect(shopPageRaw).toContain('Rương Báu Hoàng Kim')
    expect(shopPageRaw).toContain('Vương Miện Quý Tộc')
    expect(shopPageRaw).toContain('Ngai Vàng Chiến Tướng')

    // Nút Nạp tiền ngay
    expect(shopPageRaw).toContain('Nạp tiền ngay')
    expect(shopPageRaw).toContain('cyber-gold-charge-btn')

    // main.tsx có route /shop
    expect(mainRaw).toContain("{ path: 'shop', element: <ShopPage /> }")
  })
})
