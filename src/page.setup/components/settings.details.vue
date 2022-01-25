<template lang="pug">
.DetailsBox(v-if="SetupPage.reactive.detailsText" @wheel="onDetailsWheel")
  .box
    .title(v-if="SetupPage.reactive.detailsTitle") {{SetupPage.reactive.detailsTitle}}
    .btn(v-if="SetupPage.reactive.detailsEdit" @click="saveDetails") SAVE
    .btn(v-if="!SetupPage.reactive.detailsEdit" @click="copyDetails") {{translate('settings.ctrl_copy')}}
    .btn.-warn(@click="closeDetails") {{translate('settings.ctrl_close')}}
  textarea.editor(
    v-if="SetupPage.reactive.detailsEdit"
    v-model="SetupPage.reactive.detailsText"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    @keydown.tab.prevent)
  .json(v-else) {{SetupPage.reactive.detailsText}}
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'
import { SetupPage } from 'src/services/setup-page'

/**
 * Block scrolling the main page when debug info showed.
 */
function onDetailsWheel(e: WheelEvent): void {
  let target = e.target as HTMLElement
  if (target.offsetHeight >= target.scrollHeight) target = target.parentNode as HTMLElement

  const scrollOffset = target.scrollTop
  const offsetHeight = target.offsetHeight
  const maxScrollOffset = target.scrollHeight - offsetHeight
  if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
  if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
}

function copyDetails(): void {
  if (!SetupPage.reactive.detailsText) return
  navigator.clipboard.writeText(SetupPage.reactive.detailsText)
}

function saveDetails(): void {
  if (SetupPage.reactive.detailsEdit) {
    if (window.confirm('Are you sure?')) {
      try {
        SetupPage.reactive.detailsEdit(SetupPage.reactive.detailsText)
      } catch (err) {
        window.alert(err)
      }
    }
  }
  closeDetails()
}

function closeDetails(): void {
  SetupPage.reactive.detailsText = ''
  SetupPage.reactive.detailsTitle = ''
  SetupPage.reactive.detailsEdit = undefined
}
</script>
