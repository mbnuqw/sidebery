<template lang="pug">
.ConfigPopup(ref="rootEl" @wheel="onWheel")
  h2(v-if="isTabsOrBookmarks") {{conf.name}}
  TextInput.title(
    v-if="!isTabsOrBookmarks"
    ref="nameInput"
    :line="true"
    :value="conf.name"
    :or="translate('panel.name_placeholder')"
    @update:value="onNameInput")

  SelectField(
    v-if="Utils.isTabsPanel(conf)"
    label="panel.icon_label"
    optLabel="settings.panel_icon_"
    :value="iconSVG"
    :opts="TABS_PANEL_ICON_OPTS"
    :color="color"
    @update:value="setIcon")
  SelectField(
    v-if="Utils.isBookmarksPanel(conf)"
    label="panel.icon_label"
    optLabel="settings.panel_icon_"
    :value="iconSVG"
    :opts="BOOKMARKS_PANEL_ICON_OPTS"
    :color="color"
    @update:value="setIcon")

  SelectField(
    v-if="!isTabsOrBookmarks"
    label="panel.color_label"
    :value="color"
    :opts="COLOR_OPTS"
    :icon="iconSVG"
    @update:value="setColor")

  .TextField.custom-icon(v-if="Utils.isTabsPanel(conf) || Utils.isBookmarksPanel(conf)")
    .body
      .label {{translate('panel.custom_icon')}}
      .btn(:data-active="state.customIconType === 'text'" @click="setCustomIconType('text')").
        {{translate('panel.custom_icon_text_btn')}}
      .btn(:data-active="state.customIconType === 'url'" @click="setCustomIconType('url')").
        {{translate('panel.custom_icon_url_btn')}}
      .btn(:data-active="state.customIconType === 'file'" @click="setCustomIconType('file')")
        .btn-label {{translate('panel.custom_icon_file_btn')}}
        input(type="file" accept="image/*" @input="openCustomIconFile")
      .img-box(v-if="state.customIconUrl")
        img(:src="state.customIconUrl" @load="onCustomIconLoad" @error="onCustomIconError")
      .img-rm(v-if="state.customIconUrl" @click="onCustomIconRm")
        svg: use(xlink:href="#icon_remove")
    .body.-sub(v-if="state.customIconType === 'text'")
      TextInput(
        :value="state.customIconTextValue"
        :line="true"
        :or="translate('panel.custom_icon_text_placeholder')"
        @update:value="onCustomIconTextInput")
    .note.-sub(v-if="state.customIconType === 'text'") {{translate('panel.custom_icon_note')}}
    .body.-sub(v-if="state.customIconType === 'url'")
      TextInput(
        v-model:value="state.customIconUrlValue"
        :line="true"
        :or="translate('panel.custom_icon_url_placeholder')")
      .btn(@click="loadCustomIcon") {{translate('panel.custom_icon_load')}}

  .sub-fields(v-if="Utils.isTabsPanel(conf) || Utils.isBookmarksPanel(conf)")
    ToggleField(
      label="panel.custom_icon_colorize"
      :inactive="!state.customIconOriginal"
      :value="state.customIconColorize"
      @update:value="toggleCustomIconColorize")

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
    :folded="true"
    @update:value="togglePanelNewTabCtx")

  SelectField(
    v-if="Utils.isTabsPanel(conf)"
    label="panel.drop_tab_ctx"
    :value="dropTabCtx"
    :opts="availableForAutoMoveContainersOpts"
    :folded="true"
    @update:value="togglePanelDropTabCtx")

  SelectField(
    v-if="Utils.isBookmarksPanel(conf)"
    label="panel.bookmarks_view_mode"
    optLabel="panel.bookmarks_view_mode_"
    :value="conf.viewMode"
    :opts="['tree', 'history']"
    @update:value="selectBookmarksViewMode")

  ToggleField(
    v-if="Utils.isBookmarksPanel(conf)"
    label="panel.auto_convert"
    :inactive="rootDirIsFF"
    :value="conf.autoConvert"
    @update:value="toggleAutoConvert")

  .InfoField.-folder(v-if="isBookmarks")
    .label {{translate('panel.root_id_label')}}
    .value {{rootPath}}
    .ctrls
      .btn(@click="setBookmarksRootId") {{translate('panel.root_id.choose')}}
      .btn(@click="resetBookmarksRootId") {{translate('panel.root_id.reset')}}

  .InfoField(v-if="Utils.isTabsPanel(conf)")
    .label {{translate('panel.tab_move_rules')}}
    .btn(@click="openRulesPopup") {{getManageRulesBtnLabel(conf)}}

  .InfoField(v-if="Utils.isTabsPanel(conf)")
    .label {{translate('panel.new_tab_shortcuts')}}
    .btn(@click="openShortcutsPopup") {{getManageShortcutsBtnLabel(conf)}}
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import { translate } from 'src/dict'
import { BKM_MENU_ID, FOLDER_NAME_DATA_RE, RGB_COLORS } from 'src/defaults'
import { DEFAULT_CONTAINER_ID, COLOR_OPTS, PANEL_ICON_OPTS } from 'src/defaults'
import { BKM_ROOT_ID } from 'src/defaults'
import { TextInputComponent, PanelConfig, BookmarksPanelConfig, TabsPanelConfig } from 'src/types'
import { HistoryPanelConfig } from 'src/types'
import { Settings } from 'src/services/settings'
import { Containers } from 'src/services/containers'
import { Sidebar } from 'src/services/sidebar'
import { Permissions } from 'src/services/permissions'
import { Bookmarks } from 'src/services/bookmarks'
import TextField from '../../components/text-field.vue'
import TextInput from '../../components/text-input.vue'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'
import { Favicons } from 'src/services/favicons'
import { SetupPage } from 'src/services/setup-page'
import { Styles } from 'src/services/styles'
import { Tabs } from 'src/services/tabs.fg'

