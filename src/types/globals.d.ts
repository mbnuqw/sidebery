type ID = string | number

type FirstParameter<T extends (...args: any) => any> = T extends (arg: infer P) => any ? P : never

type DOMEvent<E extends Event, T = any> = E & {
  target: T
  currentTarget: T
}

interface MozFocusEvent extends FocusEvent {
  explicitOriginalTarget: Node | Element
}

interface Window {
  sideberyUrlPageInjected?: boolean
  sideberyGroupPageInjected?: boolean
  groupTabId?: ID
  groupWinId?: ID

  discardTimeout?: number

  sideberyDictionaries?: Record<string, Record<string, ((n?: number | string) => string) | string>>
}
