<template lang="pug">
.StylesEditor
  .columns
    .vars
      section(
        v-for="group of state.groups"
        :key="group.id"
        :data-hidden="!group.vars?.length")
        h2 {{group.label}}
        StyleField(
          v-for="cssVar of group.vars"
          :key="cssVar.key"
          v-model:value="cssVar.value"
          :active="cssVar.active"
          :label="cssVar.label"
          :name="cssVar.name"
          :isColor="cssVar.isColor"
          :or="'---'"
          @update:value="setCSSVarDebounced(cssVar)"
          @change="setCSSVar(cssVar)"
          @toggle="toggleCSSVar(cssVar)")

    .css(ref="customCssEl"): .wrapper
      nav
        .nav-item(
          :data-active="state.cssTarget === 'sidebar'"
          @click="selectCssTarget('sidebar')") {{translate('styles.css_sidebar')}}
        .nav-item(
          :data-active="state.cssTarget === 'group'"
          @click="selectCssTarget('group')") {{translate('styles.css_group')}}
      .editor-box
        textarea.editor(
          ref="cssEditorEl"
          v-model="state.customCSS"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          @input.passive="onInput"
          @keydown.tab.prevent
          @change="applyCssDebounced()")
        .placeholder(:data-hidden="!!state.customCSS") {{translate('styles.css_placeholder')}}
        .placeholder-note(:data-hidden="!!state.customCSS") {{translate('styles.css_selectors_instruction')}}

  .bottom-bar
    .btn(@click="resetCSSVars") {{translate('styles.reset_styles')}}
    a.btn(@click="SetupPage.copyDevtoolsUrl()") {{translate('settings.copy_devtools_url')}}
    .color-sample(:style="getColorSampleStyle()")
      input.color(
        type="color"
        :value="state.colorSampleValue"
        @input="onColorSampelInput")
      .value {{state.colorSampleValue}}
      .example
  
  .shit
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { translate } from 'src/dict'
import { CustomCssTarget } from 'src/types'
import { Styles } from 'src/services/styles'
import { Permissions } from 'src/services/permissions'
import StyleField from '../../components/style-field.vue'
import { SETTINGS_OPTIONS } from 'src/defaults'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'

interface CssVar {
  active: boolean
  key: string
  value: string
  re: RegExp
  isColor: boolean
  label: string
  name: string
}

interface CssVarsGroup {
  id: string
  label: string
  vars: CssVar[]
  notIn?: CustomCssTarget
}

const FIRST_LETTER_RE = /^\w/
const DASH_RE = /-/g

const customCssEl = ref<HTMLElement | null>(null)
const cssEditorEl = ref<HTMLTextAreaElement | null>(null)
const state = reactive({
  active: false,
  vars: [] as CssVar[],
  customCSS: '',
  cssTarget: 'sidebar' as CustomCssTarget,
  colorSampleValue: '#000000',
  groups: [
    { id: '--frame-', label: 'Frame', vars: [] },
    { id: '--toolbar-', label: 'Toolbar', vars: [] },
    { id: '--popup-', label: 'Popup', vars: [] },
    { id: '--status-', label: 'Accent colors', vars: [] },
    { id: '--nav-', label: translate('styles.vars_group.nav'), vars: [] },
    { id: '--tabs-', label: translate('styles.vars_group.tabs'), vars: [] },
    { id: '--bookmarks-', label: translate('styles.vars_group.bookmarks'), vars: [] },
    { id: '--ctx-menu-', label: translate('styles.vars_group.menu'), vars: [] },
    { id: '--btn-', label: translate('styles.vars_group.buttons'), vars: [] },
    { id: '--scroll-', label: translate('styles.vars_group.scroll'), vars: [] },
    { id: '--pinned-dock-', label: translate('styles.vars_group.pinned_dock'), vars: [] },
    { id: '--d-', label: translate('styles.vars_group.animation'), vars: [] },
    { id: 'common', label: translate('styles.vars_group.other'), vars: [] },
  ] as CssVarsGroup[],
})

void (async function init(): Promise<void> {
  state.customCSS = await Styles.getCustomCSS(state.cssTarget)
  updateVars()
})()

onMounted(async () => {
  await loadVars()
  updateVars()
  recalcGroups(state.vars)
})

function getColorSampleStyle(): Record<string, string> {
  return { '--color': state.colorSampleValue }
}

function updateVars(): void {
  for (const v of state.vars) {
    const reResult = v.re.exec(state.customCSS)
    v.active = !!reResult
    if (reResult) v.value = reResult[1]
  }
}
let updateVarsTimeout: number | undefined
function updateVarsDebounced(): void {
  clearTimeout(updateVarsTimeout)
  updateVarsTimeout = setTimeout(() => updateVars(), 500)
}

function recalcGroups(vars: CssVar[]): void {
  const commonGroup = state.groups[state.groups.length - 1]

  for (const g of state.groups) {
    g.vars = []
  }

  for (const v of vars) {
    if (v.key.startsWith('--ff')) continue
    const group = state.groups.find(g => v.key.startsWith(g.id))
    if (group) {
      let key = v.key
      key = key.replace(group.id, '')
      key = key.replace(DASH_RE, ' ')
      v.label = key.replace(FIRST_LETTER_RE, c => c.toUpperCase())
      group.vars.push(v)
    } else {
      let key = v.key
      key = key.slice(2)
      key = key.replace(DASH_RE, ' ')
      v.label = key.replace(FIRST_LETTER_RE, c => c.toUpperCase())
      commonGroup.vars.push(v)
    }
  }
}

