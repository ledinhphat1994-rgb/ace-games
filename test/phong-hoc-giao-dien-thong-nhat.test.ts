// Giao diện phòng học thống nhất: một bảng màu nền của hệ thống (canvas · surface · surface-raised) thay cho hơn mười mã màu
// rời rạc, một tông nhấn (brand), cụm [video + chat] ôm 16:9 căn giữa, dải người tham gia chỉ hiện tên.
import { describe, expect, it } from 'vitest'
import stripRaw from '../src/features/study/workspace/MemberStrip.tsx?raw'
import stageRaw from '../src/features/study/workspace/PresentationStage.tsx?raw'
import docRaw from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import boardRaw from '../src/features/study/workspace/BangVe.tsx?raw'
import videoRaw from '../src/features/study/workspace/EmbeddedVideoPlayer.tsx?raw'
import workspaceRaw from '../src/features/study/workspace/ClassroomWorkspace.tsx?raw'
import dockRaw from '../src/features/study/workspace/ClassroomToolDock.tsx?raw'
import panelRaw from '../src/features/study/workspace/ClassroomContextPanel.tsx?raw'
import topBarRaw from '../src/features/study/workspace/ClassroomTopBar.tsx?raw'
import tooltipRaw from '../src/components/ui/tooltip.tsx?raw'

const MA_MAU_RIENG = ['#070b14', '#090e18', '#090d16', '#0a1611', '#0d1c16', '#070b12', '#060a12']

describe('Bảng màu nền phòng học', () => {
  it('không còn mã màu nền rời rạc trong sân khấu, tài liệu, bảng, video, khung chat, thanh công cụ', () => {
    const cacTep = { stageRaw, docRaw, boardRaw, videoRaw, workspaceRaw, dockRaw, panelRaw, topBarRaw, stripRaw }
    for (const [ten, raw] of Object.entries(cacTep)) {
      for (const ma of MA_MAU_RIENG) expect(raw, `${ten} còn ${ma}`).not.toContain(ma)
    }
  })

  it('sân khấu, chat, tiêu đề tài liệu / bảng / video cùng một mặt (surface); nền giếng nội dung là canvas', () => {
    expect(stageRaw).toContain('flex flex-col overflow-hidden bg-surface')
    expect(stageRaw).toContain('bg-canvas" data-testid="whiteboard-stage"')
    expect(panelRaw).toContain('bg-surface')
    expect(docRaw).toContain('bg-canvas overflow-hidden flex items-center justify-center')
    expect(boardRaw).toContain("'bg-canvas'")
    expect(boardRaw).toContain('className="fill-canvas"')
    expect(workspaceRaw).toContain('bg-canvas text-slate-100')
    expect(topBarRaw).toContain('bg-canvas px-2')
    expect(topBarRaw).not.toContain('backdrop-blur')
  })

  it('thanh công cụ: một tông nhấn brand cho mục đang chọn, không còn màu riêng ba lớp; khay nổi dùng surface-raised', () => {
    expect(dockRaw).not.toContain('MAU_NHAN')
    expect(dockRaw).not.toContain('text-orange-400')
    expect(dockRaw).toContain("const dangChon = 'bg-brand/12 text-brand ring-1 ring-brand/30'")
    expect(dockRaw).toContain('bg-surface-raised')
    expect(dockRaw).toContain('border border-border-default bg-surface/95')
  })
})

describe('Bố cục không gian trình chiếu', () => {
  it('chiếu video: khung ôm 16:9 theo chiều cao rồi cả cụm [video + chat] căn giữa (cột container chỉ từ sm, ngăn kéo chat di động là fixed)', () => {
    expect(workspaceRaw).toContain("const videoChinh = boCuc.video === 'main' && Boolean(videoId) && !isFullscreen")
    expect(workspaceRaw).toContain("videoChinh ? 'justify-center sm:[container-type:size]' : ''")
    expect(workspaceRaw).toContain("videoChinh ? 'sm:max-w-[calc(100cqh*16/9)]' : ''")
  })

  it('một lề duy nhất giữa thanh trên, khung sân khấu và khung chat', () => {
    expect(workspaceRaw).toContain('gap-2 overflow-hidden px-2 sm:gap-3 sm:px-3')
    expect(topBarRaw).toContain('px-2 py-1 select-none sm:px-3')
  })
})

describe('Dải người tham gia chỉ hiện tên', () => {
  it('rê chuột hiện đúng tên (tooltip ngoài dải nên không bị cắt); bỏ chú thích quyền chi tiết', () => {
    expect(stripRaw).toContain('<TooltipContent side="bottom" sideOffset={8} arrow={false}')
    expect(stripRaw).toMatch(/\{m\.ten\}\s*<\/TooltipContent>/)
    for (const cu of ['Toàn quyền điều khiển', 'Chỉ xem', 'Quyền được chủ phòng cấp', 'tieuDeTooltip', 'cardQuyen', 'Đã được cấp quyền']) {
      expect(stripRaw, cu).not.toContain(cu)
    }
    expect(tooltipRaw).toContain('arrow = true')
    expect(tooltipRaw).toContain('{arrow && <TooltipPrimitive.Arrow')
  })
})
