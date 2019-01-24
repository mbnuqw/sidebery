jest.mock('../event-bus', () => {
  return { $emit: jest.fn() }
})
import EventBus from '../event-bus'
import KBActions from './keybindings'

describe('Keybindings actions', () => {
  test('loadKeybindings', async () => {
    browser.commands.cmds = [1, 2]
    const state = {}

    await KBActions.loadKeybindings({ state })
    expect(state.keybindings.length).toBe(2)
    expect(state.keybindings[0]).toBe(1)
    expect(state.keybindings[1]).toBe(2)
  })

  test('updateKeybinding', async () => {
    browser.commands.update = jest.fn()
    await KBActions.updateKeybinding({}, { name: 'a', shortcut: 'b' })
    expect(browser.commands.update).toHaveBeenCalled()
  })

  test('resetKeybindings', async () => {
    browser.commands.reset = jest.fn()
    const state = { keybindings: [{ name: 'a' }, { name: 'b' }] }
    const dispatch = jest.fn()
    await KBActions.resetKeybindings({ state, dispatch })
    expect(browser.commands.reset).toHaveBeenCalledTimes(2)
    await new Promise(r => setTimeout(r, 250))
    expect(dispatch).toHaveBeenCalledWith('loadKeybindings')
  })

  test('kb_next_panel', async () => {
    const dispatch = jest.fn()
    await KBActions.kb_next_panel({ dispatch })
    expect(dispatch).toHaveBeenCalledWith('switchPanel', 1)
  })

  test('kb_prev_panel', async () => {
    const dispatch = jest.fn()
    await KBActions.kb_prev_panel({ dispatch })
    expect(dispatch).toHaveBeenCalledWith('switchPanel', -1)
  })

  test('kb_new_tab_on_panel', async () => {
    const dispatch = jest.fn()
    const state = { lastPanelIndex: 1 }
    const getters = { panels: [{}, { cookieStoreId: 'a' }] }
    await KBActions.kb_new_tab_on_panel({ state, dispatch, getters })
    expect(dispatch).toHaveBeenCalledWith('createTab', 'a')
  })

  describe('kb_rm_tab_on_panel', () => {
    test('remove active tab', async () => {
      const dispatch = jest.fn()
      const state = { selectedTabs: [], tabs: [{ active: true, id: 123 }] }
      await KBActions.kb_rm_tab_on_panel({ state, dispatch })
      expect(dispatch).toHaveBeenCalledWith('removeTabs', [123])
    })

    test('remove selected tabs', async () => {
      const dispatch = jest.fn()
      const state = { selectedTabs: [2, 5, 16] }
      await KBActions.kb_rm_tab_on_panel({ state, dispatch })
      expect(dispatch).toHaveBeenCalledWith('removeTabs', [2, 5, 16])
    })
  })

  test('kb_activate', async () => {
    await KBActions.kb_activate({})
    expect(EventBus.$emit).toHaveBeenCalledWith('keyActivate')
  })

  test('kb_reset_selection', async () => {
    const commit = jest.fn()
    await KBActions.kb_reset_selection({ commit })
    expect(commit).toHaveBeenCalledWith('resetSelection')
  })

  test('kb_select_all', async () => {
    await KBActions.kb_select_all({})
    expect(EventBus.$emit).toHaveBeenCalledWith('selectAll')
  })

  test('kb_up', async () => {
    await KBActions.kb_up({})
    expect(EventBus.$emit).toHaveBeenCalledWith('keyUp')
  })

  test('kb_down', async () => {
    await KBActions.kb_down({})
    expect(EventBus.$emit).toHaveBeenCalledWith('keyDown')
  })

  test('kb_up_shift', async () => {
    await KBActions.kb_up_shift({})
    expect(EventBus.$emit).toHaveBeenCalledWith('keyUpShift')
  })

  test('kb_down_shift', async () => {
    await KBActions.kb_down_shift({})
    expect(EventBus.$emit).toHaveBeenCalledWith('keyDownShift')
  })
})
