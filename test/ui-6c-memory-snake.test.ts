import { describe, expect, it } from 'vitest'
import { tinhDiemKetThucMemory } from '../src/features/games/memory/memoryScore'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'
import soloPageRaw from '../src/features/games/SoloGamePage.tsx?raw'
import soloStageRaw from '../src/features/games/SoloGameStage.tsx?raw'
import snakeDuelRaw from '../src/features/games/snake/SnakeDuel.tsx?raw'
import snakeDeluxeRaw from '../src/features/games/snake/SnakeDeluxe.tsx?raw'
import controllerRaw from '../src/features/games/snake/SnakeGameController.ts?raw'

describe('UI-6C: Solo Game Page Isolation & Architecture', () => {
  it('SoloGamePage does not render embedded leaderboard, social sidebar, or floating activity utility', () => {
    expect(soloPageRaw).not.toContain('GameArenaLeaderboard')
    expect(soloPageRaw).not.toContain('GameSocialSidebar')
    expect(soloPageRaw).not.toContain('ResponsiveActivityLayout')
    expect(soloPageRaw).not.toContain('utilityMode')
    expect(soloPageRaw).toContain('SoloGameStage')
  })

  it('SoloGamePage preserves score saving, query invalidation, and onSnakeSettled', () => {
    expect(soloPageRaw).toContain("invalidateQueries({ queryKey: ['game-highscores', gameType] })")
    expect(soloPageRaw).toContain("fetch('/api/game/highscore'")
    expect(soloPageRaw).toContain('onSnakeSettled={lamMoiBangXepHang}')
  })

  it('GamePlayToolbar hides room chat and rankings for both Memory and Snake', () => {
    expect(memoryRaw).toContain('showRoomChat={false}')
    expect(memoryRaw).toContain('showRankings={false}')
    expect(snakeDuelRaw).toContain('showRoomChat={false}')
    expect(snakeDuelRaw).toContain('showRankings={false}')
    expect(snakeDeluxeRaw).toContain('showRoomChat={false}')
    expect(snakeDeluxeRaw).toContain('showRankings={false}')
  })
})

describe('UI-6C: Memory Game Experience', () => {
  it('protects PvE (player vs AI) and PvP (pass-and-play) modes', () => {
    expect(memoryRaw).toContain("mode === 'pve' ? 'ai' : 'pass_and_play'")
    expect(memoryRaw).toContain("setMode(m === 'ai' ? 'pve' : 'pvp')")
    expect(memoryRaw).toContain("difficulty")
    expect(memoryRaw).toContain("easy")
    expect(memoryRaw).toContain("medium")
    expect(memoryRaw).toContain("hard")
    // Memory PvP is local / pass-and-play, never online
    expect(memoryRaw).not.toContain('online')
    expect(memoryRaw).not.toContain('matchmaking')
  })

  it('cards use accessible <button type="button"> with keyboard and focus support', () => {
    expect(memoryRaw).toContain('<button')
    expect(memoryRaw).toContain('type="button"')
    expect(memoryRaw).toContain('disabled={isDisabled}')
    expect(memoryRaw).toContain('focus-visible:ring-2')
  })

  it('hidden cards do not leak symbol or secret label via aria-label', () => {
    expect(memoryRaw).toContain('Thẻ chưa lật, vị trí ${idx + 1}')
    expect(memoryRaw).toContain('Thẻ đã ghép: ${card.label}')
    expect(memoryRaw).toContain('Thẻ đã lật: ${card.label}')
  })

  it('disabled conditions prevent selecting matched, locked, or AI turn cards', () => {
    expect(memoryRaw).toContain('isLocked ||')
    expect(memoryRaw).toContain('isAiThinking ||')
    expect(memoryRaw).toContain('isAiTurn ||')
    expect(memoryRaw).toContain('isFlipped ||')
    expect(memoryRaw).toContain('isMatched ||')
  })

  it('preserves score submission on completion and surrender modal flow', () => {
    expect(memoryRaw).toContain('onSaveScore(finalScore)')
    expect(memoryRaw).toContain('GameSurrenderModal')
    expect(memoryRaw).toContain('surrenderAttempts')
  })

  it('memory board dominates without permanent empty left/right columns', () => {
    expect(memoryRaw).not.toContain('GameStatusWidget')
    expect(memoryRaw).toContain('aspect-square')
    expect(memoryRaw).toContain('grid-cols-4')
  })

  describe('deterministic final pair completion score calculation', () => {
    it('Case A: 3-4 + final pair by Player 1 => 4-4 DRAW', () => {
      const result = tinhDiemKetThucMemory(3, 4, 1)
      expect(result.finalScore1).toBe(4)
      expect(result.finalScore2).toBe(4)
      expect(result.finalScore1 === result.finalScore2).toBe(true)
    })

    it('Case B: 4-3 + final pair by Player 1 => 5-3 Player 1 win', () => {
      const result = tinhDiemKetThucMemory(4, 3, 1)
      expect(result.finalScore1).toBe(5)
      expect(result.finalScore2).toBe(3)
      expect(result.finalScore1 > result.finalScore2).toBe(true)
    })

    it('Case C: 3-4 + final pair by Player 2 => 3-5 Player 2 win', () => {
      const result = tinhDiemKetThucMemory(3, 4, 2)
      expect(result.finalScore1).toBe(3)
      expect(result.finalScore2).toBe(5)
      expect(result.finalScore2 > result.finalScore1).toBe(true)
    })

    it('Case D: Exactly ONE point is added for the final matched pair', () => {
      // For Player 1 turn
      const res1 = tinhDiemKetThucMemory(2, 5, 1)
      expect(res1.finalScore1).toBe(3)
      expect(res1.finalScore2).toBe(5)
      expect((res1.finalScore1 + res1.finalScore2) - (2 + 5)).toBe(1)

      // For Player 2 turn
      const res2 = tinhDiemKetThucMemory(2, 5, 2)
      expect(res2.finalScore1).toBe(2)
      expect(res2.finalScore2).toBe(6)
      expect((res2.finalScore1 + res2.finalScore2) - (2 + 5)).toBe(1)
    })

    it('Case E: onSaveScore remains called once at completion with move-based formula', () => {
      expect(memoryRaw).toContain('if (newMatched.length === cards.length)')
      expect(memoryRaw).toContain('if (onSaveScore)')
      expect(memoryRaw).toContain('const finalScore = Math.max(10, 1000 - (totalMoves + 1) * 25)')
      expect(memoryRaw).toContain('onSaveScore(finalScore)')
      const onSaveMatches = memoryRaw.match(/onSaveScore\(/g)
      expect(onSaveMatches?.length).toBe(1)
    })
  })
})

describe('UI-6C: Snake Game Experience (Duel & Classic)', () => {
  it('preserves two real modes: Đối kháng (Wormate3D) and Cổ điển (SnakeDeluxe / Phaser)', () => {
    expect(soloStageRaw).toContain("snakeTab === 'classic'")
    expect(soloStageRaw).toContain('<SnakeDeluxe')
    expect(soloStageRaw).toContain('<SnakeDuel')
  })

  it('both modes share a single coherent mode switch and canonical back action', () => {
    expect(snakeDuelRaw).toContain('onTabChange')
    expect(snakeDeluxeRaw).toContain('onTabChange')
    expect(snakeDuelRaw).toContain('Đối kháng')
    expect(snakeDuelRaw).toContain('Cổ điển')
    expect(snakeDeluxeRaw).toContain('Đối kháng')
    expect(snakeDeluxeRaw).toContain('Cổ điển')
    // No duplicate back button in SoloGameStage
    expect(soloStageRaw).not.toContain('Quay lại sảnh')
  })

  it('Snake Duel has single canonical start action: overlay when idle, toolbar Replay when running', () => {
    expect(snakeDuelRaw).toContain('hideReset={!isRunning}')
    expect(snakeDuelRaw).toContain("resetLabel={isGameOver ? 'Ván mới' : isRunning ? 'Chơi lại' : 'Bắt đầu'}")
  })

  it('Snake Classic has single canonical start action in toolbar, non-interactive instructions in canvas', () => {
    expect(snakeDeluxeRaw).toContain('onReset={startGame}')
    expect(snakeDeluxeRaw).toContain("resetLabel={engineLoading ? 'Đang tải…' : isDead || isPlaying ? 'Chơi lại' : 'Bắt đầu'}")
    expect(snakeDeluxeRaw).toContain('select-none pointer-events-none')
  })

  it('Snake Classic preserves server verification states and semantics', () => {
    expect(snakeDeluxeRaw).toContain("'verified'")
    expect(snakeDeluxeRaw).toContain("'verifying'")
    expect(snakeDeluxeRaw).toContain("'unverified'")
    expect(snakeDeluxeRaw).toContain("'practice'")
    expect(snakeDeluxeRaw).toContain('Đã xác thực')
    expect(snakeDeluxeRaw).toContain('Đang xác thực…')
    expect(snakeDeluxeRaw).toContain('Không xác thực được')
  })

  it('Snake Classic preserves controller lifecycle, visibility abort, touch-action none, and DPad', () => {
    expect(snakeDeluxeRaw).toContain("visibilitychange")
    expect(snakeDeluxeRaw).toContain("handleVisibilityChange(document.hidden)")
    expect(snakeDeluxeRaw).toContain("controllerRef.current?.destroy()")
    expect(snakeDeluxeRaw).toContain("touchAction: 'none'")
    expect(snakeDeluxeRaw).toContain("<DPad onDir={handleTurn}")
  })

  it('SnakeGameController preserves server verification and input trace invariants', () => {
    expect(controllerRaw).toContain('CampusGameSDK')
    expect(controllerRaw).toContain("sdk.end('game_over'")
    expect(controllerRaw).toContain("this.onStatusChange?.('verifying', null)")
    expect(controllerRaw).toContain("this.onStatusChange?.('verified', finishRes.finalScore)")
  })
})
