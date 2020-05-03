<template lang="pug">
section
  h2 {{t('settings.help_title')}}
  ToggleField(
    label="settings.mark_window"
    :value="$store.state.markWindow"
    @input="setOpt('markWindow', $event)")
  .sub-fields
    TextField.-inline(
      label="settings.mark_window_preface"
      or="---"
      :inactive="!$store.state.markWindow"
      :value="$store.state.markWindowPreface"
      @input="setOpt('markWindowPreface', $event)")
  ToggleField(
    label="settings.tabs_check"
    :value="$store.state.tabsCheck"
    @input="setOpt('tabsCheck', $event)")
  .sub-fields
    SelectField(
      label="settings.tabs_fix"
      optLabel="settings.tabs_fix_"
      :note="t('settings.tabs_fix_desc')"
      :inactive="!$store.state.tabsCheck"
      :value="$store.state.tabsFix"
      :opts="$store.state.tabsFixOpts"
      @input="setOpt('tabsFix', $event)")
  .ctrls
    a.btn(@click="$store.state.exportConfig = true") {{t('settings.help_exp_data')}}
    .btn(type="file")
      .label {{t('settings.help_imp_data')}}
      input(type="file" ref="importData" accept="application/json" @input="importData")
  Transition(name="panel-config")
    .panel-config-layer(v-if="$store.state.exportConfig" @click="$store.state.exportConfig = false")
      .panel-config-box(@click.stop="")
        ExportConfig.dashboard(:conf="$store.state.exportConfig")
  Transition(name="panel-config")
    .panel-config-layer(v-if="$store.state.importConfig" @click="$store.state.importConfig = false")
      .panel-config-box(@click.stop="")
        ImportConfig.dashboard(:conf="$store.state.importConfig")
  .ctrls
    .btn(@click="showDbgDetails") {{t('settings.debug_info')}}
    a.btn(
      tabindex="-1"
      href="https://github.com/mbnuqw/sidebery/issues/new?template=Bug_report.md") {{t('settings.repo_bug')}}
    a.btn(
      tabindex="-1"
      href="https://github.com/mbnuqw/sidebery/issues/new?template=Feature_request.md") {{t('settings.repo_feature')}}
  .ctrls
    .btn.-warn(@click="reloadAddon") {{t('settings.reload_addon')}}
    .btn.-warn(@click="resetSettings") {{t('settings.reset_settings')}}

  .ctrls
    .info(v-if="$store.state.osInfo") OS: {{$store.state.osInfo.os}}
    .info(v-if="$store.state.ffInfo") Firefox: {{$store.state.ffInfo.version}}
    .info Addon: {{$store.state.version}}
</template>

<script>
import { translate } from '../../../addon/locales/dict'
import { DEFAULT_SETTINGS } from '../../../addon/defaults'
import TextField from '../../components/text-field'
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import ExportConfig from './export-config'
import ImportConfig from './import-config'
import State from '../store/state'
import Actions from '../actions'

