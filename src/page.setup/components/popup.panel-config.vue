<template lang="pug">
.ConfigPopup(ref="rootEl" @wheel="onWheel")
  h2(v-if="isStaticName") {{conf.name}}
  TextInput.title(
    v-if="!isStaticName"
    ref="nameInput"
    :line="true"
    :value="conf.name"
    :or="translate('panel.name_placeholder')"
    @update:value="onNameInput")

  SelectField(
    v-if="Utils.isTabsPanel(conf) && !conf.iconIMGSrc"
    label="panel.icon_label"
    optLabel="settings.panel_icon_"
    :value="iconSVG"
    :opts="TABS_PANEL_ICON_OPTS"
    :color="color"
    @update:value="setIcon")
  SelectField(
    v-if="Utils.isBookmarksPanel(conf) && !conf.iconIMGSrc"
    label="panel.icon_label"
    optLabel="settings.panel_icon_"
    :value="iconSVG"
    :opts="BOOKMARKS_PANEL_ICON_OPTS"
    :color="color"
    @update:value="setIcon")

  SelectField(
    v-if="!conf.iconIMGSrc"
    label="panel.color_label"
    :value="color"
    :opts="COLOR_OPTS"
    :icon="iconSVG"
    @update:value="setColor")

  .TextField.custom-icon(v-if="Utils.isTabsPanel(conf) || Utils.isBookmarksPanel(conf)")
    .body
      .label {{translate('panel.custom_icon')}}
      TextInput(
        :value="conf.iconIMGSrc"
        :line="true"
        :or="translate('panel.custom_icon_placeholder')"
        @update:value="onCustomIconInput")
      img(v-if="state.customIconUrl" :src="state.customIconUrl" @load="onCustomIconLoad")
      .btn(
        v-if="state.customIconType === 'url' && !state.customIconUrl"
        @click="loadCustomIcon") {{translate('panel.custom_icon_load')}}
    .note {{translate('panel.custom_icon_note')}}

  ToggleField(
    label="panel.lock_panel_label"
    :value="conf.lockedPanel"
    @update:value="togglePanelLock")

  ToggleField(
    v-if="isNotTabsPanel(conf)"
    label="panel.temp_mode_label"
    :value="conf.tempMode"
    @update:value="toggleTempMode")

  ToggleField(
    v-if="Utils.isTabsPanel(conf)"
    label="panel.lock_tabs_label"
    :value="conf.lockedTabs"
    @update:value="toggleTabsLock")

  ToggleField(
    label="panel.skip_on_switching"
    :value="conf.skipOnSwitching"
    @update:value="toggleSkipOnSwitching")

  ToggleField(
    v-if="Utils.isTabsPanel(conf)"
    label="panel.no_empty_label"
    :value="conf.noEmpty"
    @update:value="togglePanelNoEmpty")

  SelectField(
    v-if="Utils.isTabsPanel(conf)"
    label="panel.new_tab_ctx"
    :value="newTabCtx"
    :opts="containersOpts"
    @update:value="togglePanelNewTabCtx")

  SelectField(
    v-if="Utils.isTabsPanel(conf)"
    label="panel.drop_tab_ctx"
    :value="dropTabCtx"
    :opts="availableForAutoMoveContainersOpts"
    @update:value="togglePanelDropTabCtx")

  SelectField(
    v-if="Utils.isTabsPanel(conf)"
    label="panel.move_tab_ctx"
    optLabel="panel.move_tab_ctx_"
    :value="moveTabCtx"
    :opts="availableForAutoMoveContainersOpts"
    @update:value="togglePanelMoveTabCtx")
  .sub-fields(v-if="Utils.isTabsPanel(conf)")
    ToggleField(
      label="panel.move_tab_ctx_nochild"
      :inactive="moveTabCtx === 'none'"
      :value="conf.moveTabCtxNoChild"
      @update:value="togglePanelMoveTabCtxNoChild")

  ToggleField(
    v-if="Utils.isTabsPanel(conf)"
    label="panel.url_rules"
    :value="conf.urlRulesActive"
    @update:value="toggleUrlRules")
  .sub-fields.-nosep(v-if="Utils.isTabsPanel(conf) && conf.urlRulesActive")
    .field
      TextInput.text(
        ref="urlRulesInput"
        or="---"
        :value="conf.urlRules"
        :valid="urlRulesValid"
        @update:value="onUrlRulesInput")

  SelectField(
    v-if="Utils.isBookmarksPanel(conf)"
    label="panel.bookmarks_view_mode"
    optLabel="panel.bookmarks_view_mode_"
    :value="conf.viewMode"
    :opts="['tree', 'history']"
    @update:value="selectBookmarksViewMode")

  .InfoField.-folder(v-if="isBookmarks")
    .label {{translate('panel.root_id_label')}}
    .value {{rootPath}}
    .ctrls
      .btn(@click="setBookmarksRootId") {{translate('panel.root_id.choose')}}
      .btn(@click="resetBookmarksRootId") {{translate('panel.root_id.reset')}}

  TextField(
    v-if="Utils.isTabsPanel(conf)"
    label="panel.new_tab_custom_btns"
    :inactive="!Settings.reactive.showNewTabBtns"
    :or="translate('panel.new_tab_custom_btns_placeholder')"
    :note="translate('panel.new_tab_custom_btns_note')"
    :value="newTabBtnsText"
    :line="false"
    @update:value="onNewTabBtnsUpdate")
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import Utils from 'src/utils'
import { translate } from 'src/dict'
import { FOLDER_NAME_DATA_RE } from 'src/defaults'
import { DEFAULT_CONTAINER_ID, COLOR_OPTS, PANEL_ICON_OPTS, BKM_OTHER_ID } from 'src/defaults'
import { BKM_ROOT_ID } from 'src/defaults'
import { TextInputComponent, PanelConfig, BookmarksPanelConfig, TrashPanelConfig } from 'src/types'
import { HistoryPanelConfig, StatsPanelConfig, DownloadsPanelConfig } from 'src/types'
import { Settings } from 'src/services/settings'
import { Containers } from 'src/services/containers'
import { Sidebar } from 'src/services/sidebar'
import { Permissions } from 'src/services/permissions'
import { SetupPage } from 'src/services/setup-page'
import { Bookmarks } from 'src/services/bookmarks'
import TextField from '../../components/text-field.vue'
import TextInput from '../../components/text-input.vue'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'
import { Favicons } from 'src/services/favicons'

