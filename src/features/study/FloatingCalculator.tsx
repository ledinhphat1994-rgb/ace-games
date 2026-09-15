import { Calculator as CalcIcon, Delete, GripHorizontal, History, Minimize2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface FloatingCalculatorProps {
  zIndex: number
  onFocus: () => void
  onClose: () => void
}

export function FloatingCalculator({ zIndex, onFocus, onClose }: FloatingCalculatorProps) {
  const [position, setPosition] = useState({ x: 60, y: 370 })
  const [isDragging, setIsDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const dragRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 })

  const [bieuThuc, setBieuThuc] = useState('')
  const [ketQua, setKetQua] = useState<string | null>(null)
  const [lichSu, setLichSu] = useState<string[]>([])
  const [hienLichSu, setHienLichSu] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    onFocus()
    setIsDragging(true)
    dragRef.current = { mouseX: e.clientX, mouseY: e.clientY, startX: position.x, startY: position.y }
  }

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!isDragging) return
      setPosition({
        x: Math.max(0, dragRef.current.startX + e.clientX - dragRef.current.mouseX),
        y: Math.max(0, dragRef.current.startY + e.clientY - dragRef.current.mouseY),
      })
    }
    const up = () => { if (isDragging) setIsDragging(false) }
    if (isDragging) {
      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', up)
    }
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [isDragging])

  const nhapKyTu = (ky: string) => setBieuThuc(prev => prev + ky)
  const xoaKyTu = () => setBieuThuc(prev => prev.slice(0, -1))
  const xoaHet = () => { setBieuThuc(''); setKetQua(null) }

  const tinhToan = () => {
    const expr = bieuThuc.trim()
    if (!expr) return
    try {
      const s = expr
        .replace(/×/g, '*').replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI').replace(/e(?![a-z])/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(').replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(').replace(/ln\(/g, 'Math.log(')
        .replace(/\^/g, '**')
      if (/[^0-9+\-*/().MathPIEsqrtlontancossin,\s]/.test(s)) { setKetQua('Lỗi biểu thức'); return }
      // eslint-disable-next-line no-new-func
      const res = Number(new Function(`return (${s})`)())
      if (!Number.isFinite(res)) { setKetQua('Không xác định'); return }
      const rounded = Math.round(res * 1e8) / 1e8
      setKetQua(String(rounded))
      setLichSu(prev => [`${expr} = ${rounded}`, ...prev.slice(0, 9)])
    } catch {
      setKetQua('Lỗi cú pháp')
    }
  }

  if (isMinimized) {
    return (
      <div
        style={{ left: position.x, top: position.y, zIndex }}
        className="absolute flex items-center gap-2 rounded-full border border-cyan-500/30 bg-[#0d1424]/95 px-3 py-1.5 shadow-xl backdrop-blur-xl ring-1 ring-cyan-500/20 cursor-move"
        onMouseDown={handleMouseDown}
        onClick={onFocus}
      >
        <GripHorizontal className="h-3.5 w-3.5 text-slate-500" />
        <CalcIcon className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-semibold text-slate-200">Máy tính FX</span>
        {ketQua !== null && (
          <span className="text-[10px] font-mono text-cyan-300 max-w-[80px] truncate">= {ketQua}</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); setIsMinimized(false) }} className="rounded p-0.5 text-slate-400 hover:text-white">
          <CalcIcon className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onClose() }} className="rounded p-0.5 text-slate-400 hover:text-red-400">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ left: position.x, top: position.y, width: 320, zIndex }}
      className="absolute flex flex-col overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#090e18]/97 shadow-2xl backdrop-blur-2xl ring-1 ring-cyan-500/15"
      onClick={onFocus}
    >
      {/* Title bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex h-9 shrink-0 cursor-move items-center justify-between border-b border-white/10 bg-white/5 px-3 select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <CalcIcon className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200">Máy tính Khoa học FX</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setHienLichSu(v => !v)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white"
          >
            <History className="h-3 w-3" />
            {hienLichSu ? 'Bàn phím' : 'Lịch sử'}
          </button>
          <button onClick={() => setIsMinimized(true)} className="rounded p-1 text-slate-400 hover:text-white">
            <Minimize2 className="h-3 w-3" />
          </button>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-red-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3">
        {hienLichSu ? (
          <div className="flex h-64 flex-col space-y-1.5 overflow-y-auto text-xs">
            {lichSu.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500">Chưa có phép tính nào.</div>
            ) : (
              lichSu.map((item, i) => (
                <button
                  key={i}
                  onClick={() => { setBieuThuc(item.split(' = ')[0]); setHienLichSu(false) }}
                  className="rounded-lg border border-white/5 bg-white/5 p-2 font-mono text-left text-slate-300 hover:bg-white/10 transition-colors"
                >
                  {item}
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Display */}
            <div className="flex min-h-16 flex-col justify-end rounded-xl border border-white/10 bg-black/50 p-3 text-right">
              <div className="overflow-x-auto font-mono text-xs text-slate-500">{bieuThuc || '0'}</div>
              <div className="truncate font-mono text-lg font-bold text-cyan-400">
                {ketQua !== null ? `= ${ketQua}` : ''}
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-5 gap-1 text-xs font-semibold">
              {[
                { label: 'sin', action: () => nhapKyTu('sin('), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
                { label: 'cos', action: () => nhapKyTu('cos('), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
                { label: 'tan', action: () => nhapKyTu('tan('), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
                { label: 'π', action: () => nhapKyTu('π'), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
                { label: 'AC', action: xoaHet, cls: 'bg-red-700/70 text-white hover:bg-red-600' },
                { label: '√', action: () => nhapKyTu('sqrt('), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
                { label: 'x^y', action: () => nhapKyTu('^'), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
                { label: '(', action: () => nhapKyTu('('), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
                { label: ')', action: () => nhapKyTu(')'), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
                { label: '⌫', action: xoaKyTu, cls: 'bg-white/5 text-slate-300 hover:bg-white/10', icon: <Delete className="h-3.5 w-3.5 mx-auto" /> },
                { label: '7', action: () => nhapKyTu('7'), cls: 'bg-white/8 text-white hover:bg-white/15' },
                { label: '8', action: () => nhapKyTu('8'), cls: 'bg-white/8 text-white hover:bg-white/15' },
                { label: '9', action: () => nhapKyTu('9'), cls: 'bg-white/8 text-white hover:bg-white/15' },
                { label: '÷', action: () => nhapKyTu('÷'), cls: 'bg-cyan-900/60 text-cyan-300 hover:bg-cyan-800/60' },
                { label: 'log', action: () => nhapKyTu('log('), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
                { label: '4', action: () => nhapKyTu('4'), cls: 'bg-white/8 text-white hover:bg-white/15' },
                { label: '5', action: () => nhapKyTu('5'), cls: 'bg-white/8 text-white hover:bg-white/15' },
                { label: '6', action: () => nhapKyTu('6'), cls: 'bg-white/8 text-white hover:bg-white/15' },
                { label: '×', action: () => nhapKyTu('×'), cls: 'bg-cyan-900/60 text-cyan-300 hover:bg-cyan-800/60' },
                { label: 'ln', action: () => nhapKyTu('ln('), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
                { label: '1', action: () => nhapKyTu('1'), cls: 'bg-white/8 text-white hover:bg-white/15' },
                { label: '2', action: () => nhapKyTu('2'), cls: 'bg-white/8 text-white hover:bg-white/15' },
                { label: '3', action: () => nhapKyTu('3'), cls: 'bg-white/8 text-white hover:bg-white/15' },
                { label: '-', action: () => nhapKyTu('-'), cls: 'bg-cyan-900/60 text-cyan-300 hover:bg-cyan-800/60' },
                { label: 'e', action: () => nhapKyTu('e'), cls: 'bg-white/5 text-slate-300 hover:bg-white/10' },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className={`flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${btn.cls}`}
                >
                  {btn.icon ?? btn.label}
                </button>
              ))}

              <button onClick={() => nhapKyTu('0')} className="h-9 rounded-lg bg-white/8 text-xs font-semibold text-white hover:bg-white/15 transition-colors">0</button>
              <button onClick={() => nhapKyTu('.')} className="h-9 rounded-lg bg-white/8 text-xs font-semibold text-white hover:bg-white/15 transition-colors">.</button>
              <button onClick={tinhToan} className="col-span-2 h-9 rounded-lg bg-cyan-600 text-sm font-bold text-white hover:bg-cyan-500 transition-colors">=</button>
              <button onClick={() => nhapKyTu('+')} className="h-9 rounded-lg bg-cyan-900/60 text-xs font-semibold text-cyan-300 hover:bg-cyan-800/60 transition-colors">+</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
