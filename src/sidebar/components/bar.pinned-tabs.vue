<template lang="pug">
.PinnedTabsBar(
  ref="barEl"
  tabindex="-1"
  :data-empty="pinnedTabs.length === 0"
  :data-overflow="overflow"
  :data-dnd-end="dropToEnd"
  data-dnd-type="pinned-bar"
  :data-dnd-id="panel?.id ?? NOID"
  @wheel="onWheel"
  @scroll.passive="recalcOverflow"
  @dragover="onDragOver"
  @drop="onDrop")
  .tab-wrapper(v-for="id in pinnedTabs" :key="id" :data-targeted="DnD.reactive.dstPin && dropId === id")
    Tab(:tabId="id")
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import type * as T from 'src/types'
import * as E from 'src/enums'
import * as Utils from 'src/utils'
import * as Settings from 'src/services/settings'
import * as Tabs from 'src/services/tabs.fg'
import * as Mouse from 'src/services/mouse.fg'
import * as DnD from 'src/services/drag-and-drop.fg'
import Tab from './tab.vue'
import { NOID } from 'src/defaults'

const props = defineProps<{ panel?: T.TabsPanel }>()
const pinnedTabs = computed(() => {
  if (props.panel) return props.panel.reactive.pinnedTabIds
  else return Tabs.reactive.pinnedIds
})
const dropId = computed(() => {
  const tab = Tabs.list[DnD.reactive.dstIndex]
  if (!tab || !tab.pinned || (props.panel && tab.panelId !== props.panel.id)) return NOID
  else return tab.id
})
const dropToEnd = computed(() => DnD.reactive.dstPin && dropId.value === NOID)

const barEl = useTemplateRef<HTMLElement>('barEl')

// Fixed for the lifetime of this mount - Sidebar.reMountSidebar() recreates
// the whole sidebar tree on every settings change, matching the non-reactive
// module-level `let`s sidebar.vue itself uses for the same thing.
// Settings.pinnedTabsBarVertical is the single shared source of truth for
// the scroll axis (left/right positions, or a row-capped titled list) so
// this component and Tabs.scrollToPinnedTab can't drift out of sync.
const vertical = Settings.pinnedTabsBarVertical
const scrollable =
  vertical || (Settings.state.pinnedTabsSingleLine && !Settings.state.pinnedTabsList)

type Overflow = 'start' | 'end' | 'both' | undefined
const overflow = ref<Overflow>(undefined)

function recalcOverflow(): void {
  const el = barEl.value
  if (!el || !scrollable) {
    overflow.value = undefined
    return
  }

  const scrollSize = vertical ? el.scrollHeight : el.scrollWidth
  const clientSize = vertical ? el.clientHeight : el.clientWidth
  const offset = vertical ? el.scrollTop : el.scrollLeft

  if (!clientSize || scrollSize - clientSize <= 1) {
    overflow.value = undefined
    return
  }

  const atStart = offset <= 1
  const atEnd = offset + clientSize >= scrollSize - 1
  if (atStart && atEnd) overflow.value = undefined
  else if (atStart) overflow.value = 'end'
  else if (atEnd) overflow.value = 'start'
  else overflow.value = 'both'
}

const onWheelSwitchTab = Mouse.getWheelDebouncer(E.WheelDirection.Vertical, (e: WheelEvent) => {
  if (
    Settings.state.pinnedTabsPosition !== 'panel' &&
    Settings.state.scrollThroughTabs !== 'none'
  ) {
    const globaly = (Settings.state.scrollThroughTabs === 'global') !== e.shiftKey
    const cyclic = Settings.state.scrollThroughTabsCyclic !== e.ctrlKey

    const globPin = Settings.state.scrollThroughTabsGlobPinIsolate ? true : undefined
    if (e.deltaY > 0) Tabs.switchTab(globaly, cyclic, 1, globPin)
    else if (e.deltaY < 0) Tabs.switchTab(globaly, cyclic, -1, globPin)
  }
})

function onWheel(e: WheelEvent): void {
  // Read deltas BEFORE touching e.deltaMode - on some platforms accessing
  // deltaMode first can flip Firefox's reported delta units to line/page
  // (https://bugzilla.mozilla.org/show_bug.cgi?id=1814084, see also
  // Mouse.getWheelDebouncer).
  const dy = e.deltaY
  const dx = e.deltaX
  const mode = e.deltaMode

  const el = barEl.value
  if (scrollable && el && overflow.value) {
    const firstWrapper = el.firstElementChild as HTMLElement | null
    let delta = vertical ? dy || dx : dx || dy
    if (mode === 1) {
      delta *= firstWrapper ? (vertical ? firstWrapper.offsetHeight : firstWrapper.offsetWidth) : 32
    } else if (mode === 2) {
      delta *= vertical ? el.clientHeight : el.clientWidth
    }

    if (delta) {
      if (vertical) el.scrollTop += delta
      else el.scrollLeft += delta
    }

    e.preventDefault()
    // Keep .TabsPanel's vertical wheel handler and .panel-box's hScrollAction
    // horizontal handler from also reacting to this event.
    e.stopPropagation()
    return
  }

  onWheelSwitchTab(e)
}

function onDragOver(e: DragEvent): void {
  const el = barEl.value
  if (!el || !scrollable) return

  const box = el.getBoundingClientRect()
  // Clamp to the box's own size: a capped titled list can be as short as one
  // row (~32px), where a fixed 24px edge zone would cover the whole box and
  // make it impossible to hover anywhere without triggering autoscroll.
  const size = vertical ? box.height : box.width
  const edge = Math.min(24, Math.floor(size / 3))
  const step = 12
  if (vertical) {
    if (e.clientY - box.top < edge) el.scrollTop -= step
    else if (box.bottom - e.clientY < edge) el.scrollTop += step
  } else {
    if (e.clientX - box.left < edge) el.scrollLeft -= step
    else if (box.right - e.clientX < edge) el.scrollLeft += step
  }
}

function onDrop(): void {
  DnD.reactive.dstType = E.DropType.Tabs
  DnD.reactive.dstPin = true
}

let resizeObserver: ResizeObserver | null = null
let recalcOnResize: Utils.FuncCtx | null = null

onMounted(() => {
  if (!scrollable || !barEl.value) return

  recalcOnResize = Utils.asap(() => recalcOverflow(), 180)
  resizeObserver = new ResizeObserver(recalcOnResize.func)
  resizeObserver.observe(barEl.value)
  recalcOverflow()

  const activeTab = Tabs.byId[Tabs.activeId]
  if (activeTab?.pinned) Tabs.scrollToPinnedTab(activeTab.id)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

// A ResizeObserver on the bar does NOT reliably fire when a pin is
// added/removed: in nowrap/column mode the bar's own border-box size is
// fixed (100% of its flex parent), only its scrollWidth/scrollHeight
// changes - except in capped titled-list mode, where the bar grows with its
// content up to the cap, so the observer alone would do for that case. The
// watch below covers every case uniformly.
watch(
  () => pinnedTabs.value.length,
  () => recalcOverflow(),
  { flush: 'post' }
)
</script>