interface ContainerOption {
  value: string
  icon?: string
  color?: string
  tooltip?: string
}

const URL_RE = /^https?:\/\/.+/
const TABS_PANEL_ICON_OPTS = [{ value: 'icon_tabs', icon: 'icon_tabs' }, ...PANEL_ICON_OPTS]
const BOOKMARKS_PANEL_ICON_OPTS = [
  { value: 'icon_bookmarks', icon: 'icon_bookmarks' },
  ...PANEL_ICON_OPTS,
]

const state = reactive({
  customIconUrl: '',
  customIconType: '',
})

let updCustomIconTimeout: number

const rootEl = ref<HTMLElement | null>(null)
const nameInput = ref<TextInputComponent | null>(null)
const urlRulesInput = ref<TextInputComponent | null>(null)

const props = defineProps<{ conf: PanelConfig; index?: number }>()

const isBookmarks = computed<boolean>(() => Utils.isBookmarksPanel(props.conf))
const isTabs = computed<boolean>(() => Utils.isTabsPanel(props.conf))
const isStaticName = computed<boolean>(() => !isTabs.value && !isBookmarks.value)
const containersOpts = computed<ContainerOption[]>(() => {
  const result: ContainerOption[] = []

  result.push({ value: DEFAULT_CONTAINER_ID, color: 'toolbar', icon: 'icon_tabs' })

  for (let c of Object.values(Containers.reactive.byId)) {
    result.push({ value: c.id, color: c.color, icon: c.icon, tooltip: c.name })
  }

  result.push({ value: 'none', color: 'inactive', icon: 'icon_none' })

  return result
})
const availableForAutoMoveContainersOpts = computed<ContainerOption[]>(() => {
  const result: ContainerOption[] = []
  const used: Record<string, boolean> = {}

  for (const p of Sidebar.reactive.panels) {
    if (Utils.isTabsPanel(p) && p.id !== props.conf.id) used[p.moveTabCtx] = true
  }

  if (!used[DEFAULT_CONTAINER_ID]) {
    result.push({ value: DEFAULT_CONTAINER_ID, color: 'toolbar', icon: 'icon_tabs' })
  }

  for (let c of Object.values(Containers.reactive.byId)) {
    if (!used[c.id]) result.push({ value: c.id, color: c.color, icon: c.icon, tooltip: c.name })
  }

  result.push({ value: 'none', color: 'inactive', icon: 'icon_none' })

  return result
})
const iconSVG = computed<string>(() => props.conf.iconSVG || '')
const color = computed<string>(() => props.conf.color || '')
const newTabCtx = computed<string>(() => {
  return (Utils.isTabsPanel(props.conf) && props.conf.newTabCtx) || ''
})
const dropTabCtx = computed<string>(() => {
  return (Utils.isTabsPanel(props.conf) && props.conf.dropTabCtx) || ''
})
const moveTabCtx = computed<string>(() => {
  return (Utils.isTabsPanel(props.conf) && props.conf.moveTabCtx) || ''
})
const urlRulesValid = computed<'valid' | ''>(() => {
  return Utils.isTabsPanel(props.conf) && props.conf.urlRules && props.conf.urlRules.length > 1
    ? 'valid'
    : ''
})
const rootPath = computed<string>(() => {
  if (!Utils.isBookmarksPanel(props.conf)) return ''
  if (!props.conf.rootId) return '/'
  if (props.conf.rootId === BKM_ROOT_ID) return '/'

  let parent = Bookmarks.reactive.byId[props.conf.rootId]
  if (!parent) return '/'

  const path: string[] = []
  while (parent) {
    const titleExec = FOLDER_NAME_DATA_RE.exec(parent.title)
    if (titleExec) path.push(titleExec[1])
    else path.push(parent.title)
    parent = Bookmarks.reactive.byId[parent.parentId]
  }

  return '/' + path.reverse().join('/')
})
const newTabBtnsText = computed<string>(() => {
  if (!Utils.isTabsPanel(props.conf)) return ''
  return props.conf.newTabBtns.join('\n')
})

