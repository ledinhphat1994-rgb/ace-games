import { describe, expect, it } from 'vitest'

async function benchmark(iterations: number): Promise<number> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode('SyntheticBenchmarkPassword@2026'),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const salt = new Uint8Array(16)
  const start = performance.now()
  await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    256,
  )
  return performance.now() - start
}

describe('PBKDF2-HMAC-SHA256 Work Factor Benchmark (workerd runtime)', () => {
  it('measures 100k, 200k, 300k, 600k execution times', async () => {
    // Warmup
    await benchmark(10000)

    const samples = {
      '100k': [] as number[],
      '200k': [] as number[],
      '300k': [] as number[],
      '600k': [] as number[],
    }

    // Run 3 iterations each for stable average
    for (let i = 0; i < 3; i++) {
      samples['100k'].push(await benchmark(100000))
      samples['200k'].push(await benchmark(200000))
      samples['300k'].push(await benchmark(300000))
      samples['600k'].push(await benchmark(600000))
    }

    const avg = (arr: number[]) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)

    console.log('--- PBKDF2 BENCHMARK IN WORKERD RUNTIME ---')
    console.log(`100,000 iterations: avg ${avg(samples['100k'])} ms (samples: ${samples['100k'].map((n) => n.toFixed(1)).join(', ')} ms)`)
    console.log(`200,000 iterations: avg ${avg(samples['200k'])} ms (samples: ${samples['200k'].map((n) => n.toFixed(1)).join(', ')} ms)`)
    console.log(`300,000 iterations: avg ${avg(samples['300k'])} ms (samples: ${samples['300k'].map((n) => n.toFixed(1)).join(', ')} ms)`)
    console.log(`600,000 iterations: avg ${avg(samples['600k'])} ms (samples: ${samples['600k'].map((n) => n.toFixed(1)).join(', ')} ms)`)

    expect(Number(avg(samples['100k']))).toBeGreaterThan(0)
  }, 60000)
})
