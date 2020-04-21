<template lang="pug">
.Settings(@scroll.passive="onScroll")
  general-section(ref="settings_general")
  menu-section(ref="settings_menu")
  navbar-section(ref="settings_nav")
  group-section(ref="settings_group")
  containers-section(ref="settings_containers")
  panels-section(ref="settings_panels")
  dnd-section(ref="settings_dnd")
  tabs-section(ref="settings_tabs")
  new-tab-position-section(ref="settings_new_tab_position")
  pinned-tabs-section(ref="settings_pinned_tabs")
  tabs-tree-section(ref="settings_tabs_tree")
  bookmarks-section(ref="settings_bookmarks")
  appearance-section(ref="settings_appearance")
  mouse-section(ref="settings_mouse")
  keybindings-section(ref="settings_keybindings")
  permissions-section(ref="settings_permissions")
  snapshots-section(ref="settings_snapshots")
  storage-section(ref="settings_storage")
  sync-section(ref="settings_sync")
  help-section(ref="settings_help")

  .details-box(v-if="$store.state.dbgDetails" @wheel="onDbgWheel")
    .box
      .btn(@click="copyDebugDetail") {{t('settings.ctrl_copy')}}
      .btn.-warn(@click="$store.state.dbgDetails = ''") {{t('settings.ctrl_close')}}
    .json {{$store.state.dbgDetails}}

  footer-section
</template>

<script>
import State from './store/state'
import ToggleField from '../components/toggle-field'
import ToggleInput from '../components/toggle-input'
import SelectField from '../components/select-field'
import TextField from '../components/text-field'
import NumField from '../components/num-field'
import CountField from '../components/count-field'

import GeneralSection from './components/settings.general'
import MenuSection from './components/settings.menu'
import NavbarSection from './components/settings.navbar'
import GroupSection from './components/settings.group'
import ContainersSection from './components/settings.containers'
import PanelsSection from './components/settings.panels'
import DndSection from './components/settings.dnd'
import TabsSection from './components/settings.tabs'
import NewTabPositionSection from './components/settings.new-tab-position'
import PinnedTabsSection from './components/settings.pinned-tabs'
import TabsTreeSection from './components/settings.tabs-tree'
import BookmarksSection from './components/settings.bookmarks'
import AppearanceSection from './components/settings.appearance'
import MouseSection from './components/settings.mouse'
import KeybindingsSection from './components/settings.keybindings'
import PermissionsSection from './components/settings.permissions'
import SnapshotsSection from './components/settings.snapshots'
import StorageSection from './components/settings.storage'
import SyncSection from './components/settings.sync'
import HelpSection from './components/settings.help'
import FooterSection from './components/footer'

const SECTIONS = [
  'settings_general',
  'settings_menu',
  'settings_nav',
  'settings_group',
  'settings_containers',
  'settings_panels',
  'settings_dnd',
  'settings_tabs',
  'settings_new_tab_position',
  'settings_pinned_tabs',
  'settings_tabs_tree',
  'settings_bookmarks',
  'settings_appearance',
  'settings_mouse',
  'settings_keybindings',
  'settings_permissions',
  'settings_snapshots',
  'settings_storage',
  'settings_sync',
  'settings_help',
]

export default {
  components: {
    ToggleField,
    ToggleInput,
    SelectField,
    TextField,
    NumField,
    CountField,

    GeneralSection,
    MenuSection,
    NavbarSection,
    GroupSection,
    ContainersSection,
    PanelsSection,
    DndSection,
    TabsSection,
    NewTabPositionSection,
    PinnedTabsSection,
    TabsTreeSection,
    BookmarksSection,
    AppearanceSection,
    MouseSection,
    KeybindingsSection,
    PermissionsSection,
    SnapshotsSection,
    StorageSection,
    SyncSection,
    HelpSection,

    FooterSection,
  },

  data() {
    return { scrollY: 0 }
  },

  computed: {
    activateAfterClosingNextOrPrev() {
      return State.activateAfterClosing === 'next' || State.activateAfterClosing === 'prev'
    },
  },

  mounted() {
    State.settingsRefs = this.$refs
  },

  activated() {
    if (this.scrollY) this.$el.scrollTop = this.scrollY
  },

  methods: {
    /**
     * Handle scroll event
     */
    onScroll(e) {
      this.scrollY = e.target.scrollTop

      if (State.navLock) return

      for (let name, section, i = SECTIONS.length; i--; ) {
        name = SECTIONS[i]
        section = this.$refs[name]
        if (!section) break
        if (section._isVue) section = section.$el

        if (e.target.scrollTop >= section.offsetTop - 8) {
          State.activeSection = name
          break
        }
      }
    },

    /**
     * Block scrolling the main page when debug info showed.
     */
    onDbgWheel(e) {
      let scrollOffset = e.target.parentNode.scrollTop
      let maxScrollOffset = e.target.scrollHeight - e.target.parentNode.offsetHeight
      if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
      if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
    },
  },
}
</script>