onMounted(() => {
  init()

  if (!Bookmarks.reactive.tree.length) Bookmarks.load()
})

function isNotTabsPanel(
  conf: PanelConfig
): conf is
  | BookmarksPanelConfig
  | HistoryPanelConfig
  | StatsPanelConfig
  | TrashPanelConfig
  | DownloadsPanelConfig {
  return !!conf && !Utils.isTabsPanel(conf)
}

function onWheel(e: WheelEvent): void {
  if (!rootEl.value) return
  const scrollOffset = rootEl.value.scrollTop
  const maxScrollOffset = rootEl.value.scrollHeight - rootEl.value.offsetHeight
  if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
  if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
}

function onNameInput(value: string): void {
  props.conf.name = value
  if (value) Sidebar.saveSidebar(500)
}

function setIcon(value: string): void {
  props.conf.iconSVG = value
  Sidebar.saveSidebar()
}

function setColor(value: browser.ColorName): void {
  props.conf.color = value
  Sidebar.saveSidebar()
}

function onCustomIconInput(value: string): void {
  props.conf.iconIMGSrc = value
  updCustomIconTimeout = Utils.wait(updCustomIconTimeout, 500, () => updateCustomIcon())
}

function updateCustomIcon(): void {
  let normValue = props.conf.iconIMGSrc?.trim()

  if (!normValue) {
    state.customIconType = ''
    state.customIconUrl = ''
    props.conf.iconIMG = ''
    Sidebar.saveSidebar()
    return
  }

  if (normValue.startsWith('data:image')) {
    state.customIconType = 'base64'
    state.customIconUrl = normValue
    props.conf.iconIMG = normValue
    Sidebar.saveSidebar()
    return
  }

  if (URL_RE.test(normValue)) {
    state.customIconType = 'url'
    state.customIconUrl = ''
    return
  }

  state.customIconType = 'char'
  state.customIconUrl = ''
  return drawTextIcon()
}

async function onCustomIconLoad(e: Event): Promise<void> {
  if (!state.customIconUrl) return
  if (state.customIconUrl.startsWith('data:image')) return

  const img = e.target as HTMLImageElement
  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight)
  let base64 = canvas.toDataURL('image/png')

  try {
    props.conf.iconIMG = await Favicons.resizeFavicon(base64)
  } catch {
    return
  }
  Sidebar.saveSidebar()
}

function drawTextIcon(): void {
  if (!props.conf.iconIMGSrc) return
  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')
  if (!ctx) return

  let [txt, color, font] = props.conf.iconIMGSrc.split('::')
  if (!color) {
    if (Settings.reactive.colorScheme === 'light') color = '#000000'
    if (Settings.reactive.colorScheme === 'dark') color = '#ffffff'
  }
  if (!font) {
    font = '32px sans-serif'
  }

  canvas.width = 32
  canvas.height = 32
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.font = font
  ctx.fillText(txt, 16, 16, 32)

  let base64 = canvas.toDataURL('image/png')

  state.customIconUrl = base64
  props.conf.iconIMG = base64
  Sidebar.saveSidebar()
}

