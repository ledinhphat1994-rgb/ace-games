/**
 * Tính toán điểm số kết thúc ván đấu Trí Nhớ (Memory).
 * Dựa trên điểm trước khi bắt đầu lượt lật thẻ cuối cùng và người chơi lật cặp thẻ cuối.
 */
export function tinhDiemKetThucMemory(
  score1BeforeTurn: number,
  score2BeforeTurn: number,
  activeTurn: 1 | 2,
): { finalScore1: number; finalScore2: number } {
  return {
    finalScore1: score1BeforeTurn + (activeTurn === 1 ? 1 : 0),
    finalScore2: score2BeforeTurn + (activeTurn === 2 ? 1 : 0),
  }
}
