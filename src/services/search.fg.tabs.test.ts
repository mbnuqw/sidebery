import { describe, expect, test } from 'vitest'
import { Tab } from 'src/types'
import { checkTab, getTabSearchStr } from './search.fg.tabs'
import * as Containers from 'src/services/containers.fg'

function createMockTab(props: Partial<Tab>): Tab {
  return {
    id: props.id ?? 1,
    index: 0,
    pinned: false,
    highlighted: false,
    windowId: 1,
    active: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    isParent: false,
    folded: false,
    invisible: false,
    parentId: -1,
    panelId: 'tabs',
    prevPanelId: 'tabs',
    lvl: 0,
    sel: false,
    selLock: false,
    badge: false,
    badgeUrgent: false,
    loading: false,
    warn: false,
    mediaPaused: false,
    isGroup: false,
    title: props.title ?? 'Test Tab',
    url: props.url ?? 'https://example.com',
    customTitle: props.customTitle,
    cookieStoreId: props.cookieStoreId,
    reactive: {} as any,
  } as unknown as Tab
}

describe('SearchTabs: robust search matching & caching', () => {
  test('matches multi-token queries regardless of token order', () => {
    const tab = createMockTab({
      title: 'Advanced Combos - Azula Guide - Google Docs',
      url: 'https://docs.google.com/document/d/12345/edit',
    })

    expect(checkTab(tab, ['azula', 'combos'])).toBe(true)
    expect(checkTab(tab, ['combos', 'azula'])).toBe(true)
    expect(checkTab(tab, ['docs', 'advanced'])).toBe(true)
    expect(checkTab(tab, ['azula', 'nonexistent'])).toBe(false)
  })

  test('matches with and without diacritics / accents', () => {
    const tab = createMockTab({
      title: 'Guia de Programação & Café',
      url: 'https://pt.wikipedia.org/wiki/Programação',
    })

    // Searching without accents matches accented titles and URLs
    expect(checkTab(tab, ['programacao'])).toBe(true)
    expect(checkTab(tab, ['cafe'])).toBe(true)
    expect(checkTab(tab, ['guia', 'programacao'])).toBe(true)

    // Searching with accents also matches
    expect(checkTab(tab, ['programação'])).toBe(true)
    expect(checkTab(tab, ['café'])).toBe(true)
  })

  test('matches raw and decoded URLs', () => {
    const tab = createMockTab({
      title: 'Wikipedia Article',
      url: 'https://pt.wikipedia.org/wiki/S%C3%A3o_Paulo',
    })

    expect(checkTab(tab, ['sao', 'paulo'])).toBe(true)
    expect(checkTab(tab, ['wikipedia'])).toBe(true)
  })

  test('matches custom title and container name', () => {
    Containers.reactive.byId['firefox-container-1'] = {
      id: 'firefox-container-1',
      name: 'Work Project',
      color: 'blue',
      icon: 'briefcase',
    } as any

    const tab = createMockTab({
      title: 'Issue #42',
      customTitle: 'Fix Navigation Glitch',
      url: 'https://github.com/org/repo/issues/42',
      cookieStoreId: 'firefox-container-1',
    })

    expect(checkTab(tab, ['navigation'])).toBe(true)
    expect(checkTab(tab, ['work'])).toBe(true)
    expect(checkTab(tab, ['fix', 'project'])).toBe(true)
  })

  test('caches search string and invalidates when tab properties change', () => {
    const tab = createMockTab({
      title: 'Initial Title',
      url: 'https://initial.com',
    })

    const firstStr = getTabSearchStr(tab)
    expect(firstStr).toContain('initial title')

    // Same tab returns cached string
    const secondStr = getTabSearchStr(tab)
    expect(secondStr).toBe(firstStr)

    // Modifying title invalidates cache
    tab.title = 'Updated Title'
    const updatedStr = getTabSearchStr(tab)
    expect(updatedStr).toContain('updated title')
    expect(updatedStr).not.toBe(firstStr)
  })
})
