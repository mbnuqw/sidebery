import Utils from './utils'
import { Locales } from '../mixins/dict'

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

  // GetPanelIndex
  describe('GetPanelIndex()', () => {
    test('Get panel index by tab id', async () => {
      const panels = [
        {
          tabs: [{ id: 1 }, { id: 12 }]
        },
        {
          tabs: [{ id: 8 }, { id: 2 }]
        },
      ]
      expect(Utils.GetPanelIndex(panels, 1)).toBe(0)
      expect(Utils.GetPanelIndex(panels, 8)).toBe(1)
    })
  })

  // GetPanelOf
  describe('GetPanelOf()', () => {
    test('Get panel by tab', async () => {
      const panels = [
        {},
        {
          pinned: true,
          tabs: [
            { cookieStoreId: 'a', pinned: true },
            { cookieStoreId: 'b', pinned: true }
          ]
        },
        {          cookieStoreId: 'a',
          tabs: [{ cookieStoreId: 'a' }, { cookieStoreId: 'a' }]
        },
      ]
      const tab1 = { cookieStoreId: 'b', pinned: true }
      const tab2 = { cookieStoreId: 'a', pinned: false }

      expect(Utils.GetPanelOf(panels, tab1)).toBe(null)
      expect(Utils.GetPanelOf(panels, tab2).cookieStoreId).toBe('a')
    })
  })

  // UDate
  describe('UDate()', () => {
    test('Convert unix seconds to readable date format yyyy.mm.dd', async () => {
      const somewhen = new Date('2024/04/04')
      expect(Utils.UDate(~~(somewhen.getTime() / 1000))).toBe('2024.04.04')
    })
  })

  // UTime
  describe('UTime()', () => {
    test('Convert unix seconds to readable time format hr:min:sec', async () => {
      const somewhen = new Date('2024/04/04 15:24')
      expect(Utils.UTime(~~(somewhen.getTime() / 1000))).toBe('15:24:00')
    })
  })

  // UElapsed
  describe('UElapsed()', () => {
    test('Get elapsed time string from unix seconds', async () => {
      Locales['en']['elapsed.now'] = { message: 'a' }
      Locales['en']['elapsed.min'] = { message: 'b' }
      Locales['en']['elapsed.hr'] = { message: 'c' }
      Locales['en']['elapsed.day'] = { message: 'd' }
      Locales['en']['elapsed.week'] = { message: 'e' }
      Locales['en']['elapsed.month'] = { message: 'f' }
      Locales['en']['elapsed.year'] = { message: 'y' }

      expect(Utils.UElapsed(10, 15)).toBe('a')
      expect(Utils.UElapsed(10, 95)).toBe('1 b')
      expect(Utils.UElapsed(10, 7500)).toBe('2 c')
      expect(Utils.UElapsed(10, 320000)).toBe('3 d')
      expect(Utils.UElapsed(10, 2000000)).toBe('3 e')
      expect(Utils.UElapsed(10, 36000000)).toBe('1 y')
    })
  })

  // CalcTabsTreeLevels
  describe('CalcTabsTreeLevels()', () => {
    test('Move group of tabs', () => {
    //     >    I     >      II     >     III    >     IV
    // |tab 0       |tab 0       |tab 0       |tab 0       |tab 0       
    // |tab 1      -|TAB 5       |tab 5       |tab 5       |tab 5       
    // |  tab 2    ^|tab 1      >|  TAB 6     |  tab 6     |  tab 6     
    // |  tab 3    ^|  tab 2    ^|tab 1      >|    TAB 7   |    tab 7   
    // |    tab 4  ^|  tab 3    ^|  tab 2    ^|tab 1      >|  TAB 8     
    // |tab 5      ^|    tab 4  ^|  tab 3    ^|  tab 2    ^|tab 1       
    // |  tab 6    <|tab 6      ^|    tab 4  ^|  tab 3    ^|  tab 2     
    // |    tab 7  <|  tab 7    <|tab 7      ^|    tab 4  ^|  tab 3     
    // |  tab 8    <|tab 8       |tab 8       |tab 8      ^|    tab 4   
    // |tab 9       |tab 9       |tab 9       |tab 9       |tab 9       
      const tabs = [
        { id: 0, index: 0, parentId: -1 },
        { id: 1, index: 1, parentId: -1 },
        { id: 2, index: 2, parentId: 1 },
        { id: 3, index: 3, parentId: 1 },
        { id: 4, index: 4, parentId: 3 },
        { id: 5, index: 5, parentId: -1 },
        { id: 6, index: 6, parentId: 5 },
        { id: 7, index: 7, parentId: 6 },
        { id: 8, index: 8, parentId: 5 },
        { id: 9, index: 9, parentId: -1 },
      ]

      Utils.CalcTabsTreeLevels(tabs)

      expect(tabs).toEqual([
        { id: 0, index: 0, isParent: false, lvl: 0, parentId: -1, folded: false },
        { id: 1, index: 1, isParent: true,  lvl: 0, parentId: -1, folded: false },
        { id: 2, index: 2, isParent: false, lvl: 1, parentId: 1, folded: false },
        { id: 3, index: 3, isParent: true,  lvl: 1, parentId: 1, folded: false },
        { id: 4, index: 4, isParent: false, lvl: 2, parentId: 3, folded: false },
        { id: 5, index: 5, isParent: true, lvl: 0, parentId: -1, folded: false },
        { id: 6, index: 6, isParent: true, lvl: 1, parentId: 5, folded: false },
        { id: 7, index: 7, isParent: false, lvl: 2, parentId: 6, folded: false },
        { id: 8, index: 8, isParent: false, lvl: 1, parentId: 5, folded: false },
        { id: 9, index: 9, isParent: false, lvl: 0, parentId: -1, folded: false },
      ])

      // ---

      const tabs1 = [
        { id: 0, index: 0, parentId: -1 },
        { id: 5, index: 1, parentId: -1 },
        { id: 1, index: 2, parentId: -1 },
        { id: 2, index: 3, parentId: 1 },
        { id: 3, index: 4, parentId: 1 },
        { id: 4, index: 5, parentId: 3 },
        { id: 6, index: 6, parentId: 5 },
        { id: 7, index: 7, parentId: 6 },
        { id: 8, index: 8, parentId: 5 },
        { id: 9, index: 9, parentId: -1 },
      ]

      Utils.CalcTabsTreeLevels(tabs1)

      expect(tabs1).toEqual([
        { id: 0, index: 0, isParent: false, lvl: 0, parentId: -1, folded: false },
        { id: 5, index: 1, isParent: true, lvl: 0, parentId: -1, folded: false },
        { id: 1, index: 2, isParent: true,  lvl: 0, parentId: -1, folded: false },
        { id: 2, index: 3, isParent: false, lvl: 1, parentId: 1, folded: false },
        { id: 3, index: 4, isParent: true,  lvl: 1, parentId: 1, folded: false },
        { id: 4, index: 5, isParent: false, lvl: 2, parentId: 3, folded: false },
        { id: 6, index: 6, isParent: true, lvl: 0, parentId: 5, folded: false },
        { id: 7, index: 7, isParent: false, lvl: 1, parentId: 6, folded: false },
        { id: 8, index: 8, isParent: false, lvl: 0, parentId: 5, folded: false },
        { id: 9, index: 9, isParent: false, lvl: 0, parentId: -1, folded: false },
      ])

      // ---

      const tabs2 = [
        { id: 0, index: 0, parentId: -1 },
        { id: 5, index: 1, parentId: -1 },
        { id: 6, index: 2, parentId: 5 },
        { id: 1, index: 3, parentId: -1 },
        { id: 2, index: 4, parentId: 1 },
        { id: 3, index: 5, parentId: 1 },
        { id: 4, index: 6, parentId: 3 },
        { id: 7, index: 7, parentId: 6 },
        { id: 8, index: 8, parentId: 5 },
        { id: 9, index: 9, parentId: -1 },
      ]

      Utils.CalcTabsTreeLevels(tabs2)

      expect(tabs2).toEqual([
        { id: 0, index: 0, isParent: false, lvl: 0, parentId: -1, folded: false },
        { id: 5, index: 1, isParent: true, lvl: 0, parentId: -1, folded: false },
        { id: 6, index: 2, isParent: true, lvl: 1, parentId: 5, folded: false },
        { id: 1, index: 3, isParent: true,  lvl: 0, parentId: -1, folded: false },
        { id: 2, index: 4, isParent: false, lvl: 1, parentId: 1, folded: false },
        { id: 3, index: 5, isParent: true,  lvl: 1, parentId: 1, folded: false },
        { id: 4, index: 6, isParent: false, lvl: 2, parentId: 3, folded: false },
        { id: 7, index: 7, isParent: false, lvl: 0, parentId: 6, folded: false },
        { id: 8, index: 8, isParent: false, lvl: 0, parentId: 5, folded: false },
        { id: 9, index: 9, isParent: false, lvl: 0, parentId: -1, folded: false },
      ])

      // ---

      const tabs3 = [
        { id: 0, index: 0, parentId: -1 },
        { id: 5, index: 1, parentId: -1 },
        { id: 6, index: 2, parentId: 5 },
        { id: 7, index: 3, parentId: 6 },
        { id: 1, index: 4, parentId: -1 },
        { id: 2, index: 5, parentId: 1 },
        { id: 3, index: 6, parentId: 1 },
        { id: 4, index: 7, parentId: 3 },
        { id: 8, index: 8, parentId: 5 },
        { id: 9, index: 9, parentId: -1 },
      ]

      Utils.CalcTabsTreeLevels(tabs3)

      expect(tabs3).toEqual([
        { id: 0, index: 0, isParent: false, lvl: 0, parentId: -1, folded: false },
        { id: 5, index: 1, isParent: true, lvl: 0, parentId: -1, folded: false },
        { id: 6, index: 2, isParent: true, lvl: 1, parentId: 5, folded: false },
        { id: 7, index: 3, isParent: false, lvl: 2, parentId: 6, folded: false },
        { id: 1, index: 4, isParent: true,  lvl: 0, parentId: -1, folded: false },
        { id: 2, index: 5, isParent: false, lvl: 1, parentId: 1, folded: false },
        { id: 3, index: 6, isParent: true,  lvl: 1, parentId: 1, folded: false },
        { id: 4, index: 7, isParent: false, lvl: 2, parentId: 3, folded: false },
        { id: 8, index: 8, isParent: false, lvl: 0, parentId: 5, folded: false },
        { id: 9, index: 9, isParent: false, lvl: 0, parentId: -1, folded: false },
      ])

      // ---

      const tabs4 = [
        { id: 0, index: 0, parentId: -1 },
        { id: 5, index: 1, parentId: -1 },
        { id: 6, index: 2, parentId: 5 },
        { id: 7, index: 3, parentId: 6 },
        { id: 8, index: 4, parentId: 5 },
        { id: 1, index: 5, parentId: -1 },
        { id: 2, index: 6, parentId: 1 },
        { id: 3, index: 7, parentId: 1 },
        { id: 4, index: 8, parentId: 3 },
        { id: 9, index: 9, parentId: -1 },
      ]

      Utils.CalcTabsTreeLevels(tabs4)

      expect(tabs4).toEqual([
        { id: 0, index: 0, isParent: false, lvl: 0, parentId: -1, folded: false },
        { id: 5, index: 1, isParent: true, lvl: 0, parentId: -1, folded: false },
        { id: 6, index: 2, isParent: true, lvl: 1, parentId: 5, folded: false },
        { id: 7, index: 3, isParent: false, lvl: 2, parentId: 6, folded: false },
        { id: 8, index: 4, isParent: false, lvl: 1, parentId: 5, folded: false },
        { id: 1, index: 5, isParent: true,  lvl: 0, parentId: -1, folded: false },
        { id: 2, index: 6, isParent: false, lvl: 1, parentId: 1, folded: false },
        { id: 3, index: 7, isParent: true,  lvl: 1, parentId: 1, folded: false },
        { id: 4, index: 8, isParent: false, lvl: 2, parentId: 3, folded: false },
        { id: 9, index: 9, isParent: false, lvl: 0, parentId: -1, folded: false },
      ])
    })
  })

  // CommonSubStr
  describe('CommonSubStr()', () => {
    test('Find common part of strings', () => {
      const strings = ['Just some stringA', 'another StriNg', '__STRING__']
      const common = Utils.CommonSubStr(strings)
      expect(common).toBe('string')

      const a = ['Just some string', 'another StriNg', 'STRING__']
      const commona = Utils.CommonSubStr(a)
      expect(commona).toBe('string')

      const noStrings = []
      const common1 = Utils.CommonSubStr(noStrings)
      expect(common1).toBe('')

      const one = ['just one']
      const common2 = Utils.CommonSubStr(one)
      expect(common2).toBe('just one')
    })
  })
})
