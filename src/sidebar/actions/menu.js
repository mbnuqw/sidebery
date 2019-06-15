import CommonActions from '../../actions/menu'
import { MENU_OPTIONS } from '../../defaults'
import Actions from '.'

/**
 * Open context menu
 */
async function openCtxMenu(el, node) {
  const nodeType = typeof node.id === 'number' ? 'tab' : 'bookmark'
  const options = nodeType === 'tab' ? this.state.tabsMenu : this.state.bookmarksMenu
  const allWindows = await browser.windows.getAll()
  this.state.otherWindows = allWindows.filter(w => w.id !== this.state.windowId)

  const inline = []
  let opts = []

  for (let optName of options) {
    if (optName instanceof Array) {
      let inlineMenu = []
      for (let iOpt of optName) {
        const option = MENU_OPTIONS[iOpt](this.state, node)
        if (option) inlineMenu = inlineMenu.concat(option)
      }
      inline.push(inlineMenu)
      continue
    }

    const option = MENU_OPTIONS[optName](this.state, node)
    if (option) opts = opts.concat(option)
  }

  this.state.ctxMenu = {
    el,
    inline,
    opts,
    off: () => Actions.resetSelection(),
  }
}

/**
 * Close context menu
 */
function closeCtxMenu() {
  if (this.state.ctxMenu) {
    if (this.state.ctxMenu.off) this.state.ctxMenu.off()
    this.state.ctxMenu = null
  }
}

export default {
  ...CommonActions,

  openCtxMenu,
  closeCtxMenu,
}