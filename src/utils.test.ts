import { describe, expect, test } from 'vitest'
import * as Utils from './utils'
import { URL_URL } from 'src/defaults'

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
    const placeholderUrl = URL_URL + '#' + encodeURIComponent(JSON.stringify([srcUrl, srcTitle]))
    const info = Utils.parsePlaceholderUrl(placeholderUrl)
    expect(info.url).toBe(srcUrl)
    expect(info.title).toBe(srcTitle)
  })
  test('decode legacy without title', () => {
    const srcUrl = 'file:///path/to/file.pdf'
    const placeholderUrl = URL_URL + '#' + srcUrl
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

describe('Utils.denormalizeUrl()', () => {
  test('group page url', () => {
    const sUrl =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#New%20Tab'
    const rUrl = Utils.denormalizeUrl(sUrl)
    expect(rUrl).toBe(sUrl)
  })
  test('group page url with empty title', () => {
    const sUrl = 'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#'
    const rUrl = Utils.denormalizeUrl(sUrl)
    expect(rUrl).toBe(sUrl)
  })
  test('group page url (+chId)', () => {
    const sUrl =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#New%20Tab~!PpBA2ocRL1ry!ch!~'
    const eUrl =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#New%20Tab'
    const rUrl = Utils.denormalizeUrl(sUrl)
    expect(rUrl).toBe(eUrl)
  })
  test('group page url (+chId) with empty title', () => {
    const sUrl =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#~!PpBA2ocRL1ry!ch!~'
    const eUrl = 'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#'
    const rUrl = Utils.denormalizeUrl(sUrl)
    expect(rUrl).toBe(eUrl)
  })
  test('group page url (+hash msg)', () => {
    const sUrl =
      'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#123~!+.0.syPdgQdGolHy!p!b!~'
    const eUrl = 'moz-extension://c02055a8-a7a3-4076-bb5c-8d913619f579/sidebery/group.html#123'
    const rUrl = Utils.denormalizeUrl(sUrl)
    expect(rUrl).toBe(eUrl)
  })
  test('placeholder page url (+chId)', () => {
    const origUrl = 'file:///abc/cba/123.json'
    const sUrl = Utils.createPlaceholderUrl({ url: origUrl }) + '~!PpBA2ocRL1ry!ch!~'
    const rUrl = Utils.denormalizeUrl(sUrl)
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
    expect(Utils.isUrlUrl(items[0].url ?? '')).toBe(true)
    expect(items[0].title).toBe('File Name.json')
    expect(Utils.isUrlUrl(items[1].url ?? '')).toBe(true)
    expect(items[1].title).toBe('1 2 3')
    expect(Utils.isUrlUrl(items[2].url ?? '')).toBe(true)
    expect(items[2].title).toBe('one two')
    expect(items[3].url).toBe(undefined)
    expect(items[3].title).toBe('[hey](not link)')
    expect(items.length).toBe(4)
  })
})