export default {
  components: { TextField, ToggleField, SelectField, ExportConfig, ImportConfig },

  data() {
    return { tabsCount: 0 }
  },

  methods: {
    /**
     * Reset settings
     */
    resetSettings() {
      if (window.confirm(translate('settings.reset_confirm'))) {
        Actions.resetSettings()
        Actions.saveSettings()
      }
    },

    /**
     * Import addon data
     */
    importData(importEvent) {
      let file = importEvent.target.files[0]
      let reader = new FileReader()
      reader.onload = fileEvent => {
        let jsonStr = fileEvent.target.result
        if (!jsonStr) return

        let importedData
        try {
          importedData = JSON.parse(jsonStr)
        } catch (err) {
          // nothing
        }

        if (!importedData) return
        State.importConfig = importedData
      }
      reader.readAsText(file)
    },

    /**
     * Get debug details
     */
    async getDbgDetails() {
      let dbg = {}

      dbg.settings = {}
      for (let prop of Object.keys(DEFAULT_SETTINGS)) {
        dbg.settings[prop] = State[prop]
      }

      try {
        dbg.permissions = {
          allUrls: State.permAllUrls,
          tabHide: State.permTabHide,
          actualAllUrls: await browser.permissions.contains({ origins: ['<all_urls>'] }),
          actualTabHide: await browser.permissions.contains({ permissions: ['tabHide'] }),
        }
      } catch (err) {
        dbg.permissions = err.toString()
      }

      try {
        let stored = await browser.storage.local.get()
        dbg.storage = {
          size: Utils.strSize(JSON.stringify(stored)),
          props: {},
        }
        for (let prop of Object.keys(stored)) {
          dbg.storage.props[prop] = Utils.strSize(JSON.stringify(stored[prop]))
        }
      } catch (err) {
        dbg.storage = err.toString()
      }

      try {
        let { panels_v4 } = await browser.storage.local.get('panels_v4')
        dbg.panels = []
        for (let panel of panels_v4) {
          let clone = Utils.cloneObject(panel)
          if (clone.name) clone.name = clone.name.length
          if (clone.icon) clone.icon = '...'
          if (clone.color) clone.color = '...'
          if (clone.includeHosts) clone.includeHosts = clone.includeHosts.length
          if (clone.excludeHosts) clone.excludeHosts = clone.excludeHosts.length
          if (clone.proxy) clone.proxy = '...'
          if (clone.customIconSrc) clone.customIconSrc = '...'
          if (clone.customIcon) clone.customIcon = '...'
          dbg.panels.push(clone)
        }
      } catch (err) {
        dbg.panels = err.toString()
      }

      try {
        let { cssVars } = await browser.storage.local.get('cssVars')
        dbg.cssVars = {}
        for (let prop of Object.keys(cssVars)) {
          if (cssVars[prop]) dbg.cssVars[prop] = cssVars[prop]
        }
      } catch (err) {
        dbg.cssVars = err.toString()
      }

      try {
        let { sidebarCSS, groupCSS } = await browser.storage.local.get(['sidebarCSS', 'groupCSS'])
        dbg.sidebarCSSLen = sidebarCSS.length
        dbg.groupCSSLen = groupCSS.length
      } catch (err) {
        // nothing...
      }

      try {
        let windows = await browser.windows.getAll({ populate: true })
        dbg.windows = []
        for (let w of windows) {
          dbg.windows.push({
            state: w.state,
            incognito: w.incognito,
            tabsCount: w.tabs.length,
          })
        }
      } catch (err) {
        dbg.windows = err.toString()
      }

      try {
        let ans = await browser.storage.local.get(['tabsMenu', 'bookmarksMenu'])
        dbg.tabsMenu = ans.tabsMenu
        dbg.bookmarksMenu = ans.bookmarksMenu
      } catch (err) {
        dbg.tabsMenu = err.toString()
        dbg.bookmarksMenu = err.toString()
      }

      try {
        let bookmarks = await browser.bookmarks.getTree()
        let bookmarksCount = 0
        let foldersCount = 0
        let separatorsCount = 0
        let lvl = 0,
          maxDepth = 0
        let walker = nodes => {
          if (lvl > maxDepth) maxDepth = lvl
          for (let node of nodes) {
            if (node.type === 'bookmark') bookmarksCount++
            if (node.type === 'folder') foldersCount++
            if (node.type === 'separator') separatorsCount++
            if (node.children) {
              lvl++
              walker(node.children)
              lvl--
            }
          }
        }
        walker(bookmarks[0].children)

        dbg.bookmarks = {
          bookmarksCount,
          foldersCount,
          separatorsCount,
          maxDepth,
        }
      } catch (err) {
        dbg.bookmarks = err.toString()
      }

      return dbg
    },

    /**
     * Show debug details
     */
    async showDbgDetails() {
      let dbg = await this.getDbgDetails()
      State.dbgDetails = JSON.stringify(dbg, null, 2)
    },

    /**
     * Copy debug info
     */
    copyDebugDetail() {
      if (!State.dbgDetails) return
      navigator.clipboard.writeText(State.dbgDetails)
    },

    /**
     * Reload addon
     */
    reloadAddon() {
      browser.runtime.reload()
    },
  },
}
</script>
