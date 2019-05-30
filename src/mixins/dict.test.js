import { Locales, translate, plurTrans } from './dict'

describe('Dict', () => {
  test('Tranlation', () => {
    Locales['en']['a'] = {
      message: 'A',
    }
    Locales['en']['a.b'] = {
      message: 'AB',
    }

    expect(translate('a')).toBe('A')
    expect(translate('b', 'a')).toBe('AB')
  })

  test('Plural tranlation', () => {
    Locales['en']['elapsed.day'] = {
      message: 'A|B|C',
      description: '1,21,31|2,3,4,22,23,24|',
    }

    expect(plurTrans('elapsed.day', 1)).toBe('A')
    expect(plurTrans('elapsed.day', 21)).toBe('A')
    expect(plurTrans('elapsed.day', 31)).toBe('A')
    expect(plurTrans('elapsed.day', 2)).toBe('B')
    expect(plurTrans('elapsed.day', 3)).toBe('B')
    expect(plurTrans('elapsed.day', 4)).toBe('B')
    expect(plurTrans('elapsed.day', 22)).toBe('B')
    expect(plurTrans('elapsed.day', 5)).toBe('C')
    expect(plurTrans('elapsed.day', 6)).toBe('C')
    expect(plurTrans('elapsed.day', 11)).toBe('C')
    expect(plurTrans('elapsed.day', 56)).toBe('C')
  })
})
