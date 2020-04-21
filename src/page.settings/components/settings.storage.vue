<template lang="pug">
section
  h2
    span {{t('settings.storage_title')}}
    .title-note   (~{{storageOveral}})
  .storage-section
    .storage-prop(v-for="info in storedProps" @click="openStoredData(info.name)")
      .name {{info.name}}
      .size ~{{info.sizeStr}}
      .del-btn(@click.stop="deleteStoredData(info.name)") {{t('settings.storage_delete_prop')}}
      .open-btn(@click.stop="openStoredData(info.name)") {{t('settings.storage_open_prop')}}
  .ctrls
    .btn(@click="calcStorageInfo") {{t('settings.update_storage_info')}}
    .btn.-warn(@click="clearStorage") {{t('settings.clear_storage_info')}}
</template>

<script>
import { translate } from '../../../addon/locales/dict'
import State from '../store/state'

export default {
  data() {
    return {
      storedProps: [],
      storageOveral: '-',
    }
  },

  mounted() {
    this.calcStorageInfo()
  },

  methods: {
    /**
     * Calculate storage info
     */
    async calcStorageInfo() {
      let stored
      try {
        stored = await browser.storage.local.get()
      } catch (err) {
        return
      }

      this.storageOveral = Utils.strSize(JSON.stringify(stored))
      this.storedProps = Object.keys(stored)
        .map(key => {
          let value = stored[key]
          let size = new Blob([JSON.stringify(value)]).size
          return {
            name: key,
            size,
            sizeStr: Utils.strSize(JSON.stringify(value)),
          }
        })
        .sort((a, b) => b.size - a.size)
    },

    /**
     * Show stored data
     */
    async openStoredData(prop) {
      let ans = await browser.storage.local.get(prop)
      if (ans && ans[prop] !== undefined) {
        State.dbgDetails = JSON.stringify(ans[prop], null, 2)
      }
    },

    /**
     * Delete stored data
     */
    async deleteStoredData(prop) {
      if (window.confirm(translate('settings.storage_delete_confirm') + `"${prop}"?`)) {
        await browser.storage.local.remove(prop)
        browser.runtime.reload()
      }
    },

    async clearStorage() {
      if (window.confirm(translate('settings.clear_storage_confirm'))) {
        await browser.storage.local.clear()
        browser.runtime.reload()
      }
    },
  },
}
</script>
