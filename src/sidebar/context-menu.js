import { Translate } from '../mixins/dict'

export default class CtxMenu {
  constructor(el, offHandler) {
    this.el = el
    this.off = offHandler
    this.opts = []
  }

  add(label, ...args) {
    this.opts.push([Translate(`menu.${label}`), ...args])
  }

  addTranslated(label, ...args) {
    this.opts.push([label, ...args])
  }
}