interface ContainerOption {
  value: string
  icon?: string
  color?: string
  tooltip?: string
  title?: string
}

const URL_RE = /^https?:\/\/.+/
const TABS_PANEL_ICON_OPTS = [{ value: 'icon_tabs', icon: '#icon_tabs' }, ...PANEL_ICON_OPTS]
const BOOKMARKS_PANEL_ICON_OPTS = [
  { value: 'icon_bookmarks', icon: '#icon_bookmarks' },
  ...PANEL_ICON_OPTS,
]
const defaultContainerTooltip = translate('panel.ctr_tooltip_default')
const noneContainerTooltip = translate('panel.ctr_tooltip_none')

const state = reactive({
  customIconUrl: '',
  customIconType: '',
  customIconTextValue: '',
  customIconUrlValue: '',
  customIconOriginal: '',
  customIconColorize: false,
})

let updCustomIconTimeout: number

const rootEl = ref<HTMLElement | null>(null)
const nameInput = ref<TextInputComponent | null>(null)

const props = defineProps<{ conf: PanelConfig; index?: number }>()

const isBookmarks = computed<boolean>(() => Utils.isBookmarksPanel(props.conf))
const isTabs = computed<boolean>(() => Utils.isTabsPanel(props.conf))
const isTabsOrBookmarks = computed<boolean>(() => !isTabs.value && !isBookmarks.value)
const containersOpts = computed<ContainerOption[]>(() => {
  const result: ContainerOption[] = []

  for (let c of Object.values(Containers.reactive.byId)) {
    result.push({ value: c.id, color: c.color, icon: '#' + c.icon, title: c.name, tooltip: c.name })
  }

  result.push({
    value: 'none',
    color: 'inactive',
    icon: '#icon_none',
    title: noneContainerTooltip,
    tooltip: noneContainerTooltip,
  })

  return result
})
const availableForAutoMoveContainersOpts = computed<ContainerOption[]>(() => {
  const result: ContainerOption[] = []
  const used: Record<string, boolean> = {}

  for (const p of Sidebar.reactive.panels) {
    if (!Utils.isTabsPanel(p) || p.id === props.conf.id) continue
    for (const ruleConf of p.moveRules) {
      if (ruleConf.containerId && !ruleConf.url) used[ruleConf.containerId] = true
    }
  }

  if (!used[DEFAULT_CONTAINER_ID]) {
    result.push({
      value: DEFAULT_CONTAINER_ID,
      color: 'toolbar',
      icon: '#icon_ff',
      title: defaultContainerTooltip,
      tooltip: defaultContainerTooltip,
    })
  }

  for (let c of Object.values(Containers.reactive.byId)) {
    if (!used[c.id]) {
      const icon = '#' + c.icon
      result.push({ value: c.id, color: c.color, icon, title: c.name, tooltip: c.name })
    }
  }

  result.push({
    value: 'none',
    color: 'inactive',
    icon: '#icon_none',
    title: noneContainerTooltip,
    tooltip: noneContainerTooltip,
  })

  return result
})
const iconSVG = computed<string>(() => (props.conf.iconSVG ? '#' + props.conf.iconSVG : ''))
const color = computed<string>(() => props.conf.color || '')
const newTabCtx = computed<string>(() => {
  return (Utils.isTabsPanel(props.conf) && props.conf.newTabCtx) || ''
})
const dropTabCtx = computed<string>(() => {
  return (Utils.isTabsPanel(props.conf) && props.conf.dropTabCtx) || ''
})
const rootPath = computed<string>(() => {
  if (!Utils.isBookmarksPanel(props.conf)) return ''
  if (!props.conf.rootId) return '/'
  if (props.conf.rootId === BKM_ROOT_ID) return '/'

  let parent = Bookmarks.reactive.byId[props.conf.rootId]
  if (!parent) return translate('panel.root_id_wrong')

  const path: string[] = []
  while (parent) {
    const titleExec = FOLDER_NAME_DATA_RE.exec(parent.title)
    if (titleExec) path.push(titleExec[1])
    else path.push(parent.title)
    parent = Bookmarks.reactive.byId[parent.parentId]
  }

  return '/' + path.reverse().join('/')
})
const rootDirIsFF = computed<boolean>(() => {
  if (!Utils.isBookmarksPanel(props.conf)) return false
  return (props.conf.rootId as string).endsWith('___')
})

