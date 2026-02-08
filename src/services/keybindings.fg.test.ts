import { afterEach, describe, expect, test } from 'vitest'
import * as Tabs from 'src/services/tabs.fg'
import * as Selection from 'src/services/selection.fg'
import * as Keybindings from 'src/services/keybindings.fg'
import { addMTTab, resetMTabs } from 'src/defaults/mocks.tabs.fg'

describe('Keybindings.onKeySelectTabsBranch()', () => {
  afterEach(() => {
    resetMTabs()
    Selection.resetSelection()
  })

  test('Select branch of active non-parent tab', () => {
    addMTTab({ id: 2, active: true })
    addMTTab({ id: 3 })

    Keybindings.TESTING.onKeySelectTabsBranch()
    expect(Tabs.byId[2]?.sel).toBe(true)
    expect(Tabs.byId[3]?.sel).toBe(false)
  })

  test('Select branch of active parent tab', () => {
    addMTTab({ id: 2, active: true })
    addMTTab(0, { id: 3 })

    Keybindings.TESTING.onKeySelectTabsBranch()
    expect(Tabs.byId[2]?.sel).toBe(true)
    expect(Tabs.byId[3]?.sel).toBe(true)
  })

  test('Select branch of selected parent tab', () => {
    addMTTab({ id: 2, active: true })
    addMTTab({ id: 3 })
    addMTTab(0, { id: 4 })
    addMTTab(0, { id: 5 })
    addMTTab({ id: 6 })
    Selection.selectTab(3)

    Keybindings.TESTING.onKeySelectTabsBranch()
    expect(Tabs.byId[2]?.sel).toBe(false)
    expect(Tabs.byId[3]?.sel).toBe(true)
    expect(Tabs.byId[4]?.sel).toBe(true)
    expect(Tabs.byId[5]?.sel).toBe(true)
    expect(Tabs.byId[6]?.sel).toBe(false)
  })

  test('Select multiple branches of selected tabs', () => {
    addMTTab({ id: 2, active: true })
    addMTTab({ id: 3 })
    addMTTab(0, { id: 4 })
    addMTTab(0, 1, { id: 5 })
    addMTTab({ id: 6 })
    addMTTab(0, { id: 7 })
    Selection.selectTab(2)
    Selection.selectTab(3)
    Selection.selectTab(6)

    Keybindings.TESTING.onKeySelectTabsBranch()
    expect(Selection.ids()).toStrictEqual([2, 3, 4, 5, 6, 7])
  })
})
