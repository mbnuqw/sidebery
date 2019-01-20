import CtxMenu from './context-menu'

describe('ContextMenu helper', () => {
  test('create new context menu', () => {
    const el = 'element'
    const offHandler = 'offHandler'
    const ctxMenu = new CtxMenu(el, offHandler)

    expect(ctxMenu).toEqual(expect.objectContaining({
      el: expect.stringMatching('element'),
      off: expect.stringMatching('offHandler'),
      opts: expect.any(Array)
    }))

    ctxMenu.add('label', 'arg1', 'arg2')
    ctxMenu.addTranslated('Label', 'arg1')
    expect(ctxMenu.opts).toHaveLength(2)
    expect(ctxMenu.opts[0]).toHaveLength(3)
    expect(ctxMenu.opts[0][0]).toBe('menu.label')
    expect(ctxMenu.opts[1]).toHaveLength(2)
    expect(ctxMenu.opts[1][0]).toBe('Label')
  })
})