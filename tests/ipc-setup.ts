import { vi } from 'vitest'

vi.mock('src/services/ipc', () => {
  return {
    connectTo: () => {},
    sidebar: () => {},
    sendToSidebar: () => {},
    sidebars: () => {},
    sendToSidebars: () => {},
    setupPage: () => {},
    panelConfigPopup: () => {},
    groupPage: () => {},
    sendToSearchPopup: () => {},
    sendToEditingPopup: () => {},
    bg: () => {},
    sendToBg: () => {},
    sendToPreview: () => {},
    send: () => {},
    request: () => {},
    broadcast: () => {},
    onConnected: () => {},
    onDisconnected: () => {},
    disconnectFrom: () => {},
  }
})
