import { Locales, Translate, PlurTrans } from './dict'

describe('Dict', () => {
  test('Tranlation', () => {
    Locales['en']['a'] = {
      message: 'A',
    }
    Locales['en']['a.b'] = {
      message: 'AB',
    }

    expect(Translate('a')).toBe('A')
    expect(Translate('b', 'a')).toBe('AB')
  })

  test('Plural tranlation', () => {
    Locales['en']['elapsed.day'] = {
      message: 'A|B|C',
      description: '1,21,31|2,3,4,22,23,24|',
    }

    expect(PlurTrans('elapsed.day', 1)).toBe('A')
    expect(PlurTrans('elapsed.day', 21)).toBe('A')
    expect(PlurTrans('elapsed.day', 31)).toBe('A')
    expect(PlurTrans('elapsed.day', 2)).toBe('B')
    expect(PlurTrans('elapsed.day', 3)).toBe('B')
    expect(PlurTrans('elapsed.day', 4)).toBe('B')
    expect(PlurTrans('elapsed.day', 22)).toBe('B')
    expect(PlurTrans('elapsed.day', 5)).toBe('C')
    expect(PlurTrans('elapsed.day', 6)).toBe('C')
    expect(PlurTrans('elapsed.day', 11)).toBe('C')
    expect(PlurTrans('elapsed.day', 56)).toBe('C')
  })
})
