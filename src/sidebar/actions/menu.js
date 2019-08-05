import CommonActions from '../../actions/menu'
import { MENU_OPTIONS, RGB_COLORS } from '../../defaults'
import Actions from '.'

const xmlSerializer = new XMLSerializer()

// Action.selectTab(tabId)
// Action.selectTabs([tabId])
// Action.deselectTab(tabId)
// Action.deselectTab([tabId])



/**
 * Open context menu
 */
async function openCtxMenu(x, y) {
  if (this.state.ctxMenuNative) browser.menus.removeAll()
  if (!this.state.selected.length) return

  const nodeType = typeof this.state.selected[0] === 'number' ? 'tab' : 'bookmark'
  const options = nodeType === 'tab' ? this.state.tabsMenu : this.state.bookmarksMenu

  const inline = []
  let opts = []

  for (let optName of options) {
    if (optName instanceof Array) {
      let inlineMenu = []
      for (let iOpt of optName) {
        const option = MENU_OPTIONS[iOpt](this.state)
        if (!option) continue
        if (this.state.ctxMenuNative) createNativeOption(nodeType, option)
        else inlineMenu = inlineMenu.concat(option)
      }
      inline.push(inlineMenu)
      continue
    }

    const option = MENU_OPTIONS[optName](this.state)
    if (!option) continue
    if (this.state.ctxMenuNative) createNativeOption(nodeType, option)
    else opts = opts.concat(option)
  }

  if (this.state.ctxMenuNative) return Actions.resetSelection()

  this.state.ctxMenu = {
    x,
    y,
    inline,
    opts,
    off: () => Actions.resetSelection(),
  }
}

function createNativeOption(ctx, option, parentId) {
  if (option instanceof Array) {
    for (let opt of option) {
      createNativeOption(ctx, opt, parentId)
    }
    return
  }

  let icon
  if (option.icon && RGB_COLORS[option.color]) {
    let s = xmlSerializer.serializeToString(document.getElementById(option.icon))
    s = '<svg fill="' + RGB_COLORS[option.color] + '" ' + s.slice(5)
    icon = 'data:image/svg+xml;base64,' + window.btoa(s)
  }

  let optProps = { type: 'normal', contexts: [ctx], viewTypes: ['sidebar'] }
  if (parentId) optProps.parentId = parentId
  optProps.title = option.nativeLabel || option.label
  if (icon) optProps.icons = { '16': icon }
  optProps.onclick = () => {
    if (typeof option.action === 'string') {
      if (!option.args) Actions[option.action]()
      else Actions[option.action](...option.args)
    }
    if (typeof option.action === 'function') {
      if (!option.args) option.action()
      else option.action(...option.args)
    }
    Actions.resetSelection()
  }

  browser.menus.create(optProps)
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