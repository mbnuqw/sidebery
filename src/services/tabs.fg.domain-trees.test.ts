import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import * as Settings from 'src/services/settings'
import * as DomainTrees from './tabs.fg.domain-trees'
import * as Tabs from 'src/services/tabs.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import { PanelType } from 'src/enums'
import * as Utils from 'src/utils'
import type { Tab } from 'src/types'

describe('DomainTrees service', () => {
  beforeEach(() => {
    browser.publicSuffix.getDomain = (h: string) => {
      if (!h) return ''
      const parts = h.split('.')
      return parts.length >= 2 ? parts.slice(-2).join('.') : h
    }
  })

  afterEach(() => {
    Settings.resetSettings()
  })

  test('matchDomain with disabled setting returns null', () => {
    Settings.state.domainTrees = false
    expect(DomainTrees.matchDomain('https://www.youtube.com/watch?v=123')).toBeNull()
  })

  test('matchDomain with custom rule: youtube.com|youtu.be', () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreesUniversal = false
    Settings.state.domainTreeRules = [
      {
        id: 'yt_rule',
        active: true,
        name: 'YouTube',
        url: 'youtube.com|youtu.be',
      },
    ]

    const match1 = DomainTrees.matchDomain('https://www.youtube.com/watch?v=abc')
    expect(match1).not.toBeNull()
    expect(match1?.title).toBe('YouTube')
    expect(match1?.domainKey).toBe('youtube')

    const match2 = DomainTrees.matchDomain('https://youtu.be/xyz')
    expect(match2).not.toBeNull()
    expect(match2?.title).toBe('YouTube')
    expect(match2?.domainKey).toBe('youtube')

    const match3 = DomainTrees.matchDomain('https://reddit.com/r/firefox')
    expect(match3).toBeNull()
  })

  test('matchDomain with regex rule', () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreeRules = [
      {
        id: 'gh_rule',
        active: true,
        name: 'GitHub',
        url: '/github\\.com/',
      },
    ]

    const match = DomainTrees.matchDomain('https://github.com/mbnuqw/sidebery')
    expect(match).not.toBeNull()
    expect(match?.title).toBe('GitHub')
    expect(match?.domainKey).toBe('github')
  })

  test('matchDomain in universal mode', () => {
    browser.publicSuffix.getDomain = (h: string) => h.split('.').slice(-2).join('.')
    Settings.state.domainTrees = true
    Settings.state.domainTreesUniversal = true
    Settings.state.domainTreeRules = []

    const match = DomainTrees.matchDomain('https://news.ycombinator.com/item?id=123')
    expect(match).not.toBeNull()
    expect(match?.domainKey).toBe('ycombinator.com')
  })

  test('matchDomain ignores internal and about: URLs', () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreesUniversal = true

    expect(DomainTrees.matchDomain('about:blank')).toBeNull()
    expect(DomainTrees.matchDomain('about:newtab')).toBeNull()
    expect(DomainTrees.matchDomain('moz-extension://abc/page.html')).toBeNull()
  })

  test('createDomainTreeUrl, isDomainTreeGroup, and getDomainTreeKey', () => {
    const url = DomainTrees.createDomainTreeUrl('youtube.com', 'YouTube')
    expect(url).toContain('?dt=youtube.com')
    expect(url).toContain('#YouTube')

    const mockGroupTab: Tab = {
      id: 1,
      isGroup: true,
      url,
    } as Tab

    expect(DomainTrees.isDomainTreeGroup(mockGroupTab)).toBe(true)
    expect(DomainTrees.getDomainTreeKey(mockGroupTab)).toBe('youtube.com')

    const mockNormalGroupTab: Tab = {
      id: 2,
      isGroup: true,
      url: 'moz-extension://ext-id/sidebery/group.html#NormalGroup',
    } as Tab

    expect(DomainTrees.isDomainTreeGroup(mockNormalGroupTab)).toBe(false)
    expect(DomainTrees.getDomainTreeKey(mockNormalGroupTab)).toBeUndefined()
  })

  test('updateDomainTreeFavicon dynamically uses favicon of domain with most tabs', () => {
    browser.publicSuffix.getDomain = (h: string) => h.split('.').slice(-2).join('.')
    const placeholder = {
      id: 100,
      index: 0,
      lvl: 0,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('mixed', 'Mixed Tree'),
      favIconUrl: undefined,
    } as Tab

    const child1 = {
      id: 101,
      index: 1,
      lvl: 1,
      parentId: 100,
      url: 'https://www.youtube.com/watch?v=1',
      favIconUrl: 'https://youtube.com/favicon.ico',
    } as Tab

    const child2 = {
      id: 102,
      index: 2,
      lvl: 1,
      parentId: 100,
      url: 'https://m.youtube.com/watch?v=2',
      favIconUrl: 'https://youtube.com/favicon.ico',
    } as Tab

    const child3 = {
      id: 103,
      index: 3,
      lvl: 1,
      parentId: 100,
      url: 'https://github.com/mbnuqw/sidebery',
      favIconUrl: 'https://github.com/favicon.ico',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(placeholder, child1, child2, child3)
    Tabs.byId[100] = placeholder
    Tabs.byId[101] = child1
    Tabs.byId[102] = child2
    Tabs.byId[103] = child3

    DomainTrees.updateDomainTreeFavicon(placeholder)
    // 2 YouTube tabs vs 1 GitHub tab -> YouTube favicon
    expect(placeholder.favIconUrl).toBe('https://youtube.com/favicon.ico')

    // Add 2 more GitHub tabs -> now 3 GitHub tabs vs 2 YouTube tabs
    const child4 = {
      id: 104,
      index: 4,
      lvl: 1,
      parentId: 100,
      url: 'https://github.com/another/repo',
      favIconUrl: 'https://github.com/favicon.ico',
    } as Tab
    const child5 = {
      id: 105,
      index: 5,
      lvl: 1,
      parentId: 100,
      url: 'https://github.com/third/repo',
      favIconUrl: 'https://github.com/favicon.ico',
    } as Tab

    Tabs.list.push(child4, child5)
    Tabs.byId[104] = child4
    Tabs.byId[105] = child5

    DomainTrees.updateDomainTreeFavicon(placeholder)
    // 3 GitHub tabs vs 2 YouTube tabs -> GitHub favicon
    expect(placeholder.favIconUrl).toBe('https://github.com/favicon.ico')
  })

  test('cleanEmptyDomainTrees deletes empty placeholders', async () => {
    Settings.state.domainTrees = true

    const emptyPlaceholder = {
      id: 200,
      index: 0,
      lvl: 0,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('empty', 'Empty Tree'),
    } as Tab

    const fullPlaceholder = {
      id: 201,
      index: 1,
      lvl: 0,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('full', 'Full Tree'),
    } as Tab

    const child1 = {
      id: 202,
      index: 2,
      lvl: 1,
      parentId: 201,
      url: 'https://full.com/page1',
    } as Tab

    const child2 = {
      id: 203,
      index: 3,
      lvl: 1,
      parentId: 201,
      url: 'https://full.com/page2',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(emptyPlaceholder, fullPlaceholder, child1, child2)
    Tabs.byId[200] = emptyPlaceholder
    Tabs.byId[201] = fullPlaceholder
    Tabs.byId[202] = child1
    Tabs.byId[203] = child2

    const removedIds: (number | string)[] = []
    const spy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
    })

    await DomainTrees.cleanEmptyDomainTrees()

    expect(removedIds).toEqual([200])

    spy.mockRestore()
  })

  test('checkEmptyOrSinglePlaceholder dissolves top-level tree with 1 tab and moves tab up to NOID', async () => {
    Settings.state.domainTrees = true

    const placeholder = {
      id: 250,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('single', 'Single Tree'),
      parentId: -1,
    } as Tab

    const singleChild = {
      id: 251,
      index: 1,
      lvl: 1,
      panelId: 'default',
      parentId: 250,
      url: 'https://single.com/page',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(placeholder, singleChild)
    Tabs.byId[250] = placeholder
    Tabs.byId[251] = singleChild

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
    })

    const movedCalls: any[] = []
    const moveSpy = vi.spyOn(Tabs, 'move').mockImplementation(async (tabs: any, _, dst: any) => {
      movedCalls.push({ tabs, dst })
      for (const t of tabs) {
        t.parentId = dst.parentId
        t.index = dst.index
      }
    })

    await DomainTrees.checkEmptyOrSinglePlaceholder(250)

    // The single child tab should be moved up to parentId: -1 (NOID)
    expect(movedCalls.length).toBe(1)
    expect(movedCalls[0].dst.parentId).toBe(-1)
    expect(movedCalls[0].dst.index).toBe(0)
    expect(movedCalls[0].tabs[0].id).toBe(251)

    // The placeholder should be removed
    expect(removedIds).toEqual([250])

    rmSpy.mockRestore()
    moveSpy.mockRestore()
  })

  test('checkEmptyOrSinglePlaceholder dissolves nested sub-tree with 1 tab and moves tab up to parent placeholder', async () => {
    Settings.state.domainTrees = true

    const parentPlaceholder = {
      id: 260,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('parent', 'Parent Tree'),
      parentId: -1,
    } as Tab

    const parentChild = {
      id: 263,
      index: 1,
      lvl: 1,
      panelId: 'default',
      parentId: 260,
      url: 'https://parent.com/page1',
    } as Tab

    const subPlaceholder = {
      id: 261,
      index: 2,
      lvl: 1,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('sub', 'Sub Tree'),
      parentId: 260,
    } as Tab

    const singleSubChild = {
      id: 262,
      index: 3,
      lvl: 2,
      panelId: 'default',
      parentId: 261,
      url: 'https://sub.parent.com/page',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(parentPlaceholder, parentChild, subPlaceholder, singleSubChild)
    Tabs.byId[260] = parentPlaceholder
    Tabs.byId[263] = parentChild
    Tabs.byId[261] = subPlaceholder
    Tabs.byId[262] = singleSubChild

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
      for (const id of ids) {
        delete Tabs.byId[id]
        const idx = Tabs.list.findIndex(t => t.id === id)
        if (idx !== -1) Tabs.list.splice(idx, 1)
      }
    })

    const movedCalls: any[] = []
    const moveSpy = vi.spyOn(Tabs, 'move').mockImplementation(async (tabs: any, _, dst: any) => {
      movedCalls.push({ tabs, dst })
      for (const t of tabs) {
        t.parentId = dst.parentId
        t.index = dst.index
      }
    })

    await DomainTrees.checkEmptyOrSinglePlaceholder(261)

    // The single sub-child should be moved up to parentPlaceholder (parentId: 260)
    expect(movedCalls.length).toBe(1)
    expect(movedCalls[0].dst.parentId).toBe(260)
    expect(movedCalls[0].tabs[0].id).toBe(262)

    // Sub-placeholder 261 should be removed, while parent 260 remains (still has 2 tabs)
    expect(removedIds).toEqual([261])

    rmSpy.mockRestore()
    moveSpy.mockRestore()
  })

  test('getLastActiveChild returns recorded or highest lastAccessed child', () => {
    Settings.state.domainTrees = true

    const placeholder = {
      id: 300,
      index: 0,
      lvl: 0,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('test', 'Test Tree'),
    } as Tab

    const child1 = {
      id: 301,
      index: 1,
      lvl: 1,
      parentId: 300,
      url: 'https://test.com/1',
      lastAccessed: 1000,
    } as Tab

    const child2 = {
      id: 302,
      index: 2,
      lvl: 1,
      parentId: 300,
      url: 'https://test.com/2',
      lastAccessed: 2000,
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(placeholder, child1, child2)
    Tabs.byId[300] = placeholder
    Tabs.byId[301] = child1
    Tabs.byId[302] = child2

    // Without explicit recorded child, child2 has highest lastAccessed (2000 > 1000)
    expect(DomainTrees.getLastActiveChild(placeholder)?.id).toBe(302)

    // User navigates / activates child1
    DomainTrees.recordActiveChild(child1)
    expect(DomainTrees.getLastActiveChild(placeholder)?.id).toBe(301)

    // User activates child2
    DomainTrees.recordActiveChild(child2)
    expect(DomainTrees.getLastActiveChild(placeholder)?.id).toBe(302)
  })

  test('getSubDomainKey correctly identifies sub-domains and external domains under tree', () => {
    browser.publicSuffix.getDomain = (h: string) => h.split('.').slice(-2).join('.')
    Settings.state.domainTrees = true

    // Direct match under parent -> null (stays directly under parent tree)
    expect(DomainTrees.getSubDomainKey('https://www.google.com/search', 'google.com')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://google.com/', 'google.com')).toBeNull()

    // Subdomain under parent -> sub-key is subdomain, title is sub-part
    const docs = DomainTrees.getSubDomainKey('https://docs.google.com/document/d/1', 'google.com')
    expect(docs).not.toBeNull()
    expect(docs?.subKey).toBe('docs.google.com')
    expect(docs?.title).toBe('Docs')

    // Subdomain under custom rule named YouTube
    const music = DomainTrees.getSubDomainKey('https://music.youtube.com', 'youtube')
    expect(music).not.toBeNull()
    expect(music?.subKey).toBe('music.youtube.com')
    expect(music?.title).toBe('Music')

    // External domain under YouTube tree (e.g. google.com under youtube)
    const googleUnderYt = DomainTrees.getSubDomainKey('https://google.com/search', 'youtube.com')
    expect(googleUnderYt).not.toBeNull()
    expect(googleUnderYt?.subKey).toBe('google.com')
    expect(googleUnderYt?.title).toBe('Google')
  })

  test('getAncestorDomainTree and getImmediateDomainTree traverse tree correctly', () => {
    const ytPlaceholder = {
      id: 400,
      index: 0,
      lvl: 0,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('youtube.com', 'YouTube'),
      parentId: -1,
    } as Tab

    const googlePlaceholder = {
      id: 401,
      index: 1,
      lvl: 1,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('google.com', 'Google'),
      parentId: 400,
    } as Tab

    const leafTab = {
      id: 402,
      index: 2,
      lvl: 2,
      url: 'https://google.com/search',
      parentId: 401,
    } as Tab

    Tabs.byId[400] = ytPlaceholder
    Tabs.byId[401] = googlePlaceholder
    Tabs.byId[402] = leafTab

    expect(DomainTrees.getAncestorDomainTree(leafTab)?.id).toBe(400)
    expect(DomainTrees.getImmediateDomainTree(leafTab)?.id).toBe(401)
  })

  test('scanSubDomainTrees groups 2+ tabs of google.com under youtube tree when no custom rule exists', async () => {
    browser.publicSuffix.getDomain = (h: string) => h.split('.').slice(-2).join('.')
    Settings.state.domainTrees = true
    Settings.state.domainTreesUniversal = true
    Settings.state.domainTreeRules = []

    Sidebar.panelsById['default'] = {
      id: 'default',
      type: PanelType.tabs,
      tabs: [],
      reactive: { visibleTabIds: [] },
    } as any
    vi.spyOn(Tabs, 'foldTabsBranch').mockImplementation(() => {})

    const ytPlaceholder = {
      id: 500,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('youtube.com', 'YouTube'),
      parentId: -1,
    } as Tab

    const ytTab = {
      id: 501,
      index: 1,
      lvl: 1,
      panelId: 'default',
      parentId: 500,
      url: 'https://youtube.com/watch?v=1',
    } as Tab

    const googleTab1 = {
      id: 502,
      index: 2,
      lvl: 1,
      panelId: 'default',
      parentId: 500,
      url: 'https://google.com/search?q=1',
    } as Tab

    const googleTab2 = {
      id: 503,
      index: 3,
      lvl: 1,
      panelId: 'default',
      parentId: 500,
      url: 'https://google.com/search?q=2',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(ytPlaceholder, ytTab, googleTab1, googleTab2)
    Tabs.byId[500] = ytPlaceholder
    Tabs.byId[501] = ytTab
    Tabs.byId[502] = googleTab1
    Tabs.byId[503] = googleTab2

    const subPlaceholderTab = {
      id: 504,
      index: 2,
      lvl: 1,
      panelId: 'default',
      parentId: 500,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('google.com', 'Google'),
      reactive: {} as any,
    } as Tab

    browser.tabs.create = (async () => {
      Tabs.list.push(subPlaceholderTab)
      Tabs.byId[504] = subPlaceholderTab
      return { id: 504 }
    }) as any

    const movedCalls: any[] = []
    const moveSpy = vi.spyOn(Tabs, 'move').mockImplementation(async (tabs: any, _, dst: any) => {
      movedCalls.push({ tabs, dst })
      for (const t of tabs) {
        t.parentId = dst.parentId
      }
    })

    await DomainTrees.scanSubDomainTrees(ytPlaceholder)

    // A sub-placeholder should be created and google tabs moved under it
    expect(movedCalls.length).toBeGreaterThanOrEqual(1)
    const attachCall = movedCalls.find(c => c.dst.parentId === 504)
    expect(attachCall).toBeDefined()
    expect(attachCall.tabs.map((t: Tab) => t.id)).toEqual([502, 503])

    moveSpy.mockRestore()
  })

  test('scanSubDomainTrees unparents google.com tabs from youtube tree when a custom rule for google.com exists', async () => {
    browser.publicSuffix.getDomain = (h: string) => h.split('.').slice(-2).join('.')
    Settings.state.domainTrees = true
    Settings.state.domainTreesUniversal = true
    Settings.state.domainTreeRules = [
      {
        id: 'google_rule',
        active: true,
        name: 'Google',
        url: 'google.com',
      },
    ]

    Sidebar.panelsById['default'] = { id: 'default', type: PanelType.tabs, tabs: [] } as any

    const ytPlaceholder = {
      id: 600,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('youtube.com', 'YouTube'),
      parentId: -1,
    } as Tab

    const googleTab = {
      id: 601,
      index: 1,
      lvl: 1,
      panelId: 'default',
      parentId: 600,
      url: 'https://google.com/search?q=test',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(ytPlaceholder, googleTab)
    Tabs.byId[600] = ytPlaceholder
    Tabs.byId[601] = googleTab

    const unparentedCalls: any[] = []
    const moveSpy = vi.spyOn(Tabs, 'move').mockImplementation(async (tabs: any, _, dst: any) => {
      unparentedCalls.push({ tabs, dst })
      for (const t of tabs) {
        t.parentId = dst.parentId
      }
    })

    await DomainTrees.scanSubDomainTrees(ytPlaceholder)

    // Because a custom rule for google.com exists, it must break out of the youtube tree (dst.parentId: -1)
    const breakoutCall = unparentedCalls.find(c => c.dst.parentId === -1)
    expect(breakoutCall).toBeDefined()
    expect(breakoutCall.tabs[0].id).toBe(601)

    moveSpy.mockRestore()
  })

  test('deduplicateDomainTrees consolidates duplicate domain tree placeholders', async () => {
    Settings.state.domainTrees = true
    Sidebar.panelsById['default'] = { id: 'default', type: PanelType.tabs, tabs: [] } as any

    const ph1 = {
      id: 700,
      index: 0,
      lvl: 0,
      panelId: 'default',
      parentId: -1,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('youtube.com', 'YouTube'),
    } as Tab

    const child1 = {
      id: 701,
      index: 1,
      lvl: 1,
      panelId: 'default',
      parentId: 700,
      url: 'https://youtube.com/watch?v=1',
    } as Tab

    const ph2 = {
      id: 702,
      index: 2,
      lvl: 0,
      panelId: 'default',
      parentId: -1,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('youtube.com', 'YouTube'),
    } as Tab

    const child2 = {
      id: 703,
      index: 3,
      lvl: 1,
      panelId: 'default',
      parentId: 702,
      url: 'https://youtube.com/watch?v=2',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(ph1, child1, ph2, child2)
    Tabs.byId[700] = ph1
    Tabs.byId[701] = child1
    Tabs.byId[702] = ph2
    Tabs.byId[703] = child2

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
    })

    const movedCalls: any[] = []
    const moveSpy = vi.spyOn(Tabs, 'move').mockImplementation(async (tabs: any, _, dst: any) => {
      movedCalls.push({ tabs, dst })
    })

    await DomainTrees.deduplicateDomainTrees('default')

    // child2 should be moved under ph1
    expect(movedCalls.length).toBe(1)
    expect(movedCalls[0].dst.parentId).toBe(700)
    expect(movedCalls[0].tabs[0].id).toBe(703)

    // ph2 should be removed
    expect(removedIds).toEqual([702])

    rmSpy.mockRestore()
    moveSpy.mockRestore()
  })

  test('checkEmptyOrSinglePlaceholder does not dissolve top-level tree if another tab of same domain exists in panel', async () => {
    browser.publicSuffix.getDomain = (h: string) => h.split('.').slice(-2).join('.')
    Settings.state.domainTrees = true
    Settings.state.domainTreesUniversal = true
    Sidebar.panelsById['default'] = { id: 'default', type: PanelType.tabs, tabs: [] } as any

    const placeholder = {
      id: 800,
      index: 0,
      lvl: 0,
      panelId: 'default',
      parentId: -1,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('youtube.com', 'YouTube'),
    } as Tab

    const child1 = {
      id: 801,
      index: 1,
      lvl: 1,
      panelId: 'default',
      parentId: 800,
      url: 'https://youtube.com/watch?v=1',
    } as Tab

    // Tab 802 is an unpinned YouTube tab outside the tree
    const unpinnedChild = {
      id: 802,
      index: 2,
      lvl: 0,
      panelId: 'default',
      parentId: -1,
      url: 'https://youtube.com/watch?v=2',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(placeholder, child1, unpinnedChild)
    Tabs.byId[800] = placeholder
    Tabs.byId[801] = child1
    Tabs.byId[802] = unpinnedChild

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
    })

    const movedCalls: any[] = []
    const moveSpy = vi.spyOn(Tabs, 'move').mockImplementation(async (tabs: any, _, dst: any) => {
      movedCalls.push({ tabs, dst })
    })

    await DomainTrees.checkEmptyOrSinglePlaceholder(800)

    // Tree should NOT be dissolved because there are 2 total YouTube tabs in the panel!
    expect(removedIds.length).toBe(0)
    // Instead, the unattached tab should be attached under placeholder
    expect(movedCalls.length).toBe(1)
    expect(movedCalls[0].dst.parentId).toBe(800)
    expect(movedCalls[0].tabs[0].id).toBe(802)

    rmSpy.mockRestore()
    moveSpy.mockRestore()
  })

  test('matchDomain and getSubDomainKey reject sidebery internal and group URLs', () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreesUniversal = true

    expect(DomainTrees.matchDomain('moz-extension://ext-uuid/sidebery/group.html')).toBeNull()
    expect(DomainTrees.matchDomain('moz-extension://ext-uuid/sidebery/group.html?dt=youtube.com')).toBeNull()
    expect(DomainTrees.matchDomain('moz-extension://ext-uuid/sidebery/url.html')).toBeNull()
    expect(DomainTrees.getSubDomainKey('moz-extension://ext-uuid/sidebery/group.html', 'youtube.com')).toBeNull()
  })

  test('logging records entries, formats them, and allows clearing', async () => {
    await DomainTrees.clearLogs()
    expect(DomainTrees.getLogsArray().length).toBe(1) // "Logs cleared by user" message

    DomainTrees.log('INFO', 'TestTag', 'Test message 123', { key: 'val' })
    const logs = DomainTrees.getLogsArray()
    expect(logs.length).toBe(2)
    expect(logs[1].tag).toBe('TestTag')
    expect(logs[1].message).toBe('Test message 123')
    expect(logs[1].details).toEqual({ key: 'val' })

    const formatted = DomainTrees.getLogsFormatted()
    expect(formatted).toContain('[INFO]')
    expect(formatted).toContain('[TestTag] Test message 123')
    expect(formatted).toContain('{"key":"val"}')

    await DomainTrees.clearLogs()
    expect(DomainTrees.getLogsArray().length).toBe(1)
  })

  test('isCustomRuleDomainKey recognizes custom rule by name or primary domain', () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreeRules = [
      {
        id: 'media_rule',
        name: 'Media',
        active: true,
        url: 'youtube|youtu.be|spotify|bandcamp',
      },
      {
        id: 'docs_rule',
        active: true,
        url: 'docs.google.com',
      },
    ]

    expect(DomainTrees.isCustomRuleDomainKey('media')).toBe(true)
    expect(DomainTrees.isCustomRuleDomainKey('Media')).toBe(true)
    expect(DomainTrees.isCustomRuleDomainKey('docs.google.com')).toBe(true)
    expect(DomainTrees.isCustomRuleDomainKey('random.com')).toBe(false)
  })

  test('getCanonicalDomain normalizes aliases', () => {
    expect(DomainTrees.getCanonicalDomain('youtu.be')).toBe('youtube.com')
    expect(DomainTrees.getCanonicalDomain('www.youtube.com')).toBe('youtube.com')
    expect(DomainTrees.getCanonicalDomain('m.youtube.com')).toBe('youtube.com')
    expect(DomainTrees.getCanonicalDomain('x.com')).toBe('twitter.com')
    expect(DomainTrees.getCanonicalDomain('open.spotify.com')).toBe('spotify.com')
  })

  test('checkEmptyOrSinglePlaceholder preserves custom rule root with 1 child tab', async () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreeRules = [
      {
        id: 'media_rule',
        name: 'Media',
        active: true,
        url: 'youtube|youtu.be|spotify|bandcamp',
      },
    ]

    const placeholder = {
      id: 900,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('media', 'Media'),
      parentId: -1,
    } as Tab

    const singleChild = {
      id: 901,
      index: 1,
      lvl: 1,
      panelId: 'default',
      parentId: 900,
      url: 'https://open.spotify.com/track/123',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(placeholder, singleChild)
    Tabs.byId[900] = placeholder
    Tabs.byId[901] = singleChild

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
    })

    const moveSpy = vi.spyOn(Tabs, 'move').mockImplementation(async () => {})

    await DomainTrees.checkEmptyOrSinglePlaceholder(900)

    // The custom root placeholder should NOT be removed!
    expect(removedIds.length).toBe(0)
    // Child tab should NOT be moved!
    expect(singleChild.parentId).toBe(900)

    rmSpy.mockRestore()
    moveSpy.mockRestore()
  })

  test('checkEmptyOrSinglePlaceholder preserves custom rule root even with 0 child tabs', async () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreeRules = [
      {
        id: 'media_rule',
        name: 'Media',
        active: true,
        url: 'youtube|youtu.be|spotify|bandcamp',
      },
    ]

    const placeholder = {
      id: 900,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('media', 'Media'),
      parentId: -1,
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(placeholder)
    Tabs.byId[900] = placeholder

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
    })

    await DomainTrees.checkEmptyOrSinglePlaceholder(900)

    // The custom root placeholder should NOT be removed!
    expect(removedIds.length).toBe(0)

    rmSpy.mockRestore()
  })

  test('checkEmptyOrSinglePlaceholder deletes empty non-rule domain tree placeholder', async () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreeRules = []

    const placeholder = {
      id: 910,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('youtube.com', 'YouTube'),
      parentId: -1,
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(placeholder)
    Tabs.byId[910] = placeholder

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
    })

    await DomainTrees.checkEmptyOrSinglePlaceholder(910)

    expect(removedIds).toContain(910)

    rmSpy.mockRestore()
  })

  test('checkEmptyOrSinglePlaceholder deletes empty pinned auto group tab', async () => {
    Settings.state.domainTrees = true

    const pinnedTab = {
      id: 50,
      pinned: true,
      relGroupId: 920,
    } as Tab

    const pinnedGroup = {
      id: 920,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: Utils.createGroupUrl('Pinned Tab', 'https://pinned.com'),
      parentId: -1,
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(pinnedTab, pinnedGroup)
    Tabs.byId[50] = pinnedTab
    Tabs.byId[920] = pinnedGroup

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
    })

    await DomainTrees.checkEmptyOrSinglePlaceholder(920)

    expect(removedIds).toContain(920)
    expect(pinnedTab.relGroupId).toBe(-1)

    rmSpy.mockRestore()
  })

  test('moving tab from pinned auto-group tree into existing domain tree deletes empty group tree', async () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreeRules = []

    const panel: any = {
      id: 'default',
      type: PanelType.tabs,
      tabs: [],
      startTabIndex: 0,
      nextTabIndex: 4,
    }
    Sidebar.panelsById['default'] = panel

    const domainPlaceholder = {
      id: 100,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('github.com', 'GitHub'),
      parentId: -1,
    } as Tab

    const existingChild = {
      id: 101,
      index: 1,
      lvl: 1,
      panelId: 'default',
      parentId: 100,
      url: 'https://github.com/mbnuqw/sidebery',
    } as Tab

    const pinnedGroup = {
      id: 200,
      index: 2,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: Utils.createGroupUrl('Pinned Opener', 'https://twitter.com'),
      parentId: -1,
    } as Tab

    const newTabFromPin = {
      id: 201,
      index: 3,
      lvl: 1,
      panelId: 'default',
      parentId: 200,
      url: 'https://github.com/another/repo',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(domainPlaceholder, existingChild, pinnedGroup, newTabFromPin)
    Tabs.byId[100] = domainPlaceholder
    Tabs.byId[101] = existingChild
    Tabs.byId[200] = pinnedGroup
    Tabs.byId[201] = newTabFromPin

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
      for (const id of ids) {
        delete Tabs.byId[id]
        const idx = Tabs.list.findIndex(t => t.id === id)
        if (idx !== -1) Tabs.list.splice(idx, 1)
      }
    })

    const moveSpy = vi.spyOn(Tabs, 'move').mockImplementation(async (tabs: any, _config: any, dst: any) => {
      for (const t of tabs) {
        t.parentId = dst.parentId
        t.panelId = dst.panelId
        const oldIdx = Tabs.list.findIndex(x => x.id === t.id)
        if (oldIdx !== -1) {
          Tabs.list.splice(oldIdx, 1)
          Tabs.list.splice(dst.index, 0, t)
        }
      }
      for (let i = 0; i < Tabs.list.length; i++) {
        Tabs.list[i].index = i
      }
    })

    await DomainTrees.handleDomainTab(201)

    // The new tab should be moved under domainPlaceholder 100
    expect(newTabFromPin.parentId).toBe(100)
    // The pinnedGroup 200 was left with 0 children and must be removed!
    expect(removedIds).toContain(200)

    rmSpy.mockRestore()
    moveSpy.mockRestore()
  })

  test('onTabRemovedCheck deletes empty group tree when child tab is removed', async () => {
    Settings.state.domainTrees = true

    const groupTab = {
      id: 300,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: Utils.createGroupUrl('Group', 'https://pinned.com'),
      parentId: -1,
    } as Tab

    const childTab = {
      id: 301,
      index: 1,
      lvl: 1,
      panelId: 'default',
      parentId: 300,
      url: 'https://example.com',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(groupTab) // childTab is removed from list
    Tabs.byId[300] = groupTab

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
    })

    await DomainTrees.onTabRemovedCheck(childTab)

    expect(removedIds).toContain(300)

    rmSpy.mockRestore()
  })

  test('cleanEmptyDomainTrees deletes empty group tabs while preserving empty custom rule trees', async () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreeRules = [
      { id: 'rule_media', name: 'Media', active: true, url: 'youtube|spotify' },
    ]

    const emptyNonRuleDomain = {
      id: 400,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('random.com', 'Random'),
      parentId: -1,
    } as Tab

    const emptyGroup = {
      id: 401,
      index: 1,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: Utils.createGroupUrl('Pinned Group', 'https://pinned.com'),
      parentId: -1,
    } as Tab

    const emptyRuleTree = {
      id: 402,
      index: 2,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('media', 'Media'),
      parentId: -1,
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(emptyNonRuleDomain, emptyGroup, emptyRuleTree)
    Tabs.byId[400] = emptyNonRuleDomain
    Tabs.byId[401] = emptyGroup
    Tabs.byId[402] = emptyRuleTree

    const removedIds: (number | string)[] = []
    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      removedIds.push(...ids)
    })

    await DomainTrees.cleanEmptyDomainTrees()

    expect(removedIds).toContain(400)
    expect(removedIds).toContain(401)
    expect(removedIds).not.toContain(402)

    rmSpy.mockRestore()
  })

  test('scanSubDomainTrees creates daughter trees for 2+ tabs of domain and keeps 1 tab orphaned under meta-root', async () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreeRules = [
      {
        id: 'media_rule',
        name: 'Media',
        active: true,
        url: 'youtube|youtu.be|spotify|bandcamp',
      },
    ]

    Sidebar.panelsById['default'] = {
      id: 'default',
      type: PanelType.tabs,
      tabs: [],
      reactive: { visibleTabIds: [] },
    } as any
    vi.spyOn(Tabs, 'foldTabsBranch').mockImplementation(() => {})

    const rmSpy = vi.spyOn(Tabs, 'removeTabs').mockImplementation(async (ids: any) => {
      for (const id of ids) {
        delete Tabs.byId[id]
        const idx = Tabs.list.findIndex(t => t.id === id)
        if (idx !== -1) Tabs.list.splice(idx, 1)
      }
      for (let i = 0; i < Tabs.list.length; i++) {
        Tabs.list[i].index = i
      }
    })

    const mediaRoot = {
      id: 950,
      index: 0,
      lvl: 0,
      panelId: 'default',
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('media', 'Media'),
      parentId: -1,
    } as Tab

    const yt1 = {
      id: 951,
      index: 1,
      lvl: 1,
      panelId: 'default',
      parentId: 950,
      url: 'https://www.youtube.com/watch?v=1',
    } as Tab

    const yt2 = {
      id: 952,
      index: 2,
      lvl: 1,
      panelId: 'default',
      parentId: 950,
      url: 'https://www.youtube.com/watch?v=2',
    } as Tab

    const yt3 = {
      id: 953,
      index: 3,
      lvl: 1,
      panelId: 'default',
      parentId: 950,
      url: 'https://youtu.be/3',
    } as Tab

    const spotify1 = {
      id: 954,
      index: 4,
      lvl: 1,
      panelId: 'default',
      parentId: 950,
      url: 'https://open.spotify.com/track/abc',
    } as Tab

    Tabs.list.length = 0
    Tabs.list.push(mediaRoot, yt1, yt2, yt3, spotify1)
    Tabs.byId[950] = mediaRoot
    Tabs.byId[951] = yt1
    Tabs.byId[952] = yt2
    Tabs.byId[953] = yt3
    Tabs.byId[954] = spotify1

    let nextId = 960
    browser.tabs.create = vi.fn().mockImplementation(async (createData: any) => {
      const id = nextId++
      const newTab: Tab = {
        id,
        index: createData.index ?? Tabs.list.length,
        lvl: 1,
        url: createData.url,
        panelId: 'default',
        parentId: 950,
        isGroup: true,
        reactive: {} as any,
      } as Tab
      Tabs.byId[id] = newTab
      Tabs.list.splice(newTab.index, 0, newTab)
      for (let i = 0; i < Tabs.list.length; i++) {
        Tabs.list[i].index = i
      }
      return { id, index: newTab.index } as any
    })

    const moveSpy = vi.spyOn(Tabs, 'move').mockImplementation(async (tabs: any, _, dst: any) => {
      for (const t of tabs) {
        t.parentId = dst.parentId
        t.lvl = dst.parentId === 950 ? 1 : 2
        const curIdx = Tabs.list.indexOf(t)
        if (curIdx !== -1) Tabs.list.splice(curIdx, 1)
        const parentIdx = Tabs.list.findIndex(p => p.id === dst.parentId)
        Tabs.list.splice(parentIdx + 1, 0, t)
      }
      for (let i = 0; i < Tabs.list.length; i++) {
        Tabs.list[i].index = i
      }
    })

    await DomainTrees.scanSubDomainTrees(mediaRoot)

    // A daughter placeholder for YouTube should have been created
    const ytPlaceholder = Tabs.list.find(
      t => DomainTrees.isDomainTreeGroup(t) && DomainTrees.getDomainTreeKey(t) === 'youtube.com'
    )
    expect(ytPlaceholder).toBeDefined()
    expect(ytPlaceholder?.parentId).toBe(950)

    // The 3 YouTube tabs should be moved under the YouTube daughter placeholder
    expect(yt1.parentId).toBe(ytPlaceholder!.id)
    expect(yt2.parentId).toBe(ytPlaceholder!.id)
    expect(yt3.parentId).toBe(ytPlaceholder!.id)

    // The single Spotify tab should REMAIN orphaned directly under mediaRoot (id: 950)
    expect(spotify1.parentId).toBe(950)

    // No daughter placeholder for Spotify should exist yet
    const spotifyPlaceholder = Tabs.list.find(
      t => DomainTrees.isDomainTreeGroup(t) && DomainTrees.getDomainTreeKey(t) === 'spotify.com'
    )
    expect(spotifyPlaceholder).toBeUndefined()

    // Now open a 2nd Spotify tab
    const spotify2 = {
      id: 955,
      index: Tabs.list.length,
      lvl: 1,
      panelId: 'default',
      parentId: 950,
      url: 'https://open.spotify.com/track/xyz',
    } as Tab
    Tabs.list.push(spotify2)
    Tabs.byId[955] = spotify2
    for (let i = 0; i < Tabs.list.length; i++) {
      Tabs.list[i].index = i
    }

    await DomainTrees.scanSubDomainTrees(mediaRoot)

    // Now a daughter placeholder for Spotify SHOULD be created!
    const spotifyDaughter = Tabs.list.find(
      t => DomainTrees.isDomainTreeGroup(t) && DomainTrees.getDomainTreeKey(t) === 'spotify.com'
    )
    expect(spotifyDaughter).toBeDefined()
    expect(spotifyDaughter?.parentId).toBe(950)

    // Both Spotify tabs should now be under the Spotify daughter placeholder
    expect(spotify1.parentId).toBe(spotifyDaughter!.id)
    expect(spotify2.parentId).toBe(spotifyDaughter!.id)

    rmSpy.mockRestore()
    moveSpy.mockRestore()
  })

  test('domainMatchesPattern matches regardless of language or mirror prefixes', () => {
    // Rule: "youtube"
    expect(DomainTrees.domainMatchesPattern('br.youtube.com', 'https://br.youtube.com/watch', 'youtube')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('pt.youtube.com', 'https://pt.youtube.com/watch', 'youtube')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('www.youtube.com', 'https://www.youtube.com/watch', 'youtube')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('youtube.com', 'https://youtube.com/watch', 'youtube')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('m.youtube.com', 'https://m.youtube.com/watch', 'youtube')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('youtu.be', 'https://youtu.be/abc', 'youtube')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('google.com', 'https://google.com/?q=youtube', 'youtube')).toBe(false)

    // Rule: "youtube.com"
    expect(DomainTrees.domainMatchesPattern('br.youtube.com', 'https://br.youtube.com/watch', 'youtube.com')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('pt.youtube.com', 'https://pt.youtube.com/watch', 'youtube.com')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('www.youtube.com', 'https://www.youtube.com/watch', 'youtube.com')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('youtube.com', 'https://youtube.com/watch', 'youtube.com')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('youtu.be', 'https://youtu.be/abc', 'youtube.com')).toBe(true)
  })

  test('matchCustomRule captures br.youtube.com, pt.youtube.com, www.youtube.com under "youtube" rule', () => {
    Settings.state.domainTrees = true
    Settings.state.domainTreeRules = [
      { id: 'r1', active: true, url: 'youtube' },
    ]

    const brMatch = DomainTrees.matchCustomRule('https://br.youtube.com/watch?v=123')
    expect(brMatch).toEqual({ domainKey: 'youtube', title: 'YouTube' })

    const ptMatch = DomainTrees.matchCustomRule('https://pt.youtube.com/watch?v=456')
    expect(ptMatch).toEqual({ domainKey: 'youtube', title: 'YouTube' })

    const wwwMatch = DomainTrees.matchCustomRule('https://www.youtube.com/watch?v=789')
    expect(wwwMatch).toEqual({ domainKey: 'youtube', title: 'YouTube' })

    const bareMatch = DomainTrees.matchCustomRule('https://youtube.com/watch?v=000')
    expect(bareMatch).toEqual({ domainKey: 'youtube', title: 'YouTube' })
  })

  test('getSubDomainKey ignores language/mirror prefixes under parent domain tree', () => {
    Settings.state.domainTrees = true

    // Under a "youtube" or "youtube.com" tree, regional prefixes belong directly to parent (return null)
    expect(DomainTrees.getSubDomainKey('https://br.youtube.com/watch', 'youtube')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://pt.youtube.com/watch', 'youtube')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://www.youtube.com/watch', 'youtube')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://m.youtube.com/watch', 'youtube')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://youtube.com/watch', 'youtube')).toBeNull()

    expect(DomainTrees.getSubDomainKey('https://br.youtube.com/watch', 'youtube.com')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://pt.youtube.com/watch', 'youtube.com')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://www.youtube.com/watch', 'youtube.com')).toBeNull()

    // Meaningful sub-service like music.youtube.com gets its own daughter tree
    const musicSub = DomainTrees.getSubDomainKey('https://music.youtube.com/watch', 'youtube')
    expect(musicSub).toEqual({ subKey: 'music.youtube.com', title: 'Music' })

    // Inside a Category tree (e.g. Media), br.youtube.com and pt.youtube.com both resolve to canonical youtube.com
    const mediaBr = DomainTrees.getSubDomainKey('https://br.youtube.com/watch', 'media')
    expect(mediaBr).toEqual({ subKey: 'youtube.com', title: 'YouTube' })

    const mediaPt = DomainTrees.getSubDomainKey('https://pt.youtube.com/watch', 'media')
    expect(mediaPt).toEqual({ subKey: 'youtube.com', title: 'YouTube' })
  })

  test('prefix matching and daughter trees work across other domains (Wikipedia, Amazon, Reddit, etc.)', () => {
    Settings.state.domainTrees = true

    // --- Wikipedia ---
    expect(DomainTrees.domainMatchesPattern('pt.wikipedia.org', 'https://pt.wikipedia.org/wiki/Test', 'wikipedia')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('en.wikipedia.org', 'https://en.wikipedia.org/wiki/Test', 'wikipedia')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('m.wikipedia.org', 'https://m.wikipedia.org/wiki/Test', 'wikipedia')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('pt.wikipedia.org', 'https://pt.wikipedia.org/wiki/Test', 'wikipedia.org')).toBe(true)
    // Language prefixes stay under parent Wikipedia tree
    expect(DomainTrees.getSubDomainKey('https://pt.wikipedia.org/wiki/Test', 'wikipedia')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://en.wikipedia.org/wiki/Test', 'wikipedia')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://de.wikipedia.org/wiki/Test', 'wikipedia')).toBeNull()

    // --- Amazon ---
    expect(DomainTrees.domainMatchesPattern('de.amazon.com', 'https://de.amazon.com/dp/123', 'amazon')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('amazon.co.uk', 'https://amazon.co.uk/dp/123', 'amazon.com')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('amazon.com.br', 'https://amazon.com.br/dp/123', 'amazon.com')).toBe(true)
    // Country prefix de. stays under Amazon
    expect(DomainTrees.getSubDomainKey('https://de.amazon.com/dp/123', 'amazon')).toBeNull()
    // Sub-service music. gets its own daughter tree
    expect(DomainTrees.getSubDomainKey('https://music.amazon.com/listen', 'amazon')).toEqual({
      subKey: 'music.amazon.com',
      title: 'Music',
    })

    // --- Reddit ---
    expect(DomainTrees.domainMatchesPattern('old.reddit.com', 'https://old.reddit.com/r/firefox', 'reddit')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('redd.it', 'https://redd.it/abc', 'reddit.com')).toBe(true)
    expect(DomainTrees.getSubDomainKey('https://old.reddit.com/r/firefox', 'reddit')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://sh.reddit.com/r/firefox', 'reddit')).toBeNull()

    // --- Facebook & Meta ---
    expect(DomainTrees.domainMatchesPattern('fb.com', 'https://fb.com/page', 'facebook.com')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('m.facebook.com', 'https://m.facebook.com/home', 'facebook')).toBe(true)
    expect(DomainTrees.getSubDomainKey('https://m.facebook.com/home', 'facebook')).toBeNull()

    // --- Arbitrary custom domain / internal domains ---
    expect(DomainTrees.domainMatchesPattern('dev.mycompany.io', 'https://dev.mycompany.io', 'mycompany')).toBe(true)
    expect(DomainTrees.domainMatchesPattern('stage.mycompany.io', 'https://stage.mycompany.io', 'mycompany.io')).toBe(true)
    // Dev/stage prefixes ignored under mycompany
    expect(DomainTrees.getSubDomainKey('https://dev.mycompany.io', 'mycompany')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://stage.mycompany.io', 'mycompany')).toBeNull()
    expect(DomainTrees.getSubDomainKey('https://beta.mycompany.io', 'mycompany')).toBeNull()
    // Custom sub-app gets its own daughter tree
    expect(DomainTrees.getSubDomainKey('https://analytics.mycompany.io', 'mycompany')).toEqual({
      subKey: 'analytics.mycompany.io',
      title: 'Analytics',
    })
  })

  test('isNamedDomainRule and isNamedDomainTree detect named rules correctly', () => {
    Settings.state.domainTreeRules = [
      {
        id: 'rule_media',
        name: 'Media',
        active: true,
        url: 'youtube|spotify',
      },
    ]

    expect(DomainTrees.isNamedDomainRule('media')).toBe(true)
    expect(DomainTrees.isNamedDomainRule('Media')).toBe(true)
    expect(DomainTrees.isNamedDomainRule('rule_media')).toBe(true)
    expect(DomainTrees.isNamedDomainRule('youtube.com')).toBe(false)
    expect(DomainTrees.isNamedDomainRule('spotify')).toBe(false)

    const namedTab: Tab = {
      id: 1,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('media', 'Media'),
    } as Tab
    expect(DomainTrees.isNamedDomainTree(namedTab)).toBe(true)

    const subTreeTab: Tab = {
      id: 2,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('youtube.com', 'YouTube'),
    } as Tab
    expect(DomainTrees.isNamedDomainTree(subTreeTab)).toBe(false)

    const normalGroupTab: Tab = {
      id: 3,
      isGroup: true,
      url: 'moz-extension://uuid/sidebery/group.html#Normal',
    } as Tab
    expect(DomainTrees.isNamedDomainTree(normalGroupTab)).toBe(false)
  })

  test('getNamedDomainTreeInsertionIndex returns position after named domain trees at top', () => {
    const panelId = 'tabs_panel'
    const panel = {
      id: panelId,
      type: PanelType.tabs,
      startTabIndex: 0,
      nextTabIndex: 4,
    } as any
    Sidebar.panelsById[panelId] = panel

    Settings.state.domainTreeRules = [
      { id: 'rule_media', name: 'Media', active: true, url: 'youtube|spotify' },
    ]

    const mediaTab: Tab = {
      id: 10,
      index: 0,
      lvl: 0,
      parentId: -1,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('media', 'Media'),
      panelId,
    } as Tab
    const child1: Tab = {
      id: 11,
      index: 1,
      lvl: 1,
      parentId: 10,
      panelId,
    } as Tab
    const child2: Tab = {
      id: 12,
      index: 2,
      lvl: 1,
      parentId: 10,
      panelId,
    } as Tab
    const normalTab: Tab = {
      id: 13,
      index: 3,
      lvl: 0,
      parentId: -1,
      panelId,
    } as Tab

    Tabs.byId[10] = mediaTab
    Tabs.byId[11] = child1
    Tabs.byId[12] = child2
    Tabs.byId[13] = normalTab
    Tabs.list.length = 0
    Tabs.list.push(mediaTab, child1, child2, normalTab)

    expect(DomainTrees.getNamedDomainTreeInsertionIndex(panelId)).toBe(3)
  })

  test('ensureNamedDomainTreesAtTop moves named domain trees to the top of the panel', async () => {
    const panelId = 'tabs_panel'
    const panel = {
      id: panelId,
      type: PanelType.tabs,
      startTabIndex: 0,
      nextTabIndex: 3,
    } as any
    Sidebar.panelsById[panelId] = panel

    Settings.state.domainTreeRules = [
      { id: 'rule_media', name: 'Media', active: true, url: 'youtube|spotify' },
    ]

    const normalTab: Tab = {
      id: 20,
      index: 0,
      parentId: -1,
      panelId,
    } as Tab
    const mediaTab: Tab = {
      id: 21,
      index: 1,
      parentId: -1,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('media', 'Media'),
      panelId,
    } as Tab
    const mediaChild: Tab = {
      id: 22,
      index: 2,
      parentId: 21,
      panelId,
    } as Tab

    Tabs.byId[20] = normalTab
    Tabs.byId[21] = mediaTab
    Tabs.byId[22] = mediaChild
    Tabs.list.length = 0
    Tabs.list.push(normalTab, mediaTab, mediaChild)

    const moveSpy = vi.spyOn(Tabs, 'move').mockImplementation(async () => {})

    await DomainTrees.ensureNamedDomainTreesAtTop(panelId)

    expect(moveSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 21 })]),
      {},
      expect.objectContaining({ index: 0, panelId, parentId: -1 })
    )

    moveSpy.mockRestore()
  })

  test('getIndexForNewTab does not insert new tab above named domain trees', () => {
    const panelId = 'tabs_panel'
    const panel = {
      id: panelId,
      type: PanelType.tabs,
      startTabIndex: 0,
      nextTabIndex: 4,
    } as any
    Sidebar.panelsById[panelId] = panel

    Settings.state.domainTreeRules = [
      { id: 'rule_media', name: 'Media', active: true, url: 'youtube|spotify' },
    ]
    Settings.state.moveNewTab = 'start'

    const mediaTab: Tab = {
      id: 30,
      index: 0,
      lvl: 0,
      parentId: -1,
      isGroup: true,
      url: DomainTrees.createDomainTreeUrl('media', 'Media'),
      panelId,
    } as Tab
    const child1: Tab = {
      id: 31,
      index: 1,
      lvl: 1,
      parentId: 30,
      panelId,
    } as Tab
    const child2: Tab = {
      id: 32,
      index: 2,
      lvl: 1,
      parentId: 30,
      panelId,
    } as Tab
    const normalTab: Tab = {
      id: 33,
      index: 3,
      lvl: 0,
      parentId: -1,
      panelId,
    } as Tab

    Tabs.byId[30] = mediaTab
    Tabs.byId[31] = child1
    Tabs.byId[32] = child2
    Tabs.byId[33] = normalTab
    Tabs.list.length = 0
    Tabs.list.push(mediaTab, child1, child2, normalTab)

    const targetIdx = Tabs.getIndexForNewTab(panel)
    expect(targetIdx).toBe(3)
  })

  test('vibrantColorFromString generates high-saturation HSL color', () => {
    const col1 = Utils.vibrantColorFromString('media')
    const col2 = Utils.vibrantColorFromString('entertainment')

    expect(col1).toMatch(/^hsl\(\d+deg, \d+%, 48%\)$/)
    expect(col2).toMatch(/^hsl\(\d+deg, \d+%, 48%\)$/)

    const satMatch1 = col1.match(/hsl\(\d+deg,\s*(\d+)%,\s*48%\)/)
    const sat1 = parseInt(satMatch1?.[1] ?? '0', 10)
    expect(sat1).toBeGreaterThanOrEqual(88)

    const satMatch2 = col2.match(/hsl\(\d+deg,\s*(\d+)%,\s*48%\)/)
    const sat2 = parseInt(satMatch2?.[1] ?? '0', 10)
    expect(sat2).toBeGreaterThanOrEqual(88)
  })
})


