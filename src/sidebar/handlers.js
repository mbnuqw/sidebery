import EventBus from '../event-bus'
import Store from './store'
import State from './store/state'
import Actions from './actions'
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

// Inject vuex getters and state in actions
for (let handler in Handlers) {
  if (!Handlers.hasOwnProperty(handler)) continue

  Handlers[handler] = Handlers[handler].bind({
    getters: Store.getters,
    state: State,
    actions: Actions,
    handlers: Handlers,
    eventBus: EventBus,
  })
}

export default Handlers