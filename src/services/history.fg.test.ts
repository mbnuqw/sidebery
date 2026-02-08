import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import * as History from 'src/services/history.fg'
import * as Settings from 'src/services/settings'
import * as Sidebar from 'src/services/sidebar.fg'
import { addMTTab, resetMTabs, setDefaultMTabPanel } from 'src/defaults/mocks.tabs.fg'
import { PanelType } from 'src/enums'
import { addMPanel, resetMSidebar } from 'src/defaults/mocks.sidebar.fg'

describe('History.getMouseOpeningConf()', () => {
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
    Settings.state.historyLeftClickAction = 'open_in_new'
    Settings.state.historyLeftClickPos = 'default'

    const conf = History.getMouseOpeningConf(0)
    expect(conf.dst.index).toBe(2)
    expect(conf.dst.parentId).toBe(2)
  })

  test('new tab pos: left click: fallback to general settings 2', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.moveNewTab = 'end'
    Settings.state.historyLeftClickAction = 'open_in_new'
    Settings.state.historyLeftClickPos = 'default'

    const conf = History.getMouseOpeningConf(0)
    expect(conf.dst.index).toBe(3)
    expect(conf.dst.parentId).toBeUndefined()
  })

  test('new tab pos: left click: after', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.historyLeftClickAction = 'open_in_new'
    Settings.state.historyLeftClickPos = 'after'

    const conf = History.getMouseOpeningConf(0)
    expect(conf.dst.index).toBe(2)
    expect(conf.dst.parentId).toBe(2)
  })

  test('new tab pos: middle click: fallback to general settings', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.moveNewTab = 'after'
    Settings.state.historyMidClickAction = 'open_in_new'
    Settings.state.historyMidClickPos = 'default'

    const conf = History.getMouseOpeningConf(1)
    expect(conf.dst.index).toBe(2)
    expect(conf.dst.parentId).toBe(2)
  })

  test('new tab pos: middle click: fallback to general settings 2', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.moveNewTab = 'end'
    Settings.state.historyMidClickAction = 'open_in_new'
    Settings.state.historyMidClickPos = 'default'

    const conf = History.getMouseOpeningConf(1)
    expect(conf.dst.index).toBe(3)
    expect(conf.dst.parentId).toBeUndefined()
  })

  test('new tab pos: middle click: after', () => {
    addMTTab({ id: 2 })
    addMTTab(0, { id: 3, active: true })
    addMTTab(0, { id: 4 })

    Settings.state.historyMidClickAction = 'open_in_new'
    Settings.state.historyMidClickPos = 'after'

    const conf = History.getMouseOpeningConf(1)
    expect(conf.dst.index).toBe(2)
    expect(conf.dst.parentId).toBe(2)
  })
})