async function getRootStyles(
  target: 'sidebar' | 'group',
  theme: typeof SETTINGS_OPTIONS.theme[number],
  colorScheme: 'dark' | 'light'
): Promise<CSSStyleDeclaration | undefined> {
  if (theme === 'none') return

  let shadowContainerEl = document.getElementById('shadows_container')
  if (shadowContainerEl) shadowContainerEl.remove()

  shadowContainerEl = document.createElement('div')
  shadowContainerEl.setAttribute('id', 'shadows_container')
  document.body.appendChild(shadowContainerEl)

  return new Promise(res => {
    if (!shadowContainerEl) return

    const shadow = shadowContainerEl.attachShadow({ mode: 'open' })
    const shadowedRootEl = document.createElement('div')
    shadowedRootEl.setAttribute('id', 'root')
    shadowedRootEl.setAttribute('data-color-scheme', colorScheme)
    shadowedRootEl.setAttribute('data-animations', Settings.reactive.animationSpeed || 'fast')
    shadow.appendChild(shadowedRootEl)

    const shadowLinkEl = document.createElement('link')
    shadowLinkEl.onload = () => res(getComputedStyle(shadowedRootEl))
    shadowLinkEl.onerror = () => res(undefined)
    shadowLinkEl.setAttribute('rel', 'stylesheet')
    shadowLinkEl.setAttribute('href', `../themes/${theme}/${target}.css`)
    shadow.appendChild(shadowLinkEl)
  })
}

async function loadVars(): Promise<void> {
  const compStyle = await getRootStyles(
    state.cssTarget,
    Settings.reactive.theme,
    Styles.reactive.colorScheme
  )
  if (!compStyle) return

  const props: CssVar[] = []
  for (const prop of compStyle) {
    if (!prop.startsWith('--')) continue
    if (prop === '--color') continue
    if (prop.startsWith('--settings-')) continue
    if (prop.startsWith('--ff-')) continue
    const value = compStyle.getPropertyValue(prop).trim()
    const isColor = isValueColor(value)
    let name = prop
    const re = new RegExp(`#root\\.root \\{${prop}: (.+?);\\}`)
    props.push({ active: false, key: prop, value, re, isColor, label: prop, name })
  }

  props.sort((a, b) => (a.key > b.key ? 1 : -1))
  state.vars = props
}

function isValueColor(value: string): boolean {
  return (
    value.startsWith('#') ||
    value.startsWith('rgb') ||
    value.startsWith('hsl') ||
    value === 'transparent' ||
    value === 'white' ||
    value === 'black'
  )
}

function toggleCSSVar(cssVar: CssVar): void {
  cssVar.active = !cssVar.active

  const re = new RegExp(`#root\\.root \\{${cssVar.key}: (.*?);\\}`)

  if (cssVar.active) {
    const css = `#root.root {${cssVar.key}: ${cssVar.value};}`
    if (re.test(state.customCSS)) state.customCSS = state.customCSS.replace(re, css)
    else state.customCSS = css + '\n' + state.customCSS
  } else {
    state.customCSS = state.customCSS.replace(re, '')
    state.customCSS = state.customCSS.trim()
    const rootEl = document.getElementById('root')
    if (rootEl && !cssVar.value) {
      const compStyle = getComputedStyle(rootEl)
      const value = compStyle.getPropertyValue(cssVar.key)
      if (value) cssVar.value = value
    }
  }

  applyCssDebounced(0)
}

function setCSSVar(cssVar: CssVar): void {
  cssVar.active = true

  const re = new RegExp(`#root\\.root \\{${cssVar.key}: (.*?);\\}`)
  const css = `#root.root {${cssVar.key}: ${cssVar.value};}`

  if (re.test(state.customCSS)) state.customCSS = state.customCSS.replace(re, css)
  else state.customCSS = css + '\n' + state.customCSS

  applyCssDebounced(0)
}
let setCSSVarTimeout: number | undefined
function setCSSVarDebounced(cssVar: CssVar): void {
  clearTimeout(setCSSVarTimeout)
  setCSSVarTimeout = setTimeout(() => setCSSVar(cssVar), 500)
}

function resetCSSVars(): void {
  const rootEl = document.getElementById('root')
  const compStyle = rootEl ? getComputedStyle(rootEl) : null

  for (const v of state.vars) {
    if (v.active) toggleCSSVar(v)
    if (compStyle) {
      const value = compStyle.getPropertyValue(v.key)
      if (value) v.value = value
    }
  }
}

async function selectCssTarget(target: CustomCssTarget): Promise<void> {
  state.cssTarget = target
  state.customCSS = await Styles.getCustomCSS(target)
  await loadVars()
  updateVars()
  recalcGroups(state.vars)
}

/**
 * Handle input
 */
function onInput(e: Event): void {
  applyCssDebounced(1000)
  updateVarsDebounced()
}

let applyTimeout: number | undefined
function applyCssDebounced(delay = 1000): void {
  clearTimeout(applyTimeout)
  applyTimeout = setTimeout(() => Styles.setCustomCSS(state.cssTarget, state.customCSS), delay)
}

function onColorSampelInput(e: Event): void {
  const target = e.target as HTMLInputElement
  state.colorSampleValue = target.value
  copyColorSampleDebounced()
}
let copyColorSampleTimeout: number | undefined
function copyColorSampleDebounced(): void {
  clearTimeout(copyColorSampleTimeout)
  copyColorSampleTimeout = setTimeout(() => {
    if (Permissions.reactive.clipboardWrite) navigator.clipboard.writeText(state.colorSampleValue)
  })
}
</script>