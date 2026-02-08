import { Stored, Entries } from 'src/types'
import * as Logs from 'src/services/logs'

type ChangeHandler = <K extends keyof Stored>(newVal: Stored[K]) => void
type ChangeHandlerG<K extends StorageKey> = (newVal: StorageValue<K>) => void
type StorageKey = keyof Stored
type StorageValue<K extends keyof Stored> = Stored[K]

export function storageChangeListener(newValues: Stored): void {
  for (const [key, newValue] of Object.entries(newValues) as Entries<Stored>) {
    const handler = changeHandlers[key]
    if (handler) handler(newValue)
  }
}

export const changeHandlers: { [key in keyof Stored]?: ChangeHandler } = {}

export function onKeyChange<K extends keyof Stored, H extends ChangeHandlerG<K>>(key: K, cb: H) {
  if (changeHandlers[key]) {
    throw Logs.err(`Storage: onKeyChange: "${key}" handler already exists`)
  }

  changeHandlers[key] = cb as ChangeHandler
}
