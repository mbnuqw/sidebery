import Vue from 'vue'
import jsdom from 'jsdom'
import ContextMenu from './context-menu.vue'

const renderer = require('vue-server-renderer').createRenderer()

describe('Context menu component', () => {
  test('Rendering', () => {
    const ClonedComponent = Vue.extend(ContextMenu)
    const NewComponent = new ClonedComponent({
      data() {
        return {
          aOpts: [['Option 1', () => {}], ['Option 2', () => {}]],
        }
      },
    }).$mount()

    renderer.renderToString(NewComponent, (err, str) => {
      const dom = new jsdom.JSDOM(str)
      const optEls = dom.window.document.querySelectorAll('.CtxMenu > .container > .box > .opt')
      expect(optEls['0'].textContent).toEqual('Option 1')
      expect(optEls['1'].textContent).toEqual('Option 2')
    })
  })

  describe('Computed values', () => {
    test('posStyle (a/b)', () => {
      const ClonedComponent = Vue.extend(ContextMenu)
      const NewComponent = new ClonedComponent({
        data() {
          return {
            bPos: 1000,
          }
        }
      }).$mount()
      expect(NewComponent.aPosStyle).toEqual(
        expect.objectContaining({
          transform: 'translateY(0px) translateX(0px)'
        })
      )
      expect(NewComponent.bPosStyle).toEqual(
        expect.objectContaining({
          transform: 'translateY(1000px) translateX(0px)'
        })
      )
    })
  })

  describe('parseLabel()', () => {
    it('leaves simple labels untouched', () => {
      const ClonedComponent = Vue.extend(ContextMenu)
      const NewComponent = new ClonedComponent().$mount()

      const parsedLabel = NewComponent.parseLabel('some label')
      expect(parsedLabel).toHaveLength(1)
      expect(parsedLabel[0].label).toEqual('some label')
      expect(parsedLabel[0].color).toEqual('')
      expect(parsedLabel[0].w).toEqual('')
    })

    it('parses labels with colorized parts', () => {
      const ClonedComponent = Vue.extend(ContextMenu)
      const NewComponent = new ClonedComponent().$mount()

      const parsedLabel = NewComponent.parseLabel('Label with ||#1155aa>>blue|| part')
      expect(parsedLabel).toHaveLength(3)
      expect(parsedLabel).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Label with ',
            color: '',
            w: '',
          }),
          expect.objectContaining({
            label: 'blue',
            color: '#1155aa',
            w: '600',
          }),
          expect.objectContaining({
            label: ' part',
            color: '',
            w: '',
          }),
        ])
      )
    })
  })
})
