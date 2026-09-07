<template lang="pug">
.AnimatedTabList(ref="rootEl" @mouseleave="onMouseLeave")
  TabComponent(v-for="id in panel.reactive.visibleTabIds" :key="id" :tabId="id")
  NewTabBar(v-if="Settings.newTabBarPositionAfterTabs" :panel="panel")
  .scroll-retainer(ref="srEl")
  .bottom-space
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUpdate, onUpdated, useTemplateRef } from 'vue'
import type { TabsPanel } from 'src/types'
import * as Settings from 'src/services/settings'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Tabs from 'src/services/tabs.fg'
import * as Logs from 'src/services/logs'
import * as Mouse from 'src/services/mouse.fg'
import TabComponent from './tab.vue'
import NewTabBar from './bar.new-tab.vue'

const rootEl = useTemplateRef('rootEl')
const srEl = useTemplateRef('srEl')
const added: HTMLElement[] = []
const moved: HTMLElement[] = []
const moveAnimated: HTMLElement[] = []
const onceConf = { once: true }
let animations = false
let scrollEl: HTMLElement | null = null
let scrollBoxHeight = 0
let scrollBoxScroll = 0
let contentBoxHeight = 0
let retainerHeight = 0

const props = defineProps<{ panel: TabsPanel }>()

onMounted(() => {
  animations = Settings.state.animations
  if (srEl.value) srEl.value.__sdbr_sr = true
})

onBeforeUpdate(() => {
  if (!Tabs.ready) return

  scrollEl = props.panel.scrollEl
  const contentEl = props.panel.scrollComponent?.getScrollableBox?.()
  if (!scrollEl || !contentEl) return

  scrollBoxHeight = scrollEl.offsetHeight
  scrollBoxScroll = scrollEl.scrollTop
  contentBoxHeight = contentEl.offsetHeight
  const children = (rootEl.value?.children ?? []) as HTMLElement[]

  let removedHeight = 0
  const retainScroll = scrollBoxScroll > 0
  const len = children.length - 2
  for (let i = 0; i < len; i++) {
    const el = children[i]
    el.__sdbr_index = i
    if (retainScroll && el.__sdbr_tabId) {
      const tab = Tabs.byId[el.__sdbr_tabId]
      if (!tab || tab.removing || tab.invisible) {
        removedHeight += el.offsetHeight
      }
    }
    el.__sdbr_prevOffsetTop = el.offsetTop
  }

  if (retainScroll && srEl.value) {
    const el = srEl.value
    if (Mouse.mouseIn) {
      const visibleBottomY = scrollBoxHeight + scrollBoxScroll
      const scrollReserve = contentBoxHeight - visibleBottomY
      const retainHeight = removedHeight - scrollReserve
      const prevRetainerHeight = retainerHeight
      retainerHeight += retainHeight
      if (retainerHeight < 0) retainerHeight = 0
      if (prevRetainerHeight !== retainerHeight) el.style.height = `${retainerHeight}px`
    }
  }
})

onUpdated(() => {
  if (!scrollEl) return
  if (!Tabs.ready) return

  const children = (rootEl.value?.children ?? []) as HTMLElement[]
  const len = children.length - 2

  for (let i = 0; i < len; i++) {
    const child = children[i]
    const prevIndex = child.__sdbr_index
    child.__sdbr_index = i

    // Added item
    if (prevIndex === undefined) {
      added.push(child)
      child.style.transitionDuration = '0s'
      child.classList.add('-hidden')
    }

    // Moved item
    else if (prevIndex !== i) {
      // Always recalc offsetTop of the new-tab-buttons-bar
      if (!child.__sdbr_ntbb) child.__sdbr_deltaIndex = prevIndex - i
      moved.push(child)
    }
  }

  if (added.length || moved.length) {
    // if (added.length && animations) {
    //   let appearingShift = 0
    //   let prevIndex = -1
    //   for (const el of added) {
    //     if (el.__sdbr_index !== prevIndex + 1) appearingShift = 0
    //     appearingShift -= 16
    //     prevIndex = el.__sdbr_index ?? -1
    //     el.style.transform = `translateY(${appearingShift}px)`
    //     el.style.pointerEvents = 'none'
    //     el.style.transitionDuration = '0s'
    //   }
    // }

    if (moved.length && animations) {
      let dy = 0
      let prevDeltaIndex = 0
      for (const el of moved) {
        const index = el.__sdbr_index
        if (index === undefined) continue

        const deltaIndex = el.__sdbr_deltaIndex ?? 0
        el.__sdbr_deltaIndex = 0

        const prevTop = el.__sdbr_prevOffsetTop
        if (prevTop === undefined) break

        // Predict / Retrive current possition
        let top
        if (prevDeltaIndex === deltaIndex && deltaIndex && dy) top = prevTop - dy
        else top = el.offsetTop
        prevDeltaIndex = deltaIndex

        if (prevTop < scrollBoxScroll && top < scrollBoxScroll) continue
        const visibleBottomY = scrollBoxHeight + scrollBoxScroll
        if (prevTop > visibleBottomY && top > visibleBottomY) break

        moveAnimated.push(el)

        dy = prevTop - top

        el.style.transform = `translateY(${dy}px)`
        el.style.pointerEvents = 'none'
        el.style.transitionDuration = '0s'
      }
    }

    forceReflow()

    if (moveAnimated.length) {
      for (const el of moveAnimated) {
        el.style.transform = ''
        el.style.pointerEvents = ''
        el.style.transitionDuration = ''
      }
    }

    if (added.length) {
      const len = added.length
      const scrollRetained = retainerHeight > 0
      const delayStep = Math.trunc(Sidebar.transitionDurNorm / len / 2)
      let addedHeight = 0
      let delay = 0
      for (const el of added) {
        el.style.transform = ''
        el.style.pointerEvents = ''
        el.style.transitionDuration = ''
        el.classList.remove('-hidden')
        if (len > 1) {
          el.style.transitionDelay = `${delay}ms`
          el.addEventListener('transitionend', () => (el.style.transitionDelay = ''), onceConf)
          delay += delayStep
        }
        if (scrollRetained) addedHeight += el.offsetHeight
      }
      if (retainerHeight > 0 && addedHeight > 0 && srEl.value) {
        retainerHeight -= addedHeight
        if (retainerHeight < 0) retainerHeight = 0
        srEl.value.style.height = `${retainerHeight}px`
      }
    }
  }

  added.length = 0
  moved.length = 0
  moveAnimated.length = 0
})

function forceReflow() {
  document.body.offsetHeight
}

function onMouseLeave() {
  if (retainerHeight > 0 && srEl.value) {
    retainerHeight = 0
    srEl.value.style.height = `${retainerHeight}px`
  }
}
</script>
