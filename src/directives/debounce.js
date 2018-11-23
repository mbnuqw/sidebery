/**
 *  Usage
 *
 * Register:
 *   import Debounce from '@/directives/debounce'
 *   Vue.directive('debounce', Debounce)
 *
 * Bind to element:
 *   <element v-debounce.1000="someFunc"></element>
 *   <element v-debounce:keydown.instant.100="someFunc"></element>
 *
 * Config:
 *   :argument - (opt) event name
 *   .150 - (req) delay in ms
 *   .instant - triggers with first event
 */
export default {
  bind(el, binding, vnode) {
    let instant, delay

    Object.keys(binding.modifiers).map(mod => {
      if (mod === 'instant') return (instant = true)
      const maybeDelay = parseInt(mod)
      if (!isNaN(maybeDelay)) delay = maybeDelay
    })

    if (!delay || !binding.value) return

    binding.eventName = binding.arg || 'input'
    binding.handler = value => {
      // Handle first event fire if 'instant' option is true
      if (!binding.timeout && instant) binding.value(value)

      // Clear current timeout
      if (binding.timeout) clearTimeout(binding.timeout)

      binding.timeout = setTimeout(() => {
        binding.value(value)
        binding.timeout = null
      }, delay)
    }

    if (vnode.componentInstance) {
      vnode.componentInstance.$on(binding.eventName, binding.handler)
    } else {
      el.addEventListener(binding.eventName, binding.handler)
    }
  },

  unbind(el, binding, vnode) {
    if (vnode.componentInstance) {
      vnode.componentInstance.$off(binding.eventName, binding.handler)
    } else {
      el.removeEventListener(binding.eventName, binding.handler)
    }
  },
}
