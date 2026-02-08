import * as Store from 'src/services/storage.bg'
import * as Utils from 'src/utils'

import * as Info from 'src/services/info'
export * from 'src/services/info'

export function saveVersion(): void {
  if (Info.prevVersion !== Info.reactive.addonVer) {
    Store.set({ ver: Info.reactive.addonVer }, 500)
  }
}
