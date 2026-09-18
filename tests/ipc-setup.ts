import { vi } from 'vitest'

vi.mock('src/services/ipc', () => {
  return {
    connectTo: () => {},
    sidebar: vi.fn(),
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
    isConnected: vi.fn(),
    disconnectFrom: () => {},
  }
})
