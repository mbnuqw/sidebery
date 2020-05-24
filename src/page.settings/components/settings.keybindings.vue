<template lang="pug">
section
  h2 {{t('settings.kb_title')}}
  .keybinding(
    v-for="(k, i) in $store.state.keybindings" :key="k.name"
    :is-focused="k.focus"
    :data-disabled="!k.active")
    .label(@click="changeKeybinding(k, i)") {{k.description}}
    .value(@click="changeKeybinding(k, i)") {{normalizeShortcut(k.shortcut)}}
    input(
      type="text"
      ref="keybindingInputs"
      tabindex="-1"
      @blur="onKBBlur(k, i)"
      @keydown.prevent.stop="onKBKey($event, k, i)"
      @keyup.prevent.stop="onKBKeyUp($event, k, i)")
    ToggleInput(
      v-model="k.active"
      @input="toggleKeybinding")
  .ctrls
    .btn(@click="resetKeybindings") {{t('settings.reset_kb')}}
    .btn(@click="toggleKeybindings") {{t('settings.toggle_kb')}}
</template>

<script>
import ToggleInput from '../../components/toggle-input'
import State from '../store/state'
import Actions from '../actions'

const VALID_SHORTCUT = /^((Ctrl|Alt|Command|MacCtrl)\+)((Shift|Alt)\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?((Shift|Alt)\+)?(F\d\d?)$/
const SPEC_KEYS = /^(Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|F\d\d?)$/

export default {
  components: { ToggleInput },

  methods: {
    /**
     * Start changing of keybingding
     */
    changeKeybinding(k, i) {
      if (!k.active) return

      this.$refs.keybindingInputs[i].focus()
      this.lastShortcut = State.keybindings[i]
      State.keybindings.splice(i, 1, { ...k, shortcut: 'Press new shortcut', focus: true })
    },

    /**
     * Normalize (system-wise) shortcut label
     */
    normalizeShortcut(s) {
      if (!s) return '---'
      if (State.os === 'mac') {
        return s.replace('Command', '⌘').replace('MacCtrl', 'Ctrl')
      }
      if (State.os === 'win') return s.replace('Command', 'Win')
      if (State.os === 'linux') return s.replace('Command', 'Super')
      return s
    },

    /**
     * Handle keybinding blur
     */
    onKBBlur(k, i) {
      if (!this.lastShortcut) return

      State.keybindings.splice(i, 1, this.lastShortcut)
      this.lastShortcut = null
    },

    /**
     * Handle keydown on keybinding
     */
    onKBKey(e, k, i) {
      if (e.key === 'Escape') return this.$refs.keybindingInputs[i].blur()

      let shortcut = []
      if (e.ctrlKey) {
        if (State.os === 'mac') shortcut.push('MacCtrl')
        else shortcut.push('Ctrl')
      }
      if (e.altKey) shortcut.push('Alt')
      if (e.shiftKey && shortcut.length <= 1) shortcut.push('Shift')

      if (e.code.indexOf('Digit') === 0) shortcut.push(e.code[e.code.length - 1])
      else if (e.code.indexOf('Key') === 0) shortcut.push(e.code[e.code.length - 1])
      else if (e.code.indexOf('Arrow') === 0) shortcut.push(e.code.slice(5))
      else if (SPEC_KEYS.test(e.code)) shortcut.push(e.code)

      shortcut = shortcut.join('+')

      if (this.checkShortcut(shortcut)) {
        this.lastShortcut = null
        State.keybindings.splice(i, 1, { ...k, shortcut, focus: false })
        Actions.updateKeybinding(k.name, shortcut)
        this.$refs.keybindingInputs[i].blur()
      }
    },

    /**
     * Handle keyup on keybinding
     */
    onKBKeyUp(e, k, i) {
      this.$refs.keybindingInputs[i].blur()
    },

    /**
     * Validate shortcut
     */
    checkShortcut(shortcut) {
      let exists = State.keybindings.find(k => k.shortcut === shortcut)
      return VALID_SHORTCUT.test(shortcut) && !exists
    },

    toggleKeybinding() {
      Actions.saveKeybindings()
    },

    /**
     * Reset all keybindings
     */
    resetKeybindings() {
      Actions.resetKeybindings()
    },

    toggleKeybindings() {
      let test = State.keybindings[1]
      if (!test) return

      let state = test.active
      for (let k of State.keybindings) {
        k.active = !state
      }

      Actions.saveKeybindings()
    },
  },
}
</script>
