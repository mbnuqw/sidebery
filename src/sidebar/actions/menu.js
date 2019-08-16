import CommonActions from '../../actions/menu'
import { MENU_OPTIONS, RGB_COLORS } from '../../defaults'
import Actions from '../actions'

const xmlSerializer = new XMLSerializer()

/**
 * Open context menu
 */
async function openCtxMenu(x, y) {
  if (this.state.ctxMenuNative) browser.menus.removeAll()
  if (!this.state.selected.length) return

  const nodeType = typeof this.state.selected[0] === 'number' ? 'tab' : 'bookmark'
  const options = nodeType === 'tab' ? this.state.tabsMenu : this.state.bookmarksMenu

  let opts = []

  for (let optName of options) {
    if (optName instanceof Array) {
      let inlineMenu = { inline: true, options: [] }
      let parentId
      for (let subOpt of optName) {
        if (typeof subOpt === 'object') {
          if (this.state.ctxMenuNative && subOpt.name) {
            parentId = createNativeSubMenuOption(nodeType, subOpt.name)
          }
          continue
        }
        let optGen = MENU_OPTIONS[subOpt]
        let option = optGen ? optGen(this.state) : 'separator'
        if (!option) continue
        if (this.state.ctxMenuNative) createNativeOption(nodeType, option, parentId)
        else inlineMenu.options = inlineMenu.options.concat(option)
      }
      opts.push(inlineMenu)
      continue
    }

    let optGen = MENU_OPTIONS[optName]
    let option = optGen ? optGen(this.state) : 'separator'
    if (!option) continue
    if (this.state.ctxMenuNative) {
      createNativeOption(nodeType, option)
    } else {
      let lastGroup = opts[opts.length - 1]
      if (!lastGroup || lastGroup.inline) {
        lastGroup = { inline: false, options: [] }
        opts.push(lastGroup)
      }
      lastGroup.options = lastGroup.options.concat(option)
    }
  }

  if (this.state.ctxMenuNative) return Actions.resetSelection()

  this.state.ctxMenu = {
    x,
    y,
    opts,
    off: () => Actions.resetSelection(),
  }
}

function createNativeOption(ctx, option, parentId) {
  if (option === 'separator') {
    browser.menus.create({
      type: 'separator',
      contexts: [ctx],
      parentId,
    })
    return
  }

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

function createNativeSubMenuOption(ctx, title) {
  let optProps = {
    type: 'normal',
    contexts: [ctx],
    viewTypes: ['sidebar'],
    title: title,
  }
  return browser.menus.create(optProps)
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