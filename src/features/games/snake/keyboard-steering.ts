export function snakeKeyAngle(code: string): number | null {
  switch (code) {
    case 'ArrowUp': case 'KeyW': return -Math.PI / 2
    case 'ArrowDown': case 'KeyS': return Math.PI / 2
    case 'ArrowLeft': case 'KeyA': return Math.PI
    case 'ArrowRight': case 'KeyD': return 0
    default: return null
  }
}
