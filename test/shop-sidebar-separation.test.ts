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

  it('2. Vùng 2: Cửa hàng vật phẩm nằm ở cuối danh sách sidebar', () => {
    // MAIN_NAV_ITEMS có item cuối cùng là /shop với label 'Cửa hàng vật phẩm'
    const visibleItems = MAIN_NAV_ITEMS.filter((item) => !item.hidden)
    const lastItem = visibleItems[visibleItems.length - 1]

    expect(lastItem.to).toBe('/shop')
    expect(lastItem.label).toBe('Cửa hàng vật phẩm')
    expect(lastItem.shortLabel).toBe('Cửa hàng')

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
