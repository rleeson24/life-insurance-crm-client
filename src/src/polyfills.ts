import { Buffer } from 'buffer'

const globalWithShims = globalThis as typeof globalThis & {
  Buffer?: typeof Buffer
  process?: {
    env: { NODE_ENV: string }
    browser: boolean
    version: string
    nextTick: (cb: () => void) => void
  }
}

globalWithShims.Buffer = Buffer
globalWithShims.process ??= {
  env: { NODE_ENV: import.meta.env.MODE },
  browser: true,
  version: 'v18.0.0',
  nextTick: (cb) => queueMicrotask(cb),
}
