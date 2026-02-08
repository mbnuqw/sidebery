import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { PanelType } from 'src/enums'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Settings from 'src/services/settings'
import { addMNavBtn, addMPanel, resetMSidebar } from 'src/defaults/mocks.sidebar.fg'

describe('Sidebar.switchPanel()', () => {
  beforeEach(() => {
    Settings.state.navSwitchPanelsDelay = 0
    Settings.state.hideEmptyPanels = false
    Settings.state.hideDiscardedTabPanels = false
    Sidebar.setReadyState(true)
  })

  afterEach(() => {
    Settings.resetSettings()
    resetMSidebar()
  })

  test('to the next panel', () => {
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    addMPanel({ type: PanelType.tabs, id: 'd', hidden: true })
    Sidebar.setActivePanelId('a')

    Sidebar.switchPanel(1, false, false, false, false)
    expect(Sidebar.activePanelId).toBe('c')
  })
  test('to the prev panel', () => {
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    addMPanel({ type: PanelType.tabs, id: 'd', hidden: true })
    Sidebar.setActivePanelId('c')

    Sidebar.switchPanel(-1, false, false, false, false)
    expect(Sidebar.activePanelId).toBe('a')
  })

  test('to the next panel without looping', () => {
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    addMPanel({ type: PanelType.tabs, id: 'd', hidden: true })
    Sidebar.setActivePanelId('d')

    Sidebar.switchPanel(1, false, false, false, false)
    expect(Sidebar.activePanelId).toBe('d')
  })
  test('to the prev panel without looping', () => {
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    addMPanel({ type: PanelType.tabs, id: 'd', hidden: true })
    Sidebar.setActivePanelId('a')

    Sidebar.switchPanel(-1, false, false, false, false)
    expect(Sidebar.activePanelId).toBe('a')
  })

  test('to the prev cyclically', () => {
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    addMPanel({ type: PanelType.tabs, id: 'd', hidden: true })
    Sidebar.setActivePanelId('a')

    Sidebar.switchPanel(-1, false, false, false, true)
    expect(Sidebar.activePanelId).toBe('d')
  })
  test('to the next cyclically', () => {
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    addMPanel({ type: PanelType.tabs, id: 'd', hidden: true })
    Sidebar.setActivePanelId('d')

    Sidebar.switchPanel(1, false, false, false, true)
    expect(Sidebar.activePanelId).toBe('a')
  })
  test('cyclically through the list', () => {
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    addMPanel({ type: PanelType.tabs, id: 'd', hidden: true })
    Sidebar.setActivePanelId('a')

    Sidebar.switchPanel(1, false, false, false, true)
    expect(Sidebar.activePanelId).toBe('c')
    Sidebar.switchPanel(1, false, false, false, true)
    expect(Sidebar.activePanelId).toBe('d')
  })

  test('ignoring hidden panels', () => {
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    addMPanel({ type: PanelType.tabs, id: 'd', hidden: true })
    Sidebar.setActivePanelId('a')

    Sidebar.switchPanel(1, true, false, false, false)
    expect(Sidebar.activePanelId).toBe('c')

    Sidebar.switchPanel(1, true, false, false, false)
    expect(Sidebar.activePanelId).toBe('c')

    Sidebar.switchPanel(1, true, false, false, true)
    expect(Sidebar.activePanelId).toBe('a')

    Sidebar.switchPanel(-1, true, false, false, true)
    expect(Sidebar.activePanelId).toBe('c')
  })

  test('with the hidden panels popup after "a", ignoring hidden panels', () => {
    Settings.state.navBarInline = false
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMNavBtn('hdn')
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    addMPanel({ type: PanelType.tabs, id: 'd', hidden: true })
    Sidebar.setActivePanelId('a')

    Sidebar.switchPanel(1, true, false, false, false)
    expect(Sidebar.activePanelId).toBe('c')
    Sidebar.switchPanel(-1, true, false, false, false)
    expect(Sidebar.activePanelId).toBe('a')
  })

  test('with the hidden panels popup after "a", opening/closing the hidden panels popup', () => {
    Settings.state.navBarInline = false
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMNavBtn('hdn')
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    addMPanel({ type: PanelType.tabs, id: 'd', hidden: true })
    Sidebar.setActivePanelId('a')

    Sidebar.switchPanel(1, false, false, false, false)
    expect(Sidebar.activePanelId).toBe('d')
    expect(Sidebar.reactive.hiddenPanelsPopup).toBe(true)
    Sidebar.switchPanel(1, false, false, false, false)
    expect(Sidebar.activePanelId).toBe('c')
    expect(Sidebar.reactive.hiddenPanelsPopup).toBe(false)
    Sidebar.switchPanel(-1, false, false, false, false)
    expect(Sidebar.activePanelId).toBe('d')
    expect(Sidebar.reactive.hiddenPanelsPopup).toBe(true)
    Sidebar.switchPanel(-1, false, false, false, false)
    expect(Sidebar.activePanelId).toBe('a')
    expect(Sidebar.reactive.hiddenPanelsPopup).toBe(false)
  })

  test("looping without ignoring hidden panels, when there's no hidden panels", () => {
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMPanel({ type: PanelType.tabs, id: 'b', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    Sidebar.setActivePanelId('a')

    Sidebar.switchPanel(-1, false, false, false, true)
    expect(Sidebar.activePanelId).toBe('c')
    expect(Sidebar.reactive.hiddenPanelsPopup).toBe(false)
  })

  test('looping forward when the first panel is a bookmarks panel set to be skipped', () => {
    addMPanel({ type: PanelType.bookmarks, id: 'a', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'b' })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    Sidebar.setActivePanelId('c')

    Sidebar.switchPanel(1, true, false, false, true)
    expect(Sidebar.activePanelId).toBe('b')
  })

  test('looping backward when the first panel is a bookmarks panel set to be skipped', () => {
    addMPanel({ type: PanelType.bookmarks, id: 'a', skipOnSwitching: true })
    addMPanel({ type: PanelType.tabs, id: 'b' })
    addMPanel({ type: PanelType.tabs, id: 'c' })
    Sidebar.setActivePanelId('b')

    Sidebar.switchPanel(-1, true, false, false, true)
    expect(Sidebar.activePanelId).toBe('c')
  })

  test('looping backward when the last panel is a bookmarks panel set to be skipped', () => {
    addMPanel({ type: PanelType.tabs, id: 'a' })
    addMPanel({ type: PanelType.tabs, id: 'b' })
    addMPanel({ type: PanelType.bookmarks, id: 'c', skipOnSwitching: true })
    Sidebar.setActivePanelId('a')

    Sidebar.switchPanel(-1, true, false, false, true)
    expect(Sidebar.activePanelId).toBe('b')
  })
})
