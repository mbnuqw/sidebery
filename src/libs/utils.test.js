import Utils from './utils'

describe('Global utilities', () => {
  // Uid
  describe('Uid()', () => {
    test('is 12-length string', () => {
      expect(typeof Utils.Uid()).toBe('string')
      expect(Utils.Uid()).toHaveLength(12)
    })
    test('at least two calls returns different results', () => {
      expect(Utils.Uid()).not.toBe(Utils.Uid())
    })
  })

  // Asap
  describe('Asap()', () => {
    test(`calls cb with spec delay,
        skipping all interlaced calls
        and preserving frequency of calling`, async () => {
      let counter = 0
      const ctx = Utils.Asap(() => counter++, 50)

      ctx.func()
      expect(counter).toBe(0)
      await new Promise(res => setTimeout(res, 51))
      expect(counter).toBe(1)

      ctx.func()
      await new Promise(res => setTimeout(res, 51))
      expect(counter).toBe(2)

      ctx.func()
      await new Promise(res => setTimeout(res, 51))
      expect(counter).toBe(3)
    })
  })

  // Debounce
  describe('Debounce()', () => {
    test(`calls cb with spec delay,
        skipping all interlaced calls
        until timeout end`, async () => {
      let counter = 0
      const ctx = Utils.Debounce(() => counter++, 15)
      ctx.func()
      await new Promise(res => setTimeout(res, 10))
      ctx.func()
      await new Promise(res => setTimeout(res, 10))
      ctx.func()
      expect(counter).toBe(0)

      await new Promise(res => setTimeout(res, 16))
      expect(counter).toBe(1)
    })
    test('calls cb right instantly', async () => {
      let counter = 0
      const ctx = Utils.Debounce(() => counter++, 15, true)
      ctx.func()
      await new Promise(res => setTimeout(res, 10))
      ctx.func()
      await new Promise(res => setTimeout(res, 10))
      ctx.func()
      expect(counter).toBe(1)

      await new Promise(res => setTimeout(res, 16))
      expect(counter).toBe(2)
    })
  })

  // BytesToStr
  describe('BytesToStr()', () => {
    test('print human readable size', () => {
      expect(Utils.BytesToStr(123)).toBe('123 b')
      expect(Utils.BytesToStr(1025)).toBe('1 kb')
      expect(Utils.BytesToStr(123448)).toBe('120.5 kb')
      expect(Utils.BytesToStr(5488685845)).toBe('5.1 gb')
    })
  })

  // StrSize
  describe('StrSize()', () => {
    test('prints estimated size of stirng', () => {
      expect(Utils.StrSize('string')).toBe('6 b')
      expect(Utils.StrSize('строка')).toBe('12 b')
    })
  })

  // GetAllWindows
  describe('StrSize()', () => {
    test('gets all windows and check which current', async () => {
      const windows = await Utils.GetAllWindows()
      expect(windows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 123,
            current: true,
          })
        ])
      )
    })
  })
})
