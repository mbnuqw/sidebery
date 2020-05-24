<template lang="pug">
section
  h2 {{t('settings.kb_title')}}
  .keybinding(
    v-for="(k, i) in $store.state.keybindings" :key="k.name"
    :is-focused="k.focus"
    :data-error="!!k.error"
    :data-disabled="!k.active")
    .label(@click="changeKeybinding(k, i)") {{k.description}}
    .value(v-if="k.focus") {{inputLabel}}
    .value(v-else-if="k.error") {{t('settings.kb_err_' + k.error)}}
    .value(v-else @click="changeKeybinding(k, i)") {{normalizeShortcut(k.shortcut)}}
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
import { translate } from '../../../addon/locales/dict'
import ToggleInput from '../../components/toggle-input'
import State from '../store/state'
import Actions from '../actions'

const VALID_SHORTCUT = /^((Ctrl|Alt|Command|MacCtrl)\+)((Shift|Alt)\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?((Shift|Alt)\+)?(F\d\d?)$/
const SPEC_KEYS = /^(Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|F\d\d?)$/

export default {
  components: { ToggleInput },

  data() {
    return {
      newShortcut: '',
      errMsg: '',
    }
  },

  computed: {
    inputLabel() {
      if (this.newShortcut) return this.newShortcut
      else return translate('settings.kb_input')
    },
  },

  methods: {
    /**
     * Start changing of keybingding
     */
    changeKeybinding(k, i) {
      if (!k.active) return
      this.newShortcut = ''
      this.errMsg = ''

      this.$refs.keybindingInputs[i].focus()
      this.lastShortcut = State.keybindings[i]
      State.keybindings.splice(i, 1, { ...k, focus: true, error: '' })

      if (this.errTimeout) clearTimeout(this.errTimeout)
    },

    /**
     * Normalize (system-wise) shortcut label
     */
    normalizeShortcut(s) {
      if (!s) return '---'
      if (State.os === 'mac') return s.replace('Command', '⌘').replace('MacCtrl', 'Ctrl')
      if (State.os === 'win') return s.replace('Command', 'Win')
      if (State.os === 'linux') return s.replace('Command', 'Super')
      return s
    },

    /**
     * Handle keybinding blur
     */
    onKBBlur(k, i) {
      if (!k.focus) return
      State.keybindings.splice(i, 1, { ...k, focus: false })

      if (this.errMsg) {
        State.keybindings.splice(i, 1, { ...k, focus: false, error: this.errMsg })
        if (this.errTimeout) clearTimeout(this.errTimeout)
        this.errTimeout = setTimeout(() => {
          k = State.keybindings[i]
          State.keybindings.splice(i, 1, { ...k, error: '' })
          this.errMsg = ''
        }, 2000)
      }
    },

    /**
     * Handle keydown on keybinding
     */
    onKBKey(e, k, i) {
      if (e.key === 'Escape') return this.$refs.keybindingInputs[i].blur()
      if (e.key === 'Delete' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        State.keybindings.splice(i, 1, { ...k, shortcut: '', focus: false })
        Actions.updateKeybinding(k.name, '')
        this.$nextTick(() => this.$refs.keybindingInputs[i].blur())
        return
      }

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
      this.newShortcut = shortcut

      if (this.checkShortcut(shortcut)) {
        State.keybindings.splice(i, 1, { ...k, shortcut, focus: false })
        Actions.updateKeybinding(k.name, shortcut)
        this.$nextTick(() => this.$refs.keybindingInputs[i].blur())
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
      let duplicate = State.keybindings.find(k => k.shortcut === shortcut)
      let valid = VALID_SHORTCUT.test(shortcut)
      if (duplicate) this.errMsg = 'duplicate'
      if (!valid) this.errMsg = 'invalid'
      return valid && !duplicate
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
