import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calculator as CalcIcon, Delete, History } from 'lucide-react'
import { useState } from 'react'

interface StudyCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudyCalculatorModal({ open, onOpenChange }: StudyCalculatorModalProps) {
  const [bieuThuc, setBieuThuc] = useState('')
  const [ketQua, setKetQua] = useState<string | null>(null)
  const [lichSu, setLichSu] = useState<string[]>([])
  const [hienLichSu, setHienLichSu] = useState(false)

  const nhapKyTu = (kyTu: string) => {
    setBieuThuc((prev) => prev + kyTu)
  }

  const xoaKyTu = () => {
    setBieuThuc((prev) => prev.slice(0, -1))
  }

  const xoaHet = () => {
    setBieuThuc('')
    setKetQua(null)
  }

  const tinhToan = () => {
    const expr = bieuThuc.trim()
    if (!expr) return

    try {
      // Thay thế các hàm khoa học an toàn
      const sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e(?![a-z])/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/\^/g, '**')

      // Kiểm tra ký tự an toàn trước khi eval
      if (/[^0-9+\-*/().MathPIEsqrtlontancossin,\s]/.test(sanitized)) {
        setKetQua('Lỗi biểu thức')
        return
      }

      // eslint-disable-next-line no-new-func
      const fn = new Function(`return (${sanitized})`)
      const res = Number(fn())

      if (!Number.isFinite(res)) {
        setKetQua('Không xác định')
      } else {
        const rounded = Math.round(res * 1e8) / 1e8
        setKetQua(String(rounded))
        setLichSu((prev) => [`${expr} = ${rounded}`, ...prev.slice(0, 9)])
      }
    } catch {
      setKetQua('Lỗi cú pháp')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/80 bg-card p-5 text-foreground shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
            <CalcIcon className="h-4 w-4 text-cyan-400" />
            Máy tính Khoa học FX
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setHienLichSu((prev) => !prev)}
          >
            <History className="mr-1 h-3.5 w-3.5" />
            {hienLichSu ? 'Bàn phím' : 'Lịch sử'}
          </Button>
        </DialogHeader>

        {hienLichSu ? (
          <div className="flex h-72 flex-col space-y-2 overflow-y-auto p-2 text-xs">
            {lichSu.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Chưa có phép tính nào trong lịch sử.
              </div>
            ) : (
              lichSu.map((item, i) => (
                <div key={i} className="rounded-lg border border-border/40 bg-muted/30 p-2 font-mono">
                  {item}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {/* Màn hình hiển thị kết quả */}
            <div className="flex min-h-20 flex-col justify-end rounded-xl border border-border/70 bg-muted/40 p-3 text-right">
              <div className="overflow-x-auto font-mono text-xs text-muted-foreground">
                {bieuThuc || '0'}
              </div>
              <div className="truncate font-mono text-xl font-bold text-cyan-400">
                {ketQua !== null ? `= ${ketQua}` : ''}
              </div>
            </div>

            {/* Bàn phím máy tính */}
            <div className="grid grid-cols-5 gap-1.5 text-xs font-semibold">
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('sin(')}>sin</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('cos(')}>cos</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('tan(')}>tan</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('π')}>π</Button>
              <Button variant="destructive" size="sm" className="h-9 text-xs" onClick={xoaHet}>AC</Button>

              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('sqrt(')}>√</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('^')}>x^y</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('(')}>(</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu(')')}>)</Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={xoaKyTu}><Delete className="h-4 w-4" /></Button>

              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('7')}>7</Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('8')}>8</Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('9')}>9</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs text-cyan-400" onClick={() => nhapKyTu('÷')}>÷</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('log(')}>log</Button>

              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('4')}>4</Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('5')}>5</Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('6')}>6</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs text-cyan-400" onClick={() => nhapKyTu('×')}>×</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('ln(')}>ln</Button>

              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('1')}>1</Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('2')}>2</Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('3')}>3</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs text-cyan-400" onClick={() => nhapKyTu('-')}>-</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('e')}>e</Button>

              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('0')}>0</Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => nhapKyTu('.')}>.</Button>
              <Button variant="default" size="sm" className="col-span-2 h-9 bg-cyan-600 font-bold hover:bg-cyan-500" onClick={tinhToan}>=</Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs text-cyan-400" onClick={() => nhapKyTu('+')}>+</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