onMounted(() => {
  init()

  if (!Bookmarks.reactive.tree.length) Bookmarks.load()
})

async function init(): Promise<void> {
  await nextTick()
  setCustomIconType()
  if (props.conf.iconIMG) {
    state.customIconUrl = props.conf.iconIMG
    if (props.conf.iconIMGSrc) {
      if (state.customIconType === 'text') state.customIconTextValue = props.conf.iconIMGSrc
      else if (state.customIconType === 'url') state.customIconUrlValue = props.conf.iconIMGSrc
    }
  }
  if (nameInput.value) nameInput.value.recalcTextHeight()
}

function isNotTabsPanel(conf: PanelConfig): conf is BookmarksPanelConfig | HistoryPanelConfig {
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
  if (props.conf.iconIMG) recolorCustomIcon()
  Sidebar.saveSidebar()
}

// ---
// -- Custom icon
// -
function setCustomIconType(type?: string): void {
  if (type === undefined) {
    if (props.conf.iconIMG) {
      const normSrc = props.conf.iconIMGSrc?.trim()
      if (!normSrc) state.customIconType = 'file'
      else if (URL_RE.test(normSrc)) state.customIconType = 'url'
      else state.customIconType = 'text'
    } else {
      state.customIconType = ''
    }
  } else {
    if (state.customIconType === type) state.customIconType = ''
    else state.customIconType = type
  }
}

function onCustomIconTextInput(value: string): void {
  state.customIconTextValue = value
  updCustomIconTimeout = Utils.wait(updCustomIconTimeout, 500, () => {
    const normValue = state.customIconTextValue?.trim()
    if (!normValue) {
      state.customIconUrl = ''
      props.conf.iconIMG = ''
      props.conf.iconIMGSrc = ''
      Sidebar.saveSidebar()
      return
    }

    props.conf.iconIMGSrc = normValue

    drawTextIcon()
  })
}

async function loadCustomIcon(): Promise<void> {
  if (!Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  // TODO: Validation

  const normValue = state.customIconUrlValue?.trim()
  props.conf.iconIMGSrc = normValue

  if (normValue) state.customIconUrl = normValue
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
    props.conf.iconIMG = await prepareCustomIcon(base64)
  } catch {
    return
  }
  state.customIconUrl = props.conf.iconIMG
  Sidebar.saveSidebar()
}

function onCustomIconError(): void {
  state.customIconUrl = props.conf.iconIMG ?? ''
  // TODO: Some visual representation of this error
}

async function drawTextIcon() {
  if (!props.conf.iconIMGSrc) return
  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')
  if (!ctx) return

  let [txt, color, font] = props.conf.iconIMGSrc.split('::')
  let x = 16
  let y = 16
  if (!color) {
    if (Styles.reactive.toolbarColorScheme === 'light') color = '#000000'
    if (Styles.reactive.toolbarColorScheme === 'dark') color = '#ffffff'
  }

  canvas.width = 32
  canvas.height = 32
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  // // Find the max font size to fit canvas
  // let fontSize = 30
  // const maxFontSize = 50
  // let offset: number | null = 0
  // while (fontSize <= maxFontSize) {
  //   fontSize++
  //   font = `${fontSize}px sans-serif`
  //   const offsetProbe = isTextFit(ctx, txt, font, 30, 30)
  //   if (offsetProbe !== null) offset = offsetProbe
  //   else break
  // }

  // Default font
  if (!font) font = '32px sans-serif'

  // Vertically center the icon
  let offset = 0
  const offsetProbe = isTextFit(ctx, txt, font, 30, 30)
  if (offsetProbe !== null) offset = offsetProbe
  y += offset

  ctx.font = font

  ctx.fillText(txt, x, y, 32)

  let base64 = canvas.toDataURL('image/png')

  props.conf.iconIMG = await prepareCustomIcon(base64)
  state.customIconUrl = props.conf.iconIMG
  Sidebar.saveSidebar()
}

