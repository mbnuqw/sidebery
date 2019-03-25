import SettingsActions from './settings'

beforeEach(() => {
  browser.bookmarks = {}
  browser.commands = {}
  browser.contextualIdentities = {}
  browser.extension = {}
  browser.i18n = {}
  browser.proxy = {}
  browser.permissions = {}
  browser.storage = { local: {} }
  browser.tabs = {}
  browser.windows = {}
})

describe('loadSettings', () => {
  test('load empty settings', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return {}
    })

    await SettingsActions.loadSettings({ state })
    expect(state.settingsLoaded).toBe(true)
  })

  test('load undefined setting', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return { settings: { u: undefined } }
    })

    await SettingsActions.loadSettings({ state })
    expect(state.settingsLoaded).toBe(true)
    expect(state.u).toBeUndefined()
  })

  test('load settings', async () => {
    const state = {}
    browser.storage.local.get = jest.fn(() => {
      return { settings: { a: 'a', b: 'b' } }
    })

    await SettingsActions.loadSettings({ state })
    expect(state.settingsLoaded).toBe(true)
    expect(state.a).toBe('a')
    expect(state.b).toBe('b')
  })
})

describe('saveSettings', () => {
  test('save unloaded settings', async () => {
    const state = { settingsLoaded: false }
    browser.storage.local.set = jest.fn()

    await SettingsActions.saveSettings({ state })
    expect(browser.storage.local.set).not.toBeCalled()
  })

  test('save empty settings', async () => {
    const state = { settingsLoaded: true, windowFocused: true }
    browser.storage.local.set = jest.fn()

    await SettingsActions.saveSettings({ state })
    expect(browser.storage.local.set).toBeCalledWith({ settings: {} })
  })

  test('save settings', async () => {
    const state = {
      settingsLoaded: true,
      windowFocused: true,
      nativeScrollbars: true,
    }
    browser.storage.local.set = jest.fn()

    await SettingsActions.saveSettings({ state })
    expect(browser.storage.local.set).toBeCalledWith({
      settings: {
        nativeScrollbars: true,
      },
    })
  })

  test('save normalized settings', async () => {
    const state = {
      settingsLoaded: true,
      windowFocused: true,
      snapshotsTargets: { just: () => {} },
    }
    browser.storage.local.set = jest.fn()

    await SettingsActions.saveSettings({ state })
    expect(browser.storage.local.set).toBeCalledWith({
      settings: {
        snapshotsTargets: {},
      },
    })
  })
})

describe('updateFontSize', () => {
  test('update font size xs', async () => {
    const state = { fontSize: 'xs' }
    await SettingsActions.updateFontSize({ state })
    expect(document.documentElement.style.fontSize).toBe('13.5px')
  })

  test('update font size s', async () => {
    const state = { fontSize: 's' }
    await SettingsActions.updateFontSize({ state })
    expect(document.documentElement.style.fontSize).toBe('14px')
  })

  test('update font size m', async () => {
    const state = { fontSize: 'm' }
    await SettingsActions.updateFontSize({ state })
    expect(document.documentElement.style.fontSize).toBe('14.5px')
  })

  test('update font size l', async () => {
    const state = { fontSize: 'l' }
    await SettingsActions.updateFontSize({ state })
    expect(document.documentElement.style.fontSize).toBe('15px')
  })

  test('update font size xl', async () => {
    const state = { fontSize: 'xl' }
    await SettingsActions.updateFontSize({ state })
    expect(document.documentElement.style.fontSize).toBe('15.5px')
  })

  test('update font size xxl', async () => {
    const state = { fontSize: 'xxl' }
    await SettingsActions.updateFontSize({ state })
    expect(document.documentElement.style.fontSize).toBe('16px')
  })

  test('update font size default', async () => {
    const state = {}
    await SettingsActions.updateFontSize({ state })
    expect(document.documentElement.style.fontSize).toBe('14.5px')
  })
})
