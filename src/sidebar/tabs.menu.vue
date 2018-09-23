<template lang="pug">
.Menu(v-noise:300.g:12:af.a:0:42.s:0:9="")
  text-input.title(
    ref="name"
    v-debounce.250="updateName"
    v-model="name"
    :or="t('tabs_menu.name_placeholder')"
    @input="onInput"
    @keydown.enter.prevent="onEnter")

  .field
    .label {{t('tabs_menu.icon_label')}}
    .input
      .icon(v-for="(o, i) in iconOpts", :data-on="i === icon", @click="updateIcon(i)")
        svg(:style="{fill: colorCode}")
          use(:xlink:href="'#' + o")

  .field
    .label {{t('tabs_menu.color_label')}}
    .input
      .icon(v-for="(o, i) in colorOpts", :data-on="i === color", @click="updateColor(i)")
        svg(:style="{fill: o.colorCode}")
          use(xlink:href="#circle")

  .field(v-if="id", :opt-true="syncON", @click="toggleSync")
    .label {{t('tabs_menu.sync_label')}}
    .input
      .opt.-true {{t('settings.opt_true')}}
      .opt.-false {{t('settings.opt_false')}}

  .options
    .opt(v-if="haveTabs", @click="closeAllTabs") {{t('tabs_menu.close_all_tabs')}}
    .opt.-warn(v-if="id", @click="remove") {{t('tabs_menu.delete_container')}}
</template>


<script>
import TextInput from './input.text'

export default {
  name: 'TabsMenu',

  components: {
    TextInput,
  },

  props: {
    conf: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      id: '',
      name: '',
      iconOpts: [
        'fingerprint',
        'briefcase',
        'dollar',
        'cart',
        'circle',
        'gift',
        'vacation',
        'food',
        'fruit',
        'pet',
        'tree',
        'chill',
      ],
      icon: 0,
      colorOpts: [
        { color: 'blue', colorCode: '#37adff' },
        { color: 'turquoise', colorCode: '#00c79a' },
        { color: 'green', colorCode: '#51cd00' },
        { color: 'yellow', colorCode: '#ffcb00' },
        { color: 'orange', colorCode: '#ff9f00' },
        { color: 'red', colorCode: '#ff613d' },
        { color: 'pink', colorCode: '#ff4bda' },
        { color: 'purple', colorCode: '#af51f5' },
      ],
      color: 0,
    }
  },

  computed: {
    colorCode() {
      return this.colorOpts[this.color].colorCode
    },

    haveTabs() {
      if (!this.conf.tabs || !this.id) return false
      return this.conf.tabs.length > 0
    },

    syncON() {
      return !!this.$root.syncPanels.find(p => p === this.id)
    },
  },

  created() {
    this.init()
  },

  methods: {
    onEnter() {
      this.$emit('close')
    },

    onInput() {
      this.$emit('height')
    },

    open() {
      this.init()
      this.$emit('height')
      if (this.$refs.name) this.$refs.name.focus()
    },

    async update() {
      if (!this.name || !this.id) return
      await browser.contextualIdentities.update(this.id, {
        name: this.name,
        icon: this.iconOpts[this.icon],
        color: this.colorOpts[this.color].color,
      })
    },

    async updateName() {
      // Create new container
      if (this.name && !this.id) {
        let ctx = await this.createNew()
        this.id = ctx.cookieStoreId
        this.$emit('height')
        return
      }

      // Or update
      await this.update()

      // Check if we have some updates
      // for container with this name
      this.$root.resyncPanels()
    },

    async updateIcon(i) {
      this.icon = i
      this.update()
    },

    async updateColor(i) {
      this.color = i
      this.update()
    },

    async createNew() {
      const details = {
        name: this.name,
        color: this.colorOpts[this.color].color,
        icon: this.iconOpts[this.icon],
      }
      return await browser.contextualIdentities.create(details)
    },

    closeAllTabs() {
      if (!this.conf.tabs || this.conf.tabs.length === 0) return
      browser.tabs.remove(this.conf.tabs.map(t => t.id))
      this.$emit('close')
    },

    async remove() {
      if (!this.id) return
      browser.contextualIdentities.remove(this.id)
      this.$emit('close')
    },

    init() {
      // Edit existing tabs container
      if (this.conf.cookieStoreId) {
        this.id = this.conf.cookieStoreId
        this.name = this.conf.name
        this.color = this.colorOpts.findIndex(c => c.color === this.conf.color)
        this.icon = this.iconOpts.indexOf(this.conf.icon)
        return
      }

      // Create new tabs container
      if (!this.conf.cookieStoreId && this.conf.new) {
        this.id = ''
        this.name = ''
        this.icon = 0
        this.color = 0
        return
      }
    },

    toggleSync() {
      let pi = this.$root.syncPanels.findIndex(p => p === this.id)
      if (pi !== -1) this.$root.syncPanels.splice(pi, 1)
      else this.$root.syncPanels.push(this.id)
      this.$root.resyncPanels()
      this.$root.saveState()
    },
  },
}
</script>


<style lang="stylus">
@import '../styles/mixins'

.Menu > .title
  text(s: rem(18))
  color: var(--c-title-fg)
  margin: 16px 12px 12px

.Menu .field
  box(relative)
  margin: 0 16px 8px
  cursor: pointer
  &[opt-true]
    .opt
      color: var(--settings-opt-active-fg)
    .opt.-true
      color: var(--settings-opt-true-fg)
    .opt.-false
      color: var(--settings-opt-inactive-fg)

.Menu .field > .label
  box(relative)
  text(s: rem(14))
  color: var(--c-label-fg)
  transition: color var(--d-fast)

.Menu .field > .input
  box(relative, flex)
  flex-wrap: wrap

.Menu .opt
  box(relative)
  text(s: rem(14))
  margin: 0
  color: var(--settings-opt-inactive-fg)
  transition: color var(--d-fast)
  &.-false
    color: var(--settings-opt-false-fg)
  &[opt-true]
    color: var(--settings-opt-active-fg)
    &[opt-none]
      color: var(--settings-opt-false-fg)

// Option icon
.Menu .input > .icon
  box(relative, flex)
  size(28px, same)
  justify-content: center
  align-items: center
  margin: 0 2px 0
  opacity: .5
  border-radius: 3px
  filter: grayscale(0.5)
  &:hover
    opacity: .7
  &[data-on]
    opacity: 1
    filter: grayscale(0)
  
  > svg
    box(absolute)
    size(16px, same)
    fill: var(--c-act-fg)
    transition: opacity var(--d-fast)
</style>
