/**
 *  Usage
 *
 * Register:
 *   import noiseBg from './noise-bg.d'
 *   Vue.directive('noise', noiseBg)
 *
 * Bind to element:
 *   <element v-noise:300x300.g:45:88></element>
 *
 * Config (all optianal):
 *   :300x300 - size
 *   .g:0:ff - gray (hex)
 *   .a:0:5   - alpha (hex)
 *   .s:0:5   - spread (decimal)
 */
import { noiseBg } from '../libs/noise-bg'

const DefaultWidth = 300
const DefaultHeight = 300

// interface NoiseConfig {
//   width?: number
//   height?: number
//   gray?: number | number[]
//   red?: number | number[]
//   green?: number | number[]
//   blue?: number | number[]
//   alpha?: number | number[]
//   spread?: number | number[]
// }

export default function initNoiseBgDirective(state, store) {
  return {
    bind(el, binding) {
      let conf = {}
      if (binding.value) {
        conf = binding.value
      } else {
        binding.arg = binding.arg || ''
        const size = binding.arg.split('x').map(i => parseInt(i, 10))
        conf.width = size[0] || DefaultWidth
        conf.height = size[1] || size[0]
        conf = Object.keys(binding.modifiers).reduce((c, k) => {
          const p = k.split(':')
          if (p[0] === 'g') {
            let g = p.slice(1).map(n => parseInt(n, 16))
            c.gray = g[1] ? g : g[0]
          }
          if (p[0] === 'a') {
            let a = p.slice(1).map(n => parseInt(n, 16))
            c.alpha = a[1] ? a : a[0]
          }
          if (p[0] === 's') {
            let s = p.slice(1).map(n => parseInt(n, 10))
            c.spread = s[1] ? s : s[0]
          }
          return c
        }, conf)
      }

      const drawNoise = () => {
        let scaleShift = ~~window.devicePixelRatio
        let sW = (conf.width || DefaultWidth) >> scaleShift
        let sH = (conf.height || DefaultHeight) >> scaleShift
        el.style.backgroundSize = `${sW}px ${sH}px`
        noiseBg(el, {
          width: conf.width || DefaultWidth,
          height: conf.height || DefaultHeight,
          gray: conf.gray || [0, 255],
          alpha: conf.alpha || [1, 32],
          spread: conf.spread || [1, 8],
        })
      }

      if (state.bgNoise) drawNoise()
      if (store.watch) {
        store.watch(Object.getOwnPropertyDescriptor(state, 'bgNoise').get, function(curr, prev) {
          if (curr && !prev) drawNoise()
          if (!curr && prev) el.style.backgroundImage = ''
        })
      }
    },
  }
}
