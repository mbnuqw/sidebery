import { describe, expect, test } from 'vitest'
import * as Utils from './utils'
import { PLACEHOLDER_URL } from 'src/defaults'

describe('Utils.createGroupUrl()', () => {
  test('just name', () => {
    const url = Utils.createGroupUrl('name')
    const urlObj = new URL(url)
    expect(Utils.isGroupUrl(url)).toBe(true)
    expect(urlObj.hash).toBe('#name')
  })
  test('name and pin', () => {
    const url = Utils.createGroupUrl('name', 'https://example.com', 'firefox-default')
    const urlObj = new URL(url)
    expect(Utils.isGroupUrl(url)).toBe(true)
    expect(urlObj.hash).toBe('#name')
    expect(urlObj.searchParams.get('pin')).toBe('firefox-default::https://example.com')
  })
})

describe('Utils.createPlaceholderUrl(), Utils.parsePlaceholderUrl()', () => {
  test('encode decode', () => {
    const srcUrl = encodeURI('file:///path/to some/filе.pdf')
    const srcTitle = 'Abc🔙йĀ𐀀文'
    const placeholderUrl = Utils.createPlaceholderUrl({ url: srcUrl, title: srcTitle })
    const info = Utils.parsePlaceholderUrl(placeholderUrl)
    expect(info.url).toBe(srcUrl)
    expect(info.title).toBe(srcTitle)
  })
  test('decode legacy', () => {
    const srcUrl = 'file:///home/m/sidebery-snapshot-2026.02.08-13.46.05.json'
    const srcTitle = '123'
    const placeholderUrl =
      PLACEHOLDER_URL + '#' + encodeURIComponent(JSON.stringify([srcUrl, srcTitle]))
    const info = Utils.parsePlaceholderUrl(placeholderUrl)
    expect(info.url).toBe(srcUrl)
    expect(info.title).toBe(srcTitle)
  })
  test('decode legacy without title', () => {
    const srcUrl = 'file:///path/to/file.pdf'
    const placeholderUrl = PLACEHOLDER_URL + '#' + srcUrl
    const info = Utils.parsePlaceholderUrl(placeholderUrl)
    expect(info.url).toBe(srcUrl)
  })
  test('parse placeholder url with broadcast channel', () => {
    const srcUrl = 'file:///some/path/to/file.txt'
    const srcTitle = 'File'
    const placeholderUrl = Utils.createPlaceholderUrl({ url: srcUrl, title: srcTitle })
    const urlWithChId = placeholderUrl + '~!123456789abc!ch!~'
    const info = Utils.parsePlaceholderUrl(urlWithChId)
    expect(info.url).toBe(srcUrl)
    expect(info.title).toBe(srcTitle)
  })
  test('parse placeholder url with hash msg', () => {
    const srcUrl = 'file:///some/path/to/file.txt'
    const srcTitle = 'File'
    const placeholderUrl = Utils.createPlaceholderUrl({ url: srcUrl, title: srcTitle })
    const urlWithHashMsg = placeholderUrl + '~!+.0.123456789abc!b!p!~'
    const info = Utils.parsePlaceholderUrl(urlWithHashMsg)
    expect(info.url).toBe(srcUrl)
    expect(info.title).toBe(srcTitle)
  })
})

describe('Utils.restoreUrl()', () => {
  test('group page url', () => {
    const sUrl =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#New%20Tab'
    const rUrl = Utils.restoreUrl(sUrl)
    expect(rUrl).toBe(sUrl)
  })
  test('group page url with empty title', () => {
    const sUrl = 'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#'
    const rUrl = Utils.restoreUrl(sUrl)
    expect(rUrl).toBe(sUrl)
  })
  test('group page url (+chId)', () => {
    const sUrl =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#New%20Tab~!PpBA2ocRL1ry!ch!~'
    const eUrl =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#New%20Tab'
    const rUrl = Utils.restoreUrl(sUrl)
    expect(rUrl).toBe(eUrl)
  })
  test('group page url (+chId) with empty title', () => {
    const sUrl =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#~!PpBA2ocRL1ry!ch!~'
    const eUrl = 'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#'
    const rUrl = Utils.restoreUrl(sUrl)
    expect(rUrl).toBe(eUrl)
  })
  test('group page url (+hash msg)', () => {
    const sUrl =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#123~!+.0.syPdgQdGolHy!p!b!~'
    const eUrl = 'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#123'
    const rUrl = Utils.restoreUrl(sUrl)
    expect(rUrl).toBe(eUrl)
  })
  test('placeholder page url (+chId)', () => {
    const origUrl = 'file:///abc/cba/123.json'
    const sUrl = Utils.createPlaceholderUrl({ url: origUrl }) + '~!PpBA2ocRL1ry!ch!~'
    const rUrl = Utils.restoreUrl(sUrl)
    expect(rUrl).toBe(origUrl)
  })
})

