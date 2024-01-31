<template lang="pug">
.AnimatedTabList(ref="rootEl")
  slot
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUpdate, onUpdated } from 'vue'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Tabs } from 'src/services/tabs.fg'
import { TabsPanel } from 'src/types'

interface SdbrHTMLElement extends HTMLElement {
  __sdbr_isTab?: boolean
  __sdbr_index?: number
}

const rootEl = ref<HTMLElement | null>(null)
const prevPositions = new Map<HTMLElement, number>()
let prevChildren: SdbrHTMLElement[] = []
let children: SdbrHTMLElement[] = []
let enabled = false
let scrollEl: HTMLElement | null = null

const props = defineProps<{
  panel: TabsPanel
}>()

function getChildEls(): SdbrHTMLElement[] {
  const elsCollection = rootEl.value?.children
  if (!elsCollection) return []
  else return Array.from(elsCollection) as SdbrHTMLElement[]
}

onMounted(() => {
  enabled = Settings.state.animations
})

let viewportHeight = 0
onBeforeUpdate(() => {
  if (!enabled) return
  if (!Tabs.ready) return

  const fullTabHeight = Sidebar.tabHeight + Sidebar.tabMargin

  scrollEl = props.panel.scrollEl
  if (!scrollEl) return

  viewportHeight = scrollEl.offsetHeight
  prevChildren = getChildEls()

  for (let i = 0; i < prevChildren.length; i++) {
    const el = prevChildren[i]
    if (el.classList.contains('Tab')) {
      prevPositions.set(el, i * fullTabHeight)
      el.__sdbr_isTab = true
    } else {
      prevPositions.set(el, el.getBoundingClientRect().top)
    }
  }
})

onUpdated(() => {
  if (!enabled) return
  if (!scrollEl) return
  if (!Tabs.ready) return

  children = getChildEls()

  const fullTabHeight = Sidebar.tabHeight + Sidebar.tabMargin
  const added: SdbrHTMLElement[] = []
  const moved: SdbrHTMLElement[] = []

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const prevIndex = prevChildren.indexOf(child)
    child.__sdbr_index = i

    // Added item
    if (prevIndex === -1) {
      added.push(child)
      child.style.transitionDuration = '0s'
      child.classList.add('-hidden')
    }

    // Moved item
    else if (prevIndex !== i) {
      moved.push(child)
    }
  }

  if (added.length || moved.length) {
    const moveAnimated: SdbrHTMLElement[] = []
    if (moved.length) {
      const scrollTop = scrollEl.scrollTop

      for (const el of moved) {
        const index = el.__sdbr_index
        if (index === undefined) continue

        const prevPosition = prevPositions.get(el)
        if (prevPosition === undefined) break

        const prevTop = prevPosition
        let top
        if (el.__sdbr_isTab || el.classList.contains('Tab')) {
          top = index * fullTabHeight

          // Skip animation of tabs out of the viewport
          if (
            (prevTop - scrollTop < -fullTabHeight && top - scrollTop < -fullTabHeight) ||
            (prevTop - scrollTop > viewportHeight + fullTabHeight &&
              top - scrollTop > viewportHeight + fullTabHeight)
          ) {
            continue
          }
        } else {
          top = el.getBoundingClientRect().top
        }

        moveAnimated.push(el)

        const dy = prevTop - top

        el.style.transform = `translateY(${dy}px)`
        el.style.transitionDuration = '0s'
      }
    }

    forceReflow()

    if (moveAnimated.length) {
      for (const el of moveAnimated) {
        el.style.transform = ''
        el.style.transitionDuration = ''
      }

      forceUpdateHoverState(moveAnimated[moveAnimated.length - 1])
    }

    if (added.length) {
      for (const el of added) {
        el.style.transitionDuration = ''
        el.classList.remove('-hidden')
      }
    }
  }

  prevPositions.clear()
})

let waitingTransitionEnd: { el: HTMLElement; cb: () => void } | undefined
function forceUpdateHoverState(el: HTMLElement) {
  if (waitingTransitionEnd) {
    waitingTransitionEnd.el.removeEventListener('transitionend', waitingTransitionEnd.cb)
  }

  const cb = () => {
    el.removeEventListener('transitionend', cb)
    waitingTransitionEnd = undefined

    window.requestAnimationFrame(() => {
      el.style.left = '-1px'
      forceReflow()
      el.style.left = ''
    })
  }
  el.addEventListener('transitionend', cb)
  waitingTransitionEnd = { el, cb }
}

function forceReflow() {
  document.body.offsetHeight
}
</script>
