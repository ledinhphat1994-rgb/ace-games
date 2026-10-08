import { useState } from 'react'
import {
  ShoppingBag,
  Coins,
  Gem,
  Check,
  X,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'
import {
  IconCrown3D,
  IconCaroCubes3D,
  IconManaCrystal3D,
  IconChest3D,
  IconLaurelDiamond3D,
  IconTrophyGold3D,
  IconRankStar3D,
  IconStarSparkle,
} from '@/features/games/GameArt3D'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface ShopItem {
  id: string
  name: string
  price: string
  priceValue: number
  priceType: 'gold' | 'diamond'
  category: 'all' | 'chest' | 'skin' | 'badge' | 'title'
  Icon: React.ComponentType<{ size?: number; className?: string }>
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'chest_shard',
    name: 'Gói Mảnh Tướng',
    price: '1200 Vàng',
    priceValue: 1200,
    priceType: 'gold',
    category: 'chest',
    Icon: IconChest3D,
  },
  {
    id: 'board_galaxy',
    name: 'Giao diện Tinh tú',
    price: '50 Kim cương',
    priceValue: 50,
    priceType: 'diamond',
    category: 'skin',
    Icon: IconManaCrystal3D,
  },
  {
    id: 'caro_classic',
    name: 'Hậu vệ Caro Cổ điển',
    price: '50 Kim cương',
    priceValue: 50,
    priceType: 'diamond',
    category: 'badge',
    Icon: IconCaroCubes3D,
  },
  {
    id: 'chest_gold',
    name: 'Rương Báu Hoàng Kim',
    price: '1200 Vàng',
    priceValue: 1200,
    priceType: 'gold',
    category: 'chest',
    Icon: IconChest3D,
  },
  {
    id: 'crown_royal',
    name: 'Vương Miện Quý Tộc',
    price: '50 Kim cương',
    priceValue: 50,
    priceType: 'diamond',
    category: 'title',
    Icon: IconCrown3D,
  },
  {
    id: 'throne_warlord',
    name: 'Ngai Vàng Chiến Tướng',
    price: '50 Kim cương',
    priceValue: 50,
    priceType: 'diamond',
    category: 'title',
    Icon: IconTrophyGold3D,
  },
  {
    id: 'avatar_frame_stars',
    name: 'Khung Tinh Tú Neon',
    price: '800 Vàng',
    priceValue: 800,
    priceType: 'gold',
    category: 'skin',
    Icon: IconLaurelDiamond3D,
  },
  {
    id: 'warlord_emblem',
    name: 'Huy Hiệu Chiến Thần',
    price: '1500 Vàng',
    priceValue: 1500,
    priceType: 'gold',
    category: 'badge',
    Icon: IconRankStar3D,
  },
]

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'chest', label: 'Rương báu' },
  { id: 'skin', label: 'Giao diện' },
  { id: 'badge', label: 'Bùa hộ mệnh' },
  { id: 'title', label: 'Danh hiệu' },
] as const

export function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedItemId, setSelectedItemId] = useState<string | null>('chest_shard')
  const [userGold] = useState<number>(12450)
  const [userDiamonds] = useState<number>(350)
  const [isRechargeOpen, setIsRechargeOpen] = useState<boolean>(false)
  const [notification, setNotification] = useState<string | null>(null)

  const filteredItems = selectedCategory === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter((item) => item.category === selectedCategory)

  const handleBuy = (item: ShopItem) => {
    setSelectedItemId(item.id)
    setNotification(`Đã chọn vật phẩm: ${item.name}`)
    setTimeout(() => {
      setNotification((curr) => (curr?.includes(item.name) ? null : curr))
    }, 2500)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── 1. Header Banner: Cửa hàng vật phẩm ── */}
      <section className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-[#0b1730] via-[#081226] to-[#040914] p-4 sm:p-6 shadow-xl">
        <BlueprintArcadePattern className="opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 sm:size-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0">
              <ShoppingBag className="size-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Cửa hàng vật phẩm
              </h1>
            </div>
          </div>

          {/* Vùng số dư tiền tệ & Nút Nạp tiền ngay */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Vàng */}
            <div className="h-9 sm:h-10 px-3.5 rounded-full border-2 border-amber-500/30 bg-[#0d1629] flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm shadow-inner">
              <Coins className="size-4 shrink-0 text-amber-400" />
              <span className="tabular-nums">{userGold.toLocaleString('vi-VN')} Vàng</span>
            </div>

            {/* Kim cương */}
            <div className="h-9 sm:h-10 px-3.5 rounded-full border-2 border-sky-500/30 bg-[#0d1629] flex items-center gap-2 text-sky-300 font-black text-xs sm:text-sm shadow-inner">
              <Gem className="size-4 shrink-0 text-sky-400" />
              <span className="tabular-nums">{userDiamonds} Kim cương</span>
            </div>

            {/* Nút Nạp tiền ngay */}
            <button
              type="button"
              onClick={() => setIsRechargeOpen(true)}
              className="cyber-gold-charge-btn rounded-full text-xs sm:text-sm font-black px-5 sm:px-6 h-9 sm:h-10 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_25px_rgba(245,158,11,0.6)] relative overflow-visible shrink-0 transition-transform active:scale-95"
            >
              <span>Nạp tiền ngay</span>
              <IconStarSparkle className="absolute -top-2.5 -right-2 text-amber-200 drop-shadow-[0_0_8px_#fff]" size={18} />
            </button>
          </div>
        </div>

        {/* Thông báo thao tác */}
        {notification && (
          <div className="relative z-10 mt-3 p-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-300 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400 shrink-0" />
              {notification}
            </span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-amber-400 hover:text-white cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* ── 2. Bộ lọc danh mục (Pill tabs) ── */}
      <section className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'h-9 px-4 rounded-xl text-xs font-bold transition-colors duration-150 cursor-pointer shrink-0 border-2',
              selectedCategory === cat.id
                ? 'border-amber-400 bg-amber-400 text-amber-950 font-black shadow-md'
                : 'border-slate-800 bg-[#0d1629] text-slate-300 hover:border-slate-700 hover:text-white',
            )}
          >
            {cat.label}
          </button>
        ))}
      </section>

      {/* ── 3. Lưới các vật phẩm Cửa hàng 3D ── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {filteredItems.map((item) => {
          const ItemIcon = item.Icon
          const isSelected = selectedItemId === item.id
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleBuy(item)}
              className={cn(
                'rounded-2xl border-2 p-3 sm:p-3.5 flex flex-col items-center justify-between text-center min-h-[175px] h-[180px] sm:h-[190px] w-full transition-colors duration-150 relative cursor-pointer select-none overflow-hidden',
                isSelected
                  ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_18px_rgba(245,158,11,0.25)]'
                  : 'border-slate-800 bg-[#0c1527] hover:border-slate-700 hover:bg-[#0f1b33]',
              )}
            >
              {/* Huy hiệu đã chọn */}
              <div
                className={cn(
                  'absolute top-2 right-2 size-5 rounded-full flex items-center justify-center transition-opacity duration-150 z-10',
                  isSelected ? 'bg-amber-400 text-amber-950 opacity-100 shadow-md' : 'opacity-0',
                )}
              >
                <Check className="size-3 stroke-[3]" />
              </div>

              {/* Vùng tiêu đề cố định */}
              <div className="h-7 min-h-7 max-h-7 w-full flex items-center justify-center text-center overflow-hidden shrink-0 px-1">
                <span className="text-xs sm:text-sm font-bold text-white line-clamp-1 leading-tight w-full break-words" title={item.name}>
                  {item.name}
                </span>
              </div>

              {/* Vùng Icon 3D cố định */}
              <div className="h-12 sm:h-14 min-h-12 w-full flex items-center justify-center shrink-0 my-1">
                <ItemIcon size={44} className="drop-shadow-lg sm:w-[50px] sm:h-[50px]" />
              </div>

              {/* Vùng giá cố định */}
              <div className="h-5 min-h-5 max-h-5 w-full flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                {item.priceType === 'gold' ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Coins className="size-3.5" />
                    {item.price}
                  </span>
                ) : (
                  <span className="text-sky-300 flex items-center gap-1">
                    <Gem className="size-3.5 text-sky-400" />
                    {item.price}
                  </span>
                )}
              </div>

              {/* Nút hành động */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation()
                  handleBuy(item)
                }}
                className={cn(
                  'w-full h-7 sm:h-8 min-h-7 sm:min-h-8 rounded-full border text-xs font-bold transition-colors duration-150 cursor-pointer flex items-center justify-center shadow-xs shrink-0',
                  isSelected
                    ? 'border-amber-400 bg-amber-400 text-amber-950 font-black'
                    : 'border-amber-400/60 bg-gradient-to-r from-amber-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 text-amber-200',
                )}
              >
                {isSelected ? 'Đã chọn' : 'Mua bùa'}
              </button>
            </div>
          )
        })}
      </section>

      {/* ── 4. Dialog Nạp tiền ngay (Trong suốt không làm tối xung quanh, Rule 11) ── */}
      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
        <DialogContent className="skeuo-modal-surface sm:max-w-[460px] w-[calc(100vw-2rem)] p-4 sm:p-6 text-white border-2 border-amber-400/40 bg-[#0c1527] shadow-2xl">
          <BlueprintArcadePattern className="opacity-50 pointer-events-none" />
          <DialogHeader className="shrink-0 mb-3">
            <DialogTitle className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="size-5 text-amber-400 shrink-0" />
              <span>Nạp tiền ngay</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Lựa chọn các gói nạp vàng và kim cương
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-2">
            {[
              { id: 'pack_1', name: 'Gói Tân Thủ', reward: '5.000 Vàng + 50 Kim Cương', price: '20.000 đ' },
              { id: 'pack_2', name: 'Gói Sinh Viên', reward: '15.000 Vàng + 180 Kim Cương', price: '50.000 đ' },
              { id: 'pack_3', name: 'Gói Cao Thủ', reward: '35.000 Vàng + 450 Kim Cương', price: '100.000 đ' },
            ].map((pack) => (
              <div
                key={pack.id}
                className="p-3 rounded-xl border-2 border-slate-800 bg-[#091222] hover:border-amber-400/60 transition-colors duration-150 flex items-center justify-between gap-3 cursor-pointer"
                onClick={() => {
                  setNotification(`Đã chọn gói: ${pack.name}`)
                  setIsRechargeOpen(false)
                }}
              >
                <div>
                  <p className="text-sm font-bold text-white">{pack.name}</p>
                  <p className="text-xs text-amber-300 font-semibold mt-0.5">{pack.reward}</p>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-amber-950 font-black text-xs shrink-0 cursor-pointer shadow-xs hover:bg-amber-300 transition-colors"
                >
                  {pack.price}
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800 mt-2">
            <button
              type="button"
              onClick={() => setIsRechargeOpen(false)}
              className="rounded-full text-xs font-semibold px-5 h-8.5 cursor-pointer border border-slate-700 bg-[#162238] hover:bg-[#202f4d] text-slate-200 transition-colors"
            >
              Thoát
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
