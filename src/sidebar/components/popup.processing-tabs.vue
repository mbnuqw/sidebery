<template lang="pug">
.ProcessingTabs.popup-container
  .popup(@click.stop)
    h2 {{translate('popup.proc_tabs.title')}}
    LoadingDots.loading-dots
</template>

<script lang="ts" setup>
import LoadingDots from 'src/components/loading-dots.vue'
import { translate } from 'src/dict'
</script>