function isTextFit(
  ctx: CanvasRenderingContext2D,
  txt: string,
  font: string,
  maxW: number,
  maxH: number
): number | null {
  ctx.font = font
  let metrics
  try {
    metrics = ctx.measureText(txt)
  } catch {
    return null
  }
  const w = metrics.width
  const h = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent

  if (h <= maxH && w <= maxW) {
    return (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2
  } else {
    return null
  }
}

async function prepareCustomIcon(icon: string): Promise<string> {
  state.customIconOriginal = icon
  if (state.customIconColorize) {
    let color = RGB_COLORS[props.conf.color]
    if (props.conf.color === 'toolbar') {
      if (Styles.reactive.toolbarColorScheme === 'light') color = '#000000'
      if (Styles.reactive.toolbarColorScheme === 'dark') color = '#ffffff'
    }
    icon = await Favicons.fillIcon(icon, color)
  }
  return await Favicons.resizeFavicon(icon)
}

function openCustomIconFile(importEvent: Event) {
  const target = importEvent.target as HTMLInputElement
  let file = target.files?.[0]
  if (!file) return onCustomIconRm()

  let reader = new FileReader()
  reader.onload = async fileEvent => {
    if (!fileEvent.target?.result) {
      onCustomIconRm()
      return Logs.err('Cannot import data: No file content')
    }

    let icon
    try {
      icon = await prepareCustomIcon(fileEvent.target.result as string)
    } catch {
      onCustomIconRm()
      return
    }
    props.conf.iconIMG = icon
    props.conf.iconIMGSrc = ''
    state.customIconTextValue = ''
    state.customIconUrlValue = ''
    state.customIconUrl = props.conf.iconIMG
    Sidebar.saveSidebar()
  }
  reader.readAsDataURL(file)
}

function onCustomIconRm() {
  setCustomIconType('')
  state.customIconTextValue = ''
  state.customIconUrlValue = ''
  state.customIconOriginal = ''
  state.customIconUrl = ''
  props.conf.iconIMG = ''
  props.conf.iconIMGSrc = ''
  Sidebar.saveSidebar()
}

function toggleCustomIconColorize() {
  state.customIconColorize = !state.customIconColorize
  recolorCustomIcon()
}

async function recolorCustomIcon() {
  if (state.customIconOriginal) {
    props.conf.iconIMG = await prepareCustomIcon(state.customIconOriginal)
    state.customIconUrl = props.conf.iconIMG
    Sidebar.saveSidebar()
  }
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

async function setBookmarksRootId(): Promise<void> {
  if (!Utils.isBookmarksPanel(props.conf)) return

  if (!Permissions.reactive.bookmarks) {
    const result = await browser.permissions.request({ origins: [], permissions: ['bookmarks'] })
    if (!result) return
  }

  const result = await Bookmarks.openBookmarksPopup({
    title: translate('popup.bookmarks.select_root_folder'),
    controls: [{ label: 'btn.save' }],
    location: BKM_MENU_ID,
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

function selectBookmarksViewMode(value: string): void {
  if (!Utils.isBookmarksPanel(props.conf)) return

  props.conf.viewMode = value
  Sidebar.saveSidebar()
}

function toggleAutoConvert(): void {
  if (!Utils.isBookmarksPanel(props.conf)) return
  props.conf.autoConvert = !props.conf.autoConvert
  Sidebar.saveSidebar()
}

function openRulesPopup() {
  Sidebar.openTabMoveRulesPopup(props.conf.id)
}

function openShortcutsPopup(): void {
  Sidebar.openNewTabShortcutsPopup(props.conf.id)
}

function getManageRulesBtnLabel(panel: TabsPanelConfig): string {
  const label = translate('panel.tab_move_rules_manage_btn')
  if (panel.moveRules.length) return label + ` (${panel.moveRules.length})`
  else return label
}

function getManageShortcutsBtnLabel(panel: TabsPanelConfig): string {
  const label = translate('panel.new_tab_shortcuts_manage_btn')
  if (panel.newTabBtns.length) return label + ` (${panel.newTabBtns.length})`
  else return label
}
</script>
