import Utils from '../utils'

describe('Global utilities', () => {
  // uid
  describe('uid()', () => {
    test('is 12-length string', () => {
      expect(typeof Utils.uid()).toBe('string')
      expect(Utils.uid()).toHaveLength(12)
    })
    test('at least two calls returns different results', () => {
      expect(Utils.uid()).not.toBe(Utils.uid())
    })
  })

  // asap
  describe('asap()', () => {
    test(`calls cb with spec delay,
        skipping all interlaced calls
        and preserving frequency of calling`, async () => {
      let counter = 0
      const ctx = Utils.asap(() => counter++, 50)

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
  describe('debounce()', () => {
    test(`calls cb with spec delay,
        skipping all interlaced calls
        until timeout end`, async () => {
      let counter = 0
      const ctx = Utils.debounce(() => counter++, 15)
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
      const ctx = Utils.debounce(() => counter++, 15, true)
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

  // bytesToStr
  describe('bytesToStr()', () => {
    test('print human readable size', () => {
      expect(Utils.bytesToStr(123)).toBe('123 b')
      expect(Utils.bytesToStr(1025)).toBe('1 kb')
      expect(Utils.bytesToStr(123448)).toBe('120.5 kb')
      expect(Utils.bytesToStr(5488685845)).toBe('5.1 gb')
    })
  })

  // strSize
  describe('strSize()', () => {
    test('prints estimated size of stirng', () => {
      expect(Utils.strSize('string')).toBe('6 b')
      expect(Utils.strSize('строка')).toBe('12 b')
    })
  })

  // uDate
  describe('uDate()', () => {
    test('Convert unix seconds to readable date format yyyy.mm.dd', async () => {
      const somewhen = new Date('2024/04/04')
      expect(Utils.uDate(somewhen.getTime())).toBe('2024.04.04')
    })
  })

  // uTime
  describe('uTime()', () => {
    test('Convert unix seconds to readable time format hr:min:sec', async () => {
      const somewhen = new Date('2024/04/04 15:24')
      expect(Utils.uTime(somewhen.getTime())).toBe('15:24:00')
    })
  })

  // commonSubStr
  describe('commonSubStr()', () => {
    test('Find common part of strings', () => {
      const strings = ['Just some stringA', 'another StriNg', '__STRING__']
      const common = Utils.commonSubStr(strings)
      expect(common).toBe('string')

      const a = ['Just some string', 'another StriNg', 'STRING__']
      const commona = Utils.commonSubStr(a)
      expect(commona).toBe('string')

      const noStrings = []
      const common1 = Utils.commonSubStr(noStrings)
      expect(common1).toBe('')

      const one = ['just one']
      const common2 = Utils.commonSubStr(one)
      expect(common2).toBe('just one')
    })
  })
})
