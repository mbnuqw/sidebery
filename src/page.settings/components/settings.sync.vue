<template lang="pug">
section
  h2
    span {{t('settings.sync_title')}}
    .title-note   (~{{syncedOveral}})
  text-field(
    label="settings.sync_name"
    :or="t('settings.sync_name_or')"
    v-model="$store.state.syncName"
    v-debounce:input.321="setSyncName")
  toggle-field(
    label="settings.sync_save_settings"
    :value="$store.state.syncSaveSettings"
    @input="setOpt('syncSaveSettings', $event)")
  toggle-field(
    label="settings.sync_save_ctx_menu"
    :value="$store.state.syncSaveCtxMenu"
    @input="setOpt('syncSaveCtxMenu', $event), saveSyncCtxMenu()")
  toggle-field(
    label="settings.sync_save_styles"
    :value="$store.state.syncSaveStyles"
    @input="setOpt('syncSaveStyles', $event), saveSyncStyles()")
  .sync-data(v-if="syncedSettings")
    .sync-title {{t('settings.sync_settings_title')}}
    .sync-list
      .sync-item(v-for="item in syncedSettings")
        .sync-info {{item.info}}
        .btn.sync-btn(@click.stop="applySyncData(item.value)") {{t('settings.sync_apply_btn')}}
        .btn.sync-btn.-warn(@click.stop="deleteSyncData(item.id)") {{t('settings.sync_delete_btn')}}
  .sync-data(v-if="syncedCtxMenu")
    .sync-title {{t('settings.sync_ctx_menu_title')}}
    .sync-list
      .sync-item(v-for="item in syncedCtxMenu")
        .sync-info {{item.info}}
        .btn.sync-btn(@click.stop="applySyncData(item.value)") {{t('settings.sync_apply_btn')}}
        .btn.sync-btn.-warn(@click.stop="deleteSyncData(item.id)") {{t('settings.sync_delete_btn')}}
  .sync-data(v-if="syncedStyles")
    .sync-title {{t('settings.sync_styles_title')}}
    .sync-list
      .sync-item(v-for="item in syncedStyles")
        .sync-info {{item.info}}
        .btn.sync-btn(@click.stop="applySyncData(item.value)") {{t('settings.sync_apply_btn')}}
        .btn.sync-btn.-warn(@click.stop="deleteSyncData(item.id)") {{t('settings.sync_delete_btn')}}
  .ctrls
    .btn(@click="loadSyncedData") {{t('settings.sync_update_btn')}}
</template>

<script>
import { translate } from '../../../addon/locales/dict'
import ToggleField from '../../components/toggle-field'
import TextField from '../../components/text-field'
import State from '../store/state'
import Actions from '../actions'

export default {
  components: { ToggleField, TextField },

  data() {
    return {
      syncedOveral: '-',
      syncedSettings: null,
      syncedCtxMenu: null,
      syncedStyles: null,
    }
  },

  mounted() {
    this.loadSyncedData()
  },

  methods: {
    /**
     * Load current sync storage content
     */
    async loadSyncedData() {
      let [syncStorage, profileId] = await Promise.all([
        browser.storage.sync.get(),
        Actions.getProfileId(),
      ])
      let toRemove = []
      let data = {}

      this.syncedOveral = Utils.strSize(JSON.stringify(syncStorage))

      for (let syncKey of Object.keys(syncStorage)) {
        let syncData = syncStorage[syncKey]
        let [syncProfileId, syncPropName] = syncKey.split('::')

        if (!syncData || !syncProfileId || !syncPropName) {
          toRemove.push(syncKey)
          continue
        }

        syncData.id = syncKey
        syncData.info = this.getSyncDataInfoString(syncData, syncProfileId)
        syncData.sameProfile = profileId === syncProfileId
        if (!data[syncPropName]) data[syncPropName] = []
        data[syncPropName].push(syncData)
      }

      if (data.settings) this.syncedSettings = data.settings
      else this.syncedSettings = null
      if (data.ctxMenu) this.syncedCtxMenu = data.ctxMenu
      else this.syncedCtxMenu = null
      if (data.styles) this.syncedStyles = data.styles
      else this.syncedStyles = null

      if (toRemove.length) {
        browser.storage.sync.remove(toRemove)
      }
    },

    /**
     * Get formatted info
     */
    getSyncDataInfoString(info, profileId) {
      let name = info.name || profileId
      let date = Utils.uDate(info.time)
      let time = Utils.uTime(info.time)
      let dataJSON = JSON.stringify(info)

      return `${name} - ${date} - ${time} - ${Utils.strSize(dataJSON)}`
    },

    /**
     * Update local storage with synced data and reload that data
     */
    async applySyncData(data) {
      if (window.confirm(translate('settings.sync_apply_confirm'))) {
        // Keep sync settings
        if (data.settings) {
          data.settings.syncName = State.syncName
          data.settings.syncSaveSettings = State.syncSaveSettings
          data.settings.syncSaveCtxMenu = State.syncSaveCtxMenu
          data.settings.syncSaveStyles = State.syncSaveStyles
          data.settings.syncAutoApply = State.syncAutoApply
        }

        await browser.storage.local.set(Utils.cloneObject(data))

        if (data.settings) Actions.loadSettings()
        if (data.tabsMenu) Actions.loadCtxMenu()
        if (data.tabsPanelMenu) Actions.loadCtxMenu()
        if (data.bookmarksMenu) Actions.loadCtxMenu()
        if (data.bookmarksPanelMenu) Actions.loadCtxMenu()
        if (data.cssVars) Actions.loadCSSVars()
      }
    },

    /**
     * Delete key-val from sync storage
     */
    async deleteSyncData(key) {
      await browser.storage.sync.remove(key)
      this.loadSyncedData()
    },

    /**
     * Set name of sync profile
     */
    setSyncName() {
      this.setOpt('syncName', State.syncName)
    },

    /**
     * Save context menu
     */
    saveSyncCtxMenu() {
      if (!State.syncSaveCtxMenu) return
      Actions.saveCtxMenu()
    },

    /**
     * Save styles
     */
    async saveSyncStyles() {
      if (!State.syncSaveStyles) return

      let [cssVars, sidebarCSS, groupCSS] = await Promise.all([
        Actions.getCSSVars(),
        Actions.getCustomCSS('sidebar'),
        Actions.getCustomCSS('group'),
      ])

      if (sidebarCSS) State.sidebarCSS = sidebarCSS
      if (groupCSS) State.groupCSS = groupCSS

      Actions.saveStylesToSync(cssVars)
    },
  },
}
</script>
