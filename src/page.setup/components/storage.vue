<template lang="pug">
.Settings
  section(ref="el")
    h2
      span {{translate('settings.storage_title')}}
      .title-note   (~{{state.storageOveral}})
    .storage-section
      .storage-prop(v-for="info in state.storedProps" @click="openStoredData(info.name)")
        .name {{info.name}}
        .len(v-if="info.len") {{info.len}}
        .size {{info.sizeStr}}
        .btn(@click.stop="openStoredData(info.name)") {{translate('settings.storage_open_prop')}}
        .btn(@click.stop="editStoredData(info.name)") {{translate('settings.storage_edit_prop')}}
        .btn.-warn(@click.stop="deleteStoredData(info.name)") {{translate('settings.storage_delete_prop')}}

    .ctrls
      .btn(@click="calcStorageInfo") {{translate('settings.update_storage_info')}}
      .btn.-warn(@click="clearStorage") {{translate('settings.clear_storage_info')}}

    .storage-section
      .sub-title {{translate('settings.favs_title')}}
      .favs
        .fav(v-for="fav in state.faviconsCache" :key="fav.tooltip" :title="fav.tooltip")
          img(:src="fav.favicon")

  FooterSection
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { translate } from 'src/dict'
import * as Utils from 'src/utils'
import { Stored } from 'src/types'
import { Store } from 'src/services/storage'
import { SetupPage } from 'src/services/setup-page'
import * as Logs from 'src/services/logs'
import FooterSection from './footer-section.vue'

const el = ref<HTMLElement | null>(null)
const state = reactive({
  storedProps: [] as { name: string; size: number; sizeStr: string; len: string }[],
  storageOveral: '-',
  faviconsCache: [] as { favicon: string; tooltip: string }[],
})

onMounted(() => {
  SetupPage.registerEl('settings_storage', el.value)
  calcStorageInfo()
})

async function calcStorageInfo(): Promise<void> {
  let stored: Stored
  try {
    stored = await browser.storage.local.get<Stored>()
  } catch (err) {
    return
  }

  state.storageOveral = Utils.strSize(JSON.stringify(stored))
  state.storedProps = Object.keys(stored)
    .map(key => {
      const value = stored[key as keyof Stored]
      const size = new Blob([JSON.stringify(value)]).size
      const len = Array.isArray(value) ? `(${value.length as number}) ` : ''
      return { name: key, size, len, sizeStr: '~' + Utils.strSize(JSON.stringify(value)) }
    })
    .sort((a, b) => b.size - a.size)

  // TEMP
  if (stored.favicons && stored.favDomains) {
    state.faviconsCache = []
    const favsDomainsInfo: { domain: string; index: number; src: string }[] = []
    for (const d of Object.keys(stored.favDomains)) {
      const info = stored.favDomains[d]
      if (info) favsDomainsInfo[info.index] = { domain: d, ...info }
    }
    for (let fav, info, i = 0; i < stored.favicons.length; i++) {
      fav = stored.favicons[i]
      info = favsDomainsInfo[i]
      const tooltipInfo = []
      if (fav) tooltipInfo.push(`${fav.substring(0, 32)}...\nSize: ${Utils.bytesToStr(fav.length)}`)
      if (info) tooltipInfo.push(`Index: ${info.index}\nDomain: ${info.domain}\nSRC: ${info.src}`)
      state.faviconsCache.push({ favicon: fav, tooltip: tooltipInfo.join('\n') })
    }
  }
}

async function openStoredData(prop: string): Promise<void> {
  let stored
  try {
    stored = await browser.storage.local.get<Stored>(prop)
  } catch (err) {
    SetupPage.reactive.detailsTitle = 'Error: Cannot get value'
    SetupPage.reactive.detailsText = String(err)
    return
  }
  if (stored && stored[prop as keyof Stored] !== undefined) {
    SetupPage.reactive.detailsTitle = prop
    SetupPage.reactive.detailsText = JSON.stringify(stored[prop as keyof Stored], null, 2)
  }
}

async function editStoredData(prop: string): Promise<void> {
  let stored
  try {
    stored = await browser.storage.local.get<Stored>(prop)
  } catch (err) {
    SetupPage.reactive.detailsTitle = 'Error: Cannot get value'
    SetupPage.reactive.detailsText = String(err)
    return
  }
  if (stored?.[prop as keyof Stored] !== undefined) {
    SetupPage.reactive.detailsText = JSON.stringify(stored[prop as keyof Stored], null, 2)
    SetupPage.reactive.detailsTitle = prop
    SetupPage.reactive.detailsEdit = (newValue: string) => {
      let json
      try {
        json = JSON.parse(newValue) as unknown
      } catch (err) {
        return Logs.err('Settings.Storage: Cannot parse json', err)
      }

      Store.set({ [prop]: json })
    }
  }
}

async function deleteStoredData(prop: string): Promise<void> {
  if (window.confirm(translate('settings.storage_delete_confirm') + `"${prop}"?`)) {
    try {
      await browser.storage.local.remove(prop)
    } catch (err) {
      return Logs.err('deleteStoredData: Cannot remove value', err)
    }
    calcStorageInfo()
  }
}

async function clearStorage(): Promise<void> {
  if (!window.confirm(translate('settings.clear_storage_confirm'))) return

  try {
    await browser.storage.local.clear()
  } catch (err) {
    return Logs.err('clearStorage: Cannot clean storage', err)
  }
  browser.runtime.reload()
}
</script>
