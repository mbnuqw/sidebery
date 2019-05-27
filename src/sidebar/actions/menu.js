import CommonActions from '../../actions/menu'
import Actions from '.'
import BookmarksOptions from '../menu/bookmarks'
import TabsOptions from '../menu/tabs'

const OPTIONS = { ...BookmarksOptions, ...TabsOptions }

/**
 * Open context menu
 */
async function openCtxMenu(state, el, node) {
  const nodeType = typeof node.id === 'number' ? 'tab' : 'bookmark'
  const options = nodeType === 'tab' ? state.tabsMenu : state.bookmarksMenu

  state.otherWindows = (await browser.windows.getAll()).filter(w => w.id !== state.windowId)

  const inline = []
  let opts = []

  for (let optName of options) {
    if (optName instanceof Array) {
      let inlineMenu = []
      for (let iOpt of optName) {
        const option = OPTIONS[iOpt](node)
        if (option) inlineMenu = inlineMenu.concat(option)
      }
      inline.push(inlineMenu)
      continue
    }

    const option = OPTIONS[optName](node)
    if (option) opts = opts.concat(option)
  }

  state.ctxMenu = {
    el,
    inline,
    opts,
    off: () => Actions.resetSelection(state),
  }
}

/**
 * Close context menu
 */
function closeCtxMenu(state) {
  if (state.ctxMenu) {
    if (state.ctxMenu.off) state.ctxMenu.off()
    state.ctxMenu = null
  }
}

export default {
  ...CommonActions,

  openCtxMenu,
  closeCtxMenu,
}