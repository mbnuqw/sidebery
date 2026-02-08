import { describe, expect, test } from 'vitest'
import * as Omnibox from 'src/services/omnibox.bg'

describe('Omnibox.calcMatchWeight()', () => {
  test('test string === query', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('abc', 'abc'.split(''), 0)
    expect(weight).toBe(7)
  })
  test('query value in the middle of test string', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('abcd', 'bc'.split(''), 0)
    expect(weight).toBe(3)
  })
  test('query value in the middle of test string', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('abcd', 'bc'.split(''), 0)
    expect(weight).toBe(3)
  })
  test('no match', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('abc', 'd'.split(''), 0)
    expect(weight).toBe(0)
  })
  test('sparse 1', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('abcde', 'ace'.split(''), 0)
    expect(weight).toBe(3)
  })
  test('sparse 2', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('abcdef', 'acdf'.split(''), 0)
    expect(weight).toBe(5)
  })
  test('sparse 3', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('abcdef', 'axyf'.split(''), 0)
    expect(weight).toBe(2)
  })
  test('sparse 4', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('abcdef', 'bxye'.split(''), 0)
    expect(weight).toBe(2)
  })
  test('with prefix', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('12abc', '2a'.split(''), 2)
    expect(weight).toBe(4)
  })
  test('with "s" prefix 1', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('stabs', 'ss'.split(''), 1)
    expect(weight).toBe(3)
  })
  test('with "s" prefix 2', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('sside', 'ss'.split(''), 1)
    expect(weight).toBe(4)
  })
  test('CJK 1', () => {
    const weight = Omnibox.TESTING.calcMatchWeight('編輯快捷選單', '捷選'.split(''), 0)
    expect(weight).toBe(3)
  })
})
