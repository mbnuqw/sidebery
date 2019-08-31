import Debounce from '../debounce'

describe('Debounce vue directive', () => {
  describe('bind()', () => {
    test('debouncing html elements event with instant flag', async () => {
      let counter = 0
      const el = {
        addEventListener: async function(eventName, handler) {
          expect(eventName).toBe(binding.arg)
          handler()
          await new Promise(res => setTimeout(res, 20))
          handler()
          await new Promise(res => setTimeout(res, 20))
          handler()
          await new Promise(res => setTimeout(res, 20))
          handler()
        },
        removeEventListener: function(eventName, handler) {
          expect(eventName).toBe(binding.arg)
          expect(handler).toBe(binding.handler)
          counter = 0
        },
      }
      const binding = {
        arg: 'scroll',
        modifiers: { 50: true, instant: true },
        value: () => counter++,
      }
      const vnode = {}

      Debounce.bind(el, binding, vnode)

      // Instant trigger
      expect(counter).toBe(1)

      // Final result
      await new Promise(res => setTimeout(res, 200))
      expect(counter).toBe(2)

      // Unbind
      Debounce.unbind(el, binding, vnode)
      expect(counter).toBe(0)
    })

    test('debouncing vnode event w/o instant flag', async () => {
      let counter = 0
      const el = {
        addEventListener: () => {},
        removeEventListener: () => {},
      }
      const binding = {
        arg: 'scroll',
        modifiers: { 50: true },
        value: () => counter++,
      }
      const vnode = {
        componentInstance: {
          $on: async function(eventName, handler) {
            expect(eventName).toBe(binding.arg)
            handler()
            await new Promise(res => setTimeout(res, 20))
            handler()
            await new Promise(res => setTimeout(res, 20))
            handler()
            await new Promise(res => setTimeout(res, 20))
            handler()
          },
          $off: function(eventName, handler) {
            expect(eventName).toBe(binding.arg)
            expect(handler).toBe(binding.handler)
            counter = 0
          },
        },
      }

      Debounce.bind(el, binding, vnode)

      // Event handler will NOT instantly called
      expect(counter).toBe(0)

      // Final result
      await new Promise(res => setTimeout(res, 200))
      expect(counter).toBe(1)

      // Unbind
      Debounce.unbind(el, binding, vnode)
      expect(counter).toBe(0)
    })
  })
})
