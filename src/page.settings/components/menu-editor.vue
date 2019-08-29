<template lang="pug">
.MenuEditor(v-noise:300.g:12:af.a:0:42.s:0:9="")

  section
    h2 {{t('menu.editor.tabs_title')}}

    .menu-group(v-for="(group, i) in tabsMenu" :data-type="group.type")
      TextInput.group-title(
        v-if="group.type === 'sub'"
        :value="group.name"
        :or="t('menu.editor.inline_group_title')"
        @input="onSubMenuNameInput('tabs', group.i, $event)")
      .opt(v-for="(opt, i) in group.options"
        :data-separator="opt.startsWith('separator')"
        :title="t(tabsOpts[opt])")
        .opt-btn.-in(
          v-if="group.type === 'list'"
          :title="t('menu.editor.create_sub_tooltip')"
          @click="createSubMenu('tabs', opt)")
          svg: use(xlink:href="#icon_expand")
        .opt-title {{t(tabsOpts[opt])}}
        .opt-btn(
          :title="t('menu.editor.down_tooltip')"
          @click="downOpt('tabs', opt)"): svg: use(xlink:href="#icon_expand")
        .opt-btn.-up(
          :title="t('menu.editor.up_tooltip')"
          @click="upOpt('tabs', opt)"): svg: use(xlink:href="#icon_expand")
        .opt-btn.-rm(
          :title="t('menu.editor.disable_tooltip')"
          @click="disableOpt('tabs', opt)"): svg: use(xlink:href="#icon_remove")

    .menu-group.-dis(v-if="disabledTabsMenu.length")
      .opt(
        v-for="opt in disabledTabsMenu"
        :title="t(tabsOpts[opt])"
        @click="restoreOption('tabs', opt)")
        .opt-title {{t(tabsOpts[opt])}}

    .ctrls
      .btn(@click="resetTabsMenu") {{t('menu.editor.reset')}}
      .btn(@click="createSeparator('tabs')") {{t('menu.editor.create_separator')}}


  section
    h2 {{t('menu.editor.bookmarks_title')}}

    .menu-group(v-for="(group, i) in bookmarksMenu" :data-type="group.type")
      TextInput.group-title(
        v-if="group.type === 'sub'"
        :value="group.name"
        :or="t('menu.editor.inline_group_title')"
        @input="onSubMenuNameInput('bookmarks', group.i, $event)")
      .opt(v-for="(opt, i) in group.options" :data-separator="opt.startsWith('separator')" :title="t(bookmarksOpts[opt])")
        .opt-btn.-in(
          v-if="group.type === 'list'"
          @click="createSubMenu('bookmarks', opt)")
          svg: use(xlink:href="#icon_expand")
        .opt-title {{t(bookmarksOpts[opt])}}
        .opt-btn(@click="downOpt('bookmarks', opt)"): svg: use(xlink:href="#icon_expand")
        .opt-btn.-up(@click="upOpt('bookmarks', opt)"): svg: use(xlink:href="#icon_expand")
        .opt-btn.-rm(@click="disableOpt('bookmarks', opt)"): svg: use(xlink:href="#icon_remove")

    .menu-group.-dis(v-if="disabledBookmarksMenu.length")
      .opt(
        v-for="opt in disabledBookmarksMenu"
        :title="t(bookmarksOpts[opt])"
        @click="restoreOption('bookmarks', opt)")
        .opt-title {{t(bookmarksOpts[opt])}}

    .ctrls
      .btn(@click="resetBookmarksMenu") {{t('menu.editor.reset')}}
      .btn(@click="createSeparator('bookmarks')") {{t('menu.editor.create_separator')}}
  
  FooterSection
</template>


<script>
import State from '../store/state'
import Actions from '../actions'
import { DEFAULT_TABS_MENU, DEFAULT_BOOKMARKS_MENU } from '../../defaults'
import TextInput from '../../components/text-input'
import FooterSection from './footer'

const TABS_MENU_OPTS = {
  'undoRmTab': 'menu.tab.undo',
  'pin': 'menu.tab.pin',
  'reload': 'menu.tab.reload',
  'bookmark': 'menu.tab.bookmark',
  'moveToNewWin': 'menu.tab.move_to_new_window',
  'moveToNewPrivWin': 'menu.tab.move_to_new_priv_window',
  'moveToAnotherWin': 'menu.tab.move_to_another_window',
  'moveToWin': 'menu.tab.move_to_window_',
  'moveToCtr': 'menu.tab.reopen_in_ctr_',
  'mute': 'menu.tab.mute',
  'discard': 'menu.tab.discard',
  'group': 'menu.tab.group',
  'flatten': 'menu.tab.flatten',
  'clearCookies': 'menu.tab.clear_cookies',
  'close': 'menu.tab.close',
}

const BOOKMARKS_MENU_OPTS = {
  'openInNewWin': 'menu.bookmark.open_in_new_window',
  'openInNewPrivWin': 'menu.bookmark.open_in_new_priv_window',
  'openInCtr': 'menu.bookmark.open_in_ctr_',
  'createBookmark': 'menu.bookmark.create_bookmark',
  'createFolder': 'menu.bookmark.create_folder',
  'createSeparator': 'menu.bookmark.create_separator',
  'edit': 'menu.bookmark.edit_bookmark',
  'delete': 'menu.bookmark.delete_bookmark',
}

export default {
  components: {
    TextInput,
    FooterSection,
  },

  data() {
    return {
      active: false,
      tabsOpts: TABS_MENU_OPTS,
      bookmarksOpts: BOOKMARKS_MENU_OPTS,
    }
  },

  computed: {
    tabsMenu() {
      let out = []
      let group = {}
      for (let i = 0; i < State.tabsMenu.length; i++) {
        let item = State.tabsMenu[i]
        if (typeof item === 'string') {
          if (group.type !== 'list') {
            group = { type: 'list', name: '', options: [], i }
            out.push(group)
          }
          group.options.push(item)
        }
        if (item instanceof Array) {
          if (group.type !== 'sub') {
            group = { type: 'sub', name: '', i }
            if (item[0] instanceof Object) {
              group.name = item[0].name
              group.options = item.slice(1)
            } else {
              group.options = item
            }
            out.push(group)
            group = {}
          }
        }
      }
      return out
    },

    disabledTabsMenu() {
      const all = Object.keys(TABS_MENU_OPTS)
      const active = State.tabsMenu.reduce((a, v) => a.concat(v), [])
      return all.filter(option => !active.includes(option))
    },

    bookmarksMenu() {
      let out = []
      let group = {}
      for (let i = 0; i < State.bookmarksMenu.length; i++) {
        let item = State.bookmarksMenu[i]
        if (typeof item === 'string') {
          if (group.type !== 'list') {
            group = { type: 'list', name: '', options: [], i }
            out.push(group)
          }
          group.options.push(item)
        }
        if (item instanceof Array) {
          if (group.type !== 'sub') {
            group = { type: 'sub', name: '', i }
            if (item[0] instanceof Object) {
              group.name = item[0].name
              group.options = item.slice(1)
            } else {
              group.options = item
            }
            out.push(group)
            group = {}
          }
        }
      }
      return out
    },

    disabledBookmarksMenu() {
      const all = Object.keys(BOOKMARKS_MENU_OPTS)
      const active = State.bookmarksMenu.reduce((a, v) => a.concat(v), [])
      return all.filter(option => !active.includes(option))
    },
  },

  methods: {
    /**
     * Reset tabs menu
     */
    resetTabsMenu() {
      State.tabsMenu = JSON.parse(JSON.stringify(DEFAULT_TABS_MENU))
      Actions.saveCtxMenu()
    },

    /**
     * Reset bookmarks menu
     */
    resetBookmarksMenu() {
      State.bookmarksMenu = JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS_MENU))
      Actions.saveCtxMenu()
    },

    /**
     * Restore option
     */
    restoreOption(type, opt) {
      let menu = State[type + 'Menu']
      if (!menu) return

      menu.push(opt)
      Actions.saveCtxMenu()
    },

    /**
     * Disable option
     */
    disableOpt(type, opt) {
      let menu = State[type + 'Menu']
      if (!menu) return

      for (let i = 0; i < menu.length; i++) {

        if (menu[i] === opt) {
          menu.splice(i, 1)
          break
        }

        if (menu[i] instanceof Array) {
          let index = menu[i].indexOf(opt)
          if (index === -1) continue

          menu[i].splice(index, 1)
          break
        }
      }

      this.normalizeMenu(menu)

      Actions.saveCtxMenu()
    },

    /**
     * Create sub-menu
     */
    createSubMenu(type, opt) {
      let menu = State[type + 'Menu']
      if (!menu) return

      for (let i = 0; i < menu.length; i++) {

        if (menu[i] === opt) {
          menu.splice(i, 1, [opt])
          break
        }
      }

      Actions.saveCtxMenu()
    },

    /**
     * Handle input of menu name
     */
    onSubMenuNameInput(type, i, value) {
      let menu = State[type + 'Menu']
      if (!menu) return

      let targetMenu = menu[i]
      if (!targetMenu) return

      if (typeof targetMenu[0] !== 'object') {
        targetMenu.unshift({ name: value })
      } else {
        targetMenu[0].name = value
      }

      if (this.menuNameTimeout) clearTimeout(this.menuNameTimeout)
      this.menuNameTimeout = setTimeout(() => {
        this.menuNameTimeout = undefined
        Actions.saveCtxMenu()
      }, 500)
    },

    /**
     * Move option down
     */
    downOpt(type, opt) {
      let menu = State[type + 'Menu']
      if (!menu) return

      for (let i = 0; i < menu.length; i++) {

        if (menu[i] === opt) {
          menu.splice(i, 1)
          if (!menu[i]) break
          if (typeof menu[i] === 'string') menu.splice(i + 1, 0, opt)
          else if (typeof menu[i][0] === 'string') menu[i].unshift(opt)
          else if (typeof menu[i][0] === 'object') menu[i].splice(1, 0, opt)
          break
        }

        if (menu[i] instanceof Array) {
          let index = menu[i].indexOf(opt)
          if (index === -1) continue

          menu[i].splice(index, 1)
          if (!menu[i][index]) menu.splice(i + 1, 0, opt)
          else menu[i].splice(index + 1, 0, opt)
          break
        }
      }

      this.normalizeMenu(menu)

      Actions.saveCtxMenu()
    },

    /**
     * Move option up
     */
    upOpt(type, opt) {
      let menu = State[type + 'Menu']
      if (!menu) return

      for (let i = 0; i < menu.length; i++) {

        if (menu[i] === opt) {
          menu.splice(i, 1)
          if (!menu[i-1]) break
          if (typeof menu[i-1] === 'string') menu.splice(i-1, 0, opt)
          else menu[i-1].push(opt)
          break
        }

        if (menu[i] instanceof Array) {
          let index = menu[i].indexOf(opt)
          if (index === -1) continue

          menu[i].splice(index, 1)
          if (!menu[i][index-1] || typeof menu[i][index-1] === 'object') {
            menu.splice(i, 0, opt)
          } else {
            menu[i].splice(index-1, 0, opt)
          }
          break
        }
      }

      this.normalizeMenu(menu)

      Actions.saveCtxMenu()
    },

    /**
     * Normalize menu
     */
    normalizeMenu(menu) {
      for (let i = 0; i < menu.length; i++) {
        if (menu[i] instanceof Array) {
          if (!menu[i].length) {
            menu.splice(i, 1)
            i--
            continue
          }
          if (typeof menu[i][0] === 'object' && menu[i].length === 1) {
            menu.splice(i, 1)
            i--
            continue
          }
        }
      }
    },

    /**
     * Create separator
     */
    createSeparator(type) {
      let menu = State[type + 'Menu']
      if (!menu) return

      menu.push(String(Math.random()).replace('0.', 'separator-'))
    },
  },
}
</script>
