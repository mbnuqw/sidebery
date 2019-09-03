import { Locales, translate } from '../dict'

describe('Dict', () => {
  test('Tranlation', () => {
    Locales['en']['a'] = {
      message: 'A',
    }

    expect(translate('a')).toBe('A')
  })

  test('Plural tranlation', () => {
    Locales['en']['min'] = {
      message: ['минута', 'минуты', 'минут'],
      plur: [/^(1|(\d*?)[^1]1)$/, /^([234]|(\d*?)[^1][234])$/],
    }

    expect(translate('min', 1)).toBe('минута')
    expect(translate('min', 21)).toBe('минута')
    expect(translate('min', 31)).toBe('минута')
    expect(translate('min', 2)).toBe('минуты')
    expect(translate('min', 3)).toBe('минуты')
    expect(translate('min', 4)).toBe('минуты')
    expect(translate('min', 22)).toBe('минуты')
    expect(translate('min', 5)).toBe('минут')
    expect(translate('min', 6)).toBe('минут')
    expect(translate('min', 11)).toBe('минут')
    expect(translate('min', 56)).toBe('минут')
  })
})
