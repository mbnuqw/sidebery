import ContainersHandlers from './handlers/containers'
import TabsHandlers from './handlers/tabs'
import KeybindingsHandlers from './handlers/keybindings'
import WindowsHandlers from './handlers/windows'
import StorageHandlers from './handlers/storage'
import BookmarksHandlers from './handlers/bookmarks'
import MiscHandlers from './handlers/misc'

const Handlers = {
  ...ContainersHandlers,
  ...TabsHandlers,
  ...KeybindingsHandlers,
  ...WindowsHandlers,
  ...StorageHandlers,
  ...BookmarksHandlers,
  ...MiscHandlers,
}

export function injectInHandlers(injectable = {}) {
  for (let key of Object.keys(Handlers)) {
    Handlers[key] = Handlers[key].bind(injectable)
  }
}

export default Handlers
