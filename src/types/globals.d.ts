type ID = string | number

type FirstParameter<T extends (...args: any) => any> = T extends (arg: infer P) => any ? P : never

type DOMEvent<E extends Event, T = any> = E & {
  target: T
  currentTarget: T
}

type PlurFn = (n?: number | string) => string
type Translations = Record<string, Record<string, PlurFn | string>>

interface MozFocusEvent extends FocusEvent {
  explicitOriginalTarget: Node | Element
}

interface Window {
  sideberyInitData?: Record<string, any>
  onSideberyInitDataReady?: () => void

  translations: Record<string, Record<string, PlurFn | string>> | undefined

  getSideberyState?: () => any
}

type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}
