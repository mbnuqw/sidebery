<template lang="pug">
section(ref="el")
  h2 {{translate('settings.kb_title')}}
  .keybinding(
    v-for="(keybinding, i) in Keybindings.reactive.list" :key="keybinding.name"
    :is-focused="keybinding.focus"
    :data-error="!!keybinding.error")
    .label(@click="changeKeybinding(keybinding, i)") {{keybinding.description}}
    .value(v-if="keybinding.focus") {{inputLabel}}
    .value(v-else-if="keybinding.error") {{translate('settings.kb_err_' + keybinding.error)}}
    .value(v-else @click="changeKeybinding(keybinding, i)") {{normalizeShortcut(keybinding.shortcut)}}
    input(
      type="text"
      tabindex="-1"
      :ref="setInput"
      @blur="onKBBlur(keybinding, i)"
      @keydown.prevent.stop="onKBKey($event, keybinding, i)"
      @keyup.prevent.stop="onKBKeyUp($event, keybinding, i)")
    .icon-btn(
      :data-enabled="!!keybinding.shortcut"
      @click="removeKeybinding(i, keybinding.shortcut)"): svg: use(xlink:href="#icon_remove")
  .ctrls
    .btn(@click="Keybindings.resetKeybindings") {{translate('settings.reset_kb')}}
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick, Component } from 'vue'
import { translate } from 'src/dict'
import { Command } from 'src/types'
import { Keybindings } from 'src/services/keybindings'
import { Info } from 'src/services/info'
import { SetupPage } from 'src/services/setup-page'

const SPEC_KEYS = /^(Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|F\d\d?)$/
const ERR_SHOW_TIMEOUT = 2000

const el = ref<HTMLElement | null>(null)
const keybindingInputs = ref<HTMLInputElement[]>([])
const state = reactive({ newShortcut: '' })

let errTimeout: number
let errMsg = ''

const inputLabel = computed((): string => state.newShortcut || translate('settings.kb_input'))

onMounted(() => SetupPage.registerEl('settings_keybindings', el.value))

function setInput(ref: Element | Component | null): void {
  if (!ref) return
  const el = ref as HTMLInputElement
  keybindingInputs.value.push(el)
}

function changeKeybinding(k: Command, i: number): void {
  state.newShortcut = ''
  errMsg = ''

  keybindingInputs.value[i].focus()
  Keybindings.update(i, { focus: true, error: '' })

  if (errTimeout) {
    clearTimeout(errTimeout)
    Keybindings.resetErrors()
  }
}

function normalizeShortcut(s?: string): string {
  if (!s) return '---'
  if (Info.reactive.os === 'mac') return s.replace('Command', '⌘').replace('MacCtrl', 'Ctrl')
  if (Info.reactive.os === 'win') return s.replace('Command', 'Win')
  if (Info.reactive.os === 'linux') return s.replace('Command', 'Super')
  return s
}

function onKBBlur(k: Command, i: number): void {
  if (!k.focus) return
  Keybindings.update(i, { focus: false })

  if (errMsg) {
    Keybindings.update(i, { focus: false, error: errMsg })
    if (errTimeout) clearTimeout(errTimeout)
    errTimeout = setTimeout(() => {
      Keybindings.update(i, { error: '' })
      errMsg = ''
    }, ERR_SHOW_TIMEOUT)
  }
}

function onKBKey(e: KeyboardEvent, cmd: Command, i: number): void {
  if (e.key === 'Escape') return keybindingInputs.value[i].blur()
  if (e.key === 'Delete' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    Keybindings.update(i, { shortcut: '', focus: false })
    nextTick(() => keybindingInputs.value[i].blur())
    return
  }

  const keys: string[] = []
  if (e.ctrlKey) {
    if (Info.reactive.os === 'mac') keys.push('MacCtrl')
    else keys.push('Ctrl')
  }
  if (e.altKey) keys.push('Alt')
  if (e.shiftKey && keys.length <= 1) keys.push('Shift')

  if (e.code.indexOf('Digit') === 0) keys.push(e.code[e.code.length - 1])
  else if (e.code.indexOf('Key') === 0) keys.push(e.code[e.code.length - 1])
  else if (e.code.indexOf('Arrow') === 0) keys.push(e.code.slice(5))
  else if (SPEC_KEYS.test(e.code)) keys.push(e.code)

  const shortcut = keys.join('+')
  state.newShortcut = shortcut

  const checkResult = Keybindings.checkShortcut(shortcut)
  if (checkResult === 'valid') {
    Keybindings.update(i, { shortcut, focus: false })
    nextTick(() => keybindingInputs.value[i].blur())
  } else {
    errMsg = checkResult
  }
}

function onKBKeyUp(e: Event, k: Command, i: number): void {
  keybindingInputs.value[i].blur()
}

function removeKeybinding(i: number, shortcut?: string): void {
  if (!shortcut) return
  Keybindings.update(i, { shortcut: '', focus: false })
}
</script>
