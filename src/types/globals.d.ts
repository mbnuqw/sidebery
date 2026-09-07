type ID = string | number

type FirstParameter<T extends (...args: any) => any> = T extends (arg: infer P) => any ? P : never

type DOMEvent<E extends Event, T = any> = E & {
  target: T
  currentTarget: T
}

type TranslationFn = (...args: (number | string | undefined)[]) => string
type Translations = Record<string, Record<string, TranslationFn | string>>

interface MozFocusEvent extends FocusEvent {
  explicitOriginalTarget: Node | Element
}

interface Window {
  sideberyInitData?: Record<string, any>
  onSideberyInitDataReady?: () => void

  translations: Record<string, Record<string, TranslationFn | string>> | undefined

  getSideberyState?: () => any
}

interface HTMLElement {
  __sdbr_index?: number
  __sdbr_deltaIndex?: number
  __sdbr_prevOffsetTop?: number
  __sdbr_sr?: boolean
  __sdbr_tabId?: ID
  __sdbr_ntbb?: boolean
}

type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}

type DeepMutable<T> = {
  -readonly [K in keyof T]: DeepMutable<T[K]>
}
