import './mock-dict'
import { translate } from '../../../addon/locales/dict'

describe('Dict', () => {
  test('Tranlation', () => {
    expect(translate('a')).toBe('A')
  })

  test('Plural tranlation', () => {
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
