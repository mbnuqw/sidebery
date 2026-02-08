import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import * as Bookmarks from 'src/services/bookmarks.fg'
import * as Settings from 'src/services/settings'
import * as Sidebar from 'src/services/sidebar.fg'
import { addMTTab, resetMTabs, setDefaultMTabPanel } from 'src/defaults/mocks.tabs.fg'
import { PanelType } from 'src/enums'
import { addMPanel, resetMSidebar } from 'src/defaults/mocks.sidebar.fg'

describe('Bookmarks.BkmNode', () => {
  afterEach(() => {
    Bookmarks.unload()
  })

  test('set title', () => {
    const bkm = new Bookmarks.TESTING.BkmNode({ type: 'bookmark', id: 'abc', title: 'AAA' })
    bkm.setTitle('BBB')
    expect(bkm.parsedTitle).toBe('BBB')
  })

  test('set empty title', () => {
    const bkm = new Bookmarks.TESTING.BkmNode({ type: 'bookmark', id: 'abc', title: 'AAA' })
    bkm.setTitle('')
    expect(bkm.parsedTitle).toBe('')
  })

  test('addBkm', () => {
    const bkm = new Bookmarks.TESTING.BkmNode({ type: 'folder', id: 'a', title: 'A', children: [] })
    const b1 = new Bookmarks.TESTING.BkmNode({ type: 'bookmark', id: 'b1', title: 'b1' })
    const b2 = new Bookmarks.TESTING.BkmNode({ type: 'bookmark', id: 'b2', title: 'b2' })
    const b3 = new Bookmarks.TESTING.BkmNode({ type: 'bookmark', id: 'b3', title: 'b3' })
    bkm.addBkm(b1, 0)
    bkm.addBkm(b2, 0)
    bkm.addBkm(b3)
    expect(b1.index).toBe(1)
    expect(b2.index).toBe(0)
    expect(b3.index).toBe(2)
  })
})

describe('Bookmarks.getMouseOpeningConf()', () => {
  beforeEach(() => {
    Sidebar.setReadyState(true)
    addMPanel({ type: PanelType.tabs, id: 'a' })
    setDefaultMTabPanel('a')
    Sidebar.setActivePanelId('a')
  })

  afterEach(() => {
    Settings.resetSettings()
    resetMTabs()
    resetMSidebar()
  })

  test('new tab pos: left click: fallback to general settings', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.moveNewTab = 'after'
    Settings.state.bookmarksLeftClickAction = 'open_in_new'
    Settings.state.bookmarksLeftClickPos = 'default'

    const conf = Bookmarks.getMouseOpeningConf(0)
    expect(conf.dst.index).toBe(2)
    expect(conf.dst.parentId).toBe(2)
  })

  test('new tab pos: left click: fallback to general settings 2', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.moveNewTab = 'end'
    Settings.state.bookmarksLeftClickAction = 'open_in_new'
    Settings.state.bookmarksLeftClickPos = 'default'

    const conf = Bookmarks.getMouseOpeningConf(0)
    expect(conf.dst.index).toBe(3)
    expect(conf.dst.parentId).toBeUndefined()
  })

  test('new tab pos: left click: after', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.bookmarksLeftClickAction = 'open_in_new'
    Settings.state.bookmarksLeftClickPos = 'after'

    const conf = Bookmarks.getMouseOpeningConf(0)
    expect(conf.dst.index).toBe(2)
    expect(conf.dst.parentId).toBe(2)
  })

  test('new tab pos: middle click: fallback to general settings', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.moveNewTab = 'after'
    Settings.state.bookmarksMidClickAction = 'open_in_new'
    Settings.state.bookmarksMidClickPos = 'default'

    const conf = Bookmarks.getMouseOpeningConf(1)
    expect(conf.dst.index).toBe(2)
    expect(conf.dst.parentId).toBe(2)
  })

  test('new tab pos: middle click: fallback to general settings 2', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.moveNewTab = 'end'
    Settings.state.bookmarksMidClickAction = 'open_in_new'
    Settings.state.bookmarksMidClickPos = 'default'

    const conf = Bookmarks.getMouseOpeningConf(1)
    expect(conf.dst.index).toBe(3)
    expect(conf.dst.parentId).toBeUndefined()
  })

  test('new tab pos: middle click: after', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.bookmarksMidClickAction = 'open_in_new'
    Settings.state.bookmarksMidClickPos = 'after'

    const conf = Bookmarks.getMouseOpeningConf(1)
    expect(conf.dst.index).toBe(2)
    expect(conf.dst.parentId).toBe(2)
  })
})
