import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
  vi,
} from 'vitest'

// expose jest-like shim for any helpers expecting jest
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.fn,
  mockResolvedValue: (value: unknown) => vi.fn().mockResolvedValue(value),
  mockRejectedValue: (value: unknown) => vi.fn().mockRejectedValue(value),
  resetAllMocks: vi.resetAllMocks,
}

export {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
  vi,
}