describe('Utils.parseTextForItems()', () => {
  test('empty string', () => {
    const items = Utils.parseTextForItems('')
    expect(items.length).toBe(0)
  })
  test('url, markdown, html, text', () => {
    const input = `
pre https://example.com
[hey](https://example.com) post
pre <a href="https://example.com">123</a> post
some:text`
    const items = Utils.parseTextForItems(input)
    expect(items[0].url).toBe('https://example.com')
    expect(items[0].title).toBe('')
    expect(items[1].url).toBe('https://example.com')
    expect(items[1].title).toBe('hey')
    expect(items[2].url).toBe('https://example.com')
    expect(items[2].title).toBe('123')
    expect(items[3].url).toBe(undefined)
    expect(items[3].title).toBe('some:text')
    expect(items.length).toBe(4)
  })
  test('api-limited url, markdown, html', () => {
    const input = `
file:///some/path/to/File%20Name.json
[1 2 3](blob:https://example.com/550e8400)
<a href="about:config">one two</a>
[hey](not link)`
    const items = Utils.parseTextForItems(input)
    expect(Utils.isPlaceholderUrl(items[0].url ?? '')).toBe(true)
    expect(items[0].title).toBe('File Name.json')
    expect(Utils.isPlaceholderUrl(items[1].url ?? '')).toBe(true)
    expect(items[1].title).toBe('1 2 3')
    expect(Utils.isPlaceholderUrl(items[2].url ?? '')).toBe(true)
    expect(items[2].title).toBe('one two')
    expect(items[3].url).toBe(undefined)
    expect(items[3].title).toBe('[hey](not link)')
    expect(items.length).toBe(4)
  })
})