function loadCustomIcon(): void {
  if (!props.conf.iconIMGSrc) return
  state.customIconUrl = props.conf.iconIMGSrc.trim()
}

async function init(): Promise<void> {
  await nextTick()
  if (props.conf.iconIMG) state.customIconUrl = props.conf.iconIMG
  if (nameInput.value) nameInput.value.recalcTextHeight()
  if (urlRulesInput.value) urlRulesInput.value.recalcTextHeight()
}

function togglePanelLock(): void {
  props.conf.lockedPanel = !props.conf.lockedPanel
  Sidebar.saveSidebar()
}

function toggleTempMode(): void {
  if (!isNotTabsPanel(props.conf)) return
  props.conf.tempMode = !props.conf.tempMode
  Sidebar.saveSidebar()
}

function toggleTabsLock(): void {
  if (!Utils.isTabsPanel(props.conf)) return
  props.conf.lockedTabs = !props.conf.lockedTabs
  Sidebar.saveSidebar()
}

function toggleSkipOnSwitching(): void {
  props.conf.skipOnSwitching = !props.conf.skipOnSwitching
  Sidebar.saveSidebar()
}

function togglePanelNoEmpty(): void {
  if (!Utils.isTabsPanel(props.conf)) return
  props.conf.noEmpty = !props.conf.noEmpty
  Sidebar.saveSidebar()
}

function togglePanelNewTabCtx(value: string): void {
  if (!Utils.isTabsPanel(props.conf)) return
  props.conf.newTabCtx = value
  Sidebar.saveSidebar()
}

function togglePanelDropTabCtx(value: string): void {
  if (!Utils.isTabsPanel(props.conf)) return
  props.conf.dropTabCtx = value
  Sidebar.saveSidebar()
}

function togglePanelMoveTabCtx(value: string): void {
  if (!Utils.isTabsPanel(props.conf)) return
  props.conf.moveTabCtx = value
  Sidebar.saveSidebar()
}

function togglePanelMoveTabCtxNoChild(value: boolean): void {
  if (!Utils.isTabsPanel(props.conf)) return
  props.conf.moveTabCtxNoChild = value
  Sidebar.saveSidebar()
}

async function toggleUrlRules(): Promise<void> {
  if (!Utils.isTabsPanel(props.conf)) return
  if (!props.conf.urlRulesActive) {
    if (!Permissions.reactive.webData) {
      window.location.hash = 'all-urls'
      SetupPage.reactive.selectedPanel = null
      return
    }
  }

  props.conf.urlRulesActive = !props.conf.urlRulesActive
  Sidebar.saveSidebar()

  await nextTick()

  if (urlRulesInput.value) urlRulesInput.value.focus()
}

function onUrlRulesInput(value: string): void {
  if (!Utils.isTabsPanel(props.conf)) return
  props.conf.urlRules = value
  Sidebar.saveSidebar(500)
}

async function setBookmarksRootId(): Promise<void> {
  if (!Utils.isBookmarksPanel(props.conf)) return

  if (!Permissions.reactive.bookmarks) {
    browser.permissions.request({ origins: [], permissions: ['bookmarks'] })
    return
  }

  const result = await Bookmarks.openBookmarksPopup({
    title: translate('popup.bookmarks.select_root_folder'),
    controls: [{ label: 'btn.save' }],
    location: BKM_OTHER_ID,
    locationField: true,
    locationTree: true,
  })

  if (result && result.location) {
    props.conf.rootId = result.location
    Sidebar.saveSidebar(500)
  }
}

function resetBookmarksRootId(): void {
  if (!Utils.isBookmarksPanel(props.conf)) return
  props.conf.rootId = BKM_ROOT_ID
  Sidebar.saveSidebar(500)
}

function onNewTabBtnsUpdate(value: string): void {
  if (!Utils.isTabsPanel(props.conf)) return

  const rawBtns = value.split('\n')
  const btns: string[] = []
  rawBtns.forEach(btn => btns.push(btn.trim()))
  if (btns.length === 1 && !btns[0]) btns.pop()

  props.conf.newTabBtns = btns
  Sidebar.saveSidebar(500)
}

function selectBookmarksViewMode(value: string): void {
  if (!Utils.isBookmarksPanel(props.conf)) return

  props.conf.viewMode = value
  Sidebar.saveSidebar()
}
</script>
