import Utils from './utils'
import { Locales } from './mixins/dict'

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
      expect(Utils.uDate(~~(somewhen.getTime() / 1000))).toBe('2024.04.04')
    })
  })

  // uTime
  describe('uTime()', () => {
    test('Convert unix seconds to readable time format hr:min:sec', async () => {
      const somewhen = new Date('2024/04/04 15:24')
      expect(Utils.uTime(~~(somewhen.getTime() / 1000))).toBe('15:24:00')
    })
  })

  // uElapsed
  describe('uElapsed()', () => {
    test('Get elapsed time string from unix seconds', async () => {
      Locales['en']['elapsed.now'] = { message: 'a' }
      Locales['en']['elapsed.min'] = { message: 'b' }
      Locales['en']['elapsed.hr'] = { message: 'c' }
      Locales['en']['elapsed.day'] = { message: 'd' }
      Locales['en']['elapsed.week'] = { message: 'e' }
      Locales['en']['elapsed.month'] = { message: 'f' }
      Locales['en']['elapsed.year'] = { message: 'y' }

      expect(Utils.uElapsed(10, 15)).toBe('a')
      expect(Utils.uElapsed(10, 95)).toBe('1 b')
      expect(Utils.uElapsed(10, 7500)).toBe('2 c')
      expect(Utils.uElapsed(10, 320000)).toBe('3 d')
      expect(Utils.uElapsed(10, 2000000)).toBe('3 e')
      expect(Utils.uElapsed(10, 36000000)).toBe('1 y')
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