describe('Utils.getDomain()', () => {
  test('empty string', () => {
    browser.publicSuffix = {} as unknown as typeof browser.publicSuffix
    browser.publicSuffix.getDomain = () => {
      throw 'invalid hostname blablabla'
    }
    browser.publicSuffix.getKnownSuffix = () => {
      throw 'invalid hostname blablabla'
    }
    expect(Utils.getDomain('', true, -1)).toBe('')
    expect(Utils.getDomain('', true, 0)).toBe('')
    expect(Utils.getDomain('', true, 1)).toBe('')
    expect(Utils.getDomain('', true, 2)).toBe('')
    expect(Utils.getDomain('', false, -1)).toBe('')
    expect(Utils.getDomain('', false, 0)).toBe('')
    expect(Utils.getDomain('', false, 1)).toBe('')
    expect(Utils.getDomain('', false, 2)).toBe('')
    // Fallback test
    browser.publicSuffix = undefined as unknown as typeof browser.publicSuffix
    expect(Utils.getDomain('', true, -1)).toBe('')
    expect(Utils.getDomain('', true, 0)).toBe('')
    expect(Utils.getDomain('', true, 1)).toBe('')
    expect(Utils.getDomain('', true, 2)).toBe('')
    expect(Utils.getDomain('', false, -1)).toBe('')
    expect(Utils.getDomain('', false, 0)).toBe('')
    expect(Utils.getDomain('', false, 1)).toBe('')
    expect(Utils.getDomain('', false, 2)).toBe('')
  })
  test('abc.sub.example.co.uk', () => {
    browser.publicSuffix = {} as unknown as typeof browser.publicSuffix
    browser.publicSuffix.getDomain = () => 'example.co.uk'
    browser.publicSuffix.getKnownSuffix = () => 'co.uk'
    const hostname = 'abc.sub.example.co.uk'
    expect(Utils.getDomain(hostname, true, -1)).toBe('abc.sub.example.co.uk')
    expect(Utils.getDomain(hostname, true, 0)).toBe('co.uk')
    expect(Utils.getDomain(hostname, true, 1)).toBe('example.co.uk')
    expect(Utils.getDomain(hostname, true, 2)).toBe('sub.example.co.uk')
    expect(Utils.getDomain(hostname, true, 4)).toBe('abc.sub.example.co.uk')
    expect(Utils.getDomain(hostname, false, -1)).toBe('abc.sub.example')
    expect(Utils.getDomain(hostname, false, 0)).toBe('')
    expect(Utils.getDomain(hostname, false, 1)).toBe('example')
    expect(Utils.getDomain(hostname, false, 2)).toBe('sub.example')
    expect(Utils.getDomain(hostname, false, 3)).toBe('abc.sub.example')
    expect(Utils.getDomain(hostname, false, 4)).toBe('abc.sub.example')
    // Fallback test
    browser.publicSuffix = undefined as unknown as typeof browser.publicSuffix
    expect(Utils.getDomain(hostname, true, -1)).toBe('abc.sub.example.co.uk')
    expect(Utils.getDomain(hostname, true, 0)).toBe('uk')
    expect(Utils.getDomain(hostname, true, 1)).toBe('co.uk')
    expect(Utils.getDomain(hostname, true, 2)).toBe('example.co.uk')
    expect(Utils.getDomain(hostname, false, -1)).toBe('abc.sub.example.co')
    expect(Utils.getDomain(hostname, false, 0)).toBe('')
    expect(Utils.getDomain(hostname, false, 1)).toBe('co')
    expect(Utils.getDomain(hostname, false, 2)).toBe('example.co')
    expect(Utils.getDomain(hostname, false, 3)).toBe('sub.example.co')
    expect(Utils.getDomain(hostname, false, 4)).toBe('abc.sub.example.co')
    expect(Utils.getDomain(hostname, false, 5)).toBe('abc.sub.example.co')
  })
  test('about:config', () => {
    browser.publicSuffix = {} as unknown as typeof browser.publicSuffix
    browser.publicSuffix.getDomain = () => {
      throw 'invalid hostname blablabla'
    }
    browser.publicSuffix.getKnownSuffix = () => {
      throw 'invalid hostname blablabla'
    }
    const hostname = 'about:config'
    expect(Utils.getDomain(hostname, true, -1)).toBe('about:config')
    expect(Utils.getDomain(hostname, true, 0)).toBe('about:config')
    expect(Utils.getDomain(hostname, true, 1)).toBe('about:config')
    expect(Utils.getDomain(hostname, true, 2)).toBe('about:config')
    expect(Utils.getDomain(hostname, false, -1)).toBe('')
    expect(Utils.getDomain(hostname, false, 0)).toBe('')
    expect(Utils.getDomain(hostname, false, 1)).toBe('')
    expect(Utils.getDomain(hostname, false, 2)).toBe('')
    expect(Utils.getDomain(hostname, false, 3)).toBe('')
    // Fallback test
    browser.publicSuffix = undefined as unknown as typeof browser.publicSuffix
    expect(Utils.getDomain(hostname, true, -1)).toBe('about:config')
    expect(Utils.getDomain(hostname, true, 0)).toBe('about:config')
    expect(Utils.getDomain(hostname, true, 1)).toBe('about:config')
    expect(Utils.getDomain(hostname, true, 2)).toBe('about:config')
    expect(Utils.getDomain(hostname, false, -1)).toBe('')
    expect(Utils.getDomain(hostname, false, 0)).toBe('')
    expect(Utils.getDomain(hostname, false, 1)).toBe('')
    expect(Utils.getDomain(hostname, false, 2)).toBe('')
    expect(Utils.getDomain(hostname, false, 3)).toBe('')
  })
  test('com', () => {
    browser.publicSuffix = {} as unknown as typeof browser.publicSuffix
    browser.publicSuffix.getDomain = () => null
    browser.publicSuffix.getKnownSuffix = () => 'com'
    const hostname = 'com'
    expect(Utils.getDomain(hostname, true, -1)).toBe('com')
    expect(Utils.getDomain(hostname, true, 0)).toBe('com')
    expect(Utils.getDomain(hostname, true, 1)).toBe('com')
    expect(Utils.getDomain(hostname, true, 2)).toBe('com')
    expect(Utils.getDomain(hostname, false, -1)).toBe('')
    expect(Utils.getDomain(hostname, false, 0)).toBe('')
    expect(Utils.getDomain(hostname, false, 1)).toBe('')
    expect(Utils.getDomain(hostname, false, 2)).toBe('')
    expect(Utils.getDomain(hostname, false, 3)).toBe('')
    // Fallback test
    browser.publicSuffix = undefined as unknown as typeof browser.publicSuffix
    expect(Utils.getDomain(hostname, true, -1)).toBe('com')
    expect(Utils.getDomain(hostname, true, 0)).toBe('com')
    expect(Utils.getDomain(hostname, true, 1)).toBe('com')
    expect(Utils.getDomain(hostname, true, 2)).toBe('com')
    expect(Utils.getDomain(hostname, false, -1)).toBe('')
    expect(Utils.getDomain(hostname, false, 0)).toBe('')
    expect(Utils.getDomain(hostname, false, 1)).toBe('')
    expect(Utils.getDomain(hostname, false, 2)).toBe('')
    expect(Utils.getDomain(hostname, false, 3)).toBe('')
  })
})
