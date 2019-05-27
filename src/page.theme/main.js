import { CUSTOM_STYLES } from '../sidebar/store/state'
import { NoiseBg } from '../libs/noise-bg'
import Utils from '../libs/utils'

let applyTimeout

void (async function() {
  // Load settings and set theme
  let ans = await browser.storage.local.get('settings')
  let settings = ans.settings
  let theme = settings ? settings.theme : 'dark'
  const selectorsEl = document.getElementById('selectors')
  const editorSectionEl = document.getElementById('editor_box')
  const textFieldEl = document.getElementById('editor')

  // Set theme class
  document.body.classList.add('-' + theme)

  // Set background noise
  if (settings.bgNoise) generateNoise(document.body)

  // Set user styles
  ans = await browser.storage.local.get('styles')
  let loadedStyles = ans.styles
  if (loadedStyles) {
    for (let key in CUSTOM_STYLES) {
      if (!CUSTOM_STYLES.hasOwnProperty(key)) continue
      if (loadedStyles[key]) {
        document.body.style.setProperty(Utils.CSSVar(key), loadedStyles[key])
      }
    }
  }

  // Get current css and selectors
  const currentWindow = await browser.windows.getCurrent()
  const css = await browser.runtime.sendMessage({
    instanceType: 'sidebar',
    windowId: currentWindow.id,
    action: 'getCustomTheme',
  })
  const selectors = await browser.runtime.sendMessage({
    instanceType: 'sidebar',
    windowId: currentWindow.id,
    action: 'getCssSelectors',
  })

  // Render selectors
  const walker = (nodes, parent) => {
    for (let node of nodes) {
      const [el, childrenEl] = createSelectorEl(node)
      parent.appendChild(el)
      if (node.children && node.children.length) {
        walker(node.children, childrenEl)
      }
    }
  }
  walker(selectors, selectorsEl)

  // Update theme
  textFieldEl.value = css || ''
  if (!textFieldEl.value) editorSectionEl.classList.add('-empty')
  else editorSectionEl.classList.remove('-empty')
  textFieldEl.addEventListener('keydown', event => {
    if (event.key === 'Tab') event.preventDefault()
    applyCSS(event)
  })
  textFieldEl.addEventListener('input', applyCSS)
  textFieldEl.addEventListener('change', applyCSS)

  // Listen for click on selectors
  selectorsEl.addEventListener('click', event => {
    let selectorEl = event.target
    while (selectorEl && !selectorEl.classList.contains('selector')) {
      selectorEl = selectorEl.parentNode
    }
    if (!selectorEl) return

    const childNodes = Array.from(selectorEl.childNodes)
    const childrenEl = childNodes.find(c => c.classList.contains('children'))

    if (!childrenEl) return
    if (childrenEl.style.display === 'none') {
      childrenEl.style.display = ''
      selectorEl.classList.add('-expanded')
      selectorEl.classList.remove('-folded')
    } else {
      childrenEl.style.display = 'none'
      selectorEl.classList.remove('-expanded')
      selectorEl.classList.add('-folded')
    }
  })
})()

/**
 * Create element of selector
 */
function createSelectorEl(info) {
  const el = document.createElement('div')
  el.classList.add('selector')

  // Body
  const bodyEl = document.createElement('div')
  bodyEl.classList.add('body')
  el.appendChild(bodyEl)

  // Tag
  if (info.tag) {
    const tabEl = document.createElement('div')
    tabEl.classList.add('tag')
    tabEl.innerText = info.tag
    bodyEl.appendChild(tabEl)
  }

  // Id
  if (info.id) {
    const idEl = document.createElement('div')
    idEl.classList.add('id')
    idEl.innerText = '#' + info.id
    bodyEl.appendChild(idEl)
  }

  // Class
  if (info.classList && info.classList.length) {
    for (let className of info.classList) {
      if (!className) continue
      const classEl = document.createElement('div')
      classEl.classList.add('class')
      classEl.innerText = '.' + className
      bodyEl.appendChild(classEl)
    }
  }

  // Attributes
  if (info.attrs && info.attrs.length) {
    for (let attr of info.attrs) {
      if (!attr) continue
      const attrEl = document.createElement('div')
      attrEl.classList.add('attr')
      let s = '[' + attr[0]
      if (attr[1]) s += `="${attr[1]}"`
      s += ']'
      attrEl.innerText = s
      bodyEl.appendChild(attrEl)
    }
  }

  // Children
  let childrenEl
  if (info.children && info.children.length) {
    childrenEl = document.createElement('div')
    childrenEl.classList.add('children')
    el.appendChild(childrenEl)

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#icon_expand')
    svgEl.appendChild(useEl)
    el.appendChild(svgEl)
  }

  return [el, childrenEl]
}

/**
 * Apply css
 */
function applyCSS(event) {
  const value = event.target.value

  if (applyTimeout) clearTimeout(applyTimeout)
  applyTimeout = setTimeout(() => {
    const parent = event.target.parentNode
    if (parent) {
      if (!value) parent.classList.add('-empty')
      else parent.classList.remove('-empty')
    }

    browser.runtime.sendMessage({
      instanceType: 'sidebar',
      action: 'setCustomTheme',
      arg: value,
    })
    applyTimeout = null
  }, 750)
}

/**
 * Generate noise
 */
function generateNoise(el) {
  NoiseBg(el, {
    width: 300,
    height: 300,
    gray: [12, 175],
    alpha: [0, 66],
    spread: [0, 9],
  })
  let scaleShift = ~~window.devicePixelRatio
  let sW = 300 >> scaleShift
  let sH = 300 >> scaleShift
  el.style.backgroundSize = `${sW}px ${sH}px`
}