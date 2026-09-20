import type { SnakeConfig } from './snake-types'

export const DEFAULT_SNAKE_CONFIG: SnakeConfig = Object.freeze({
  width: 15,
  height: 15,
  initialSnake: Object.freeze([
    Object.freeze({ x: 7, y: 7 }),
    Object.freeze({ x: 7, y: 8 }),
    Object.freeze({ x: 7, y: 9 }),
  ]),
  initialDir: 'up',
  initialStepMs: 150,
  speedStepMs: 10,
  minStepMs: 80,
  foodScore: 10,
  speedUpInterval: 5,
})
