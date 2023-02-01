<template lang="pug">
.Confirm.popup-container(@click="Sidebar.finishConfirmation(false)")
  .popup(@click.stop)
    h2 {{translate('confirm.warn_title')}}
    .msg {{Sidebar.reactive.confirm?.msg}}
    .ctrls
      .btn(@click="Sidebar.finishConfirmation(true)") {{translate('btn.yes')}}
      .btn(@click="Sidebar.finishConfirmation(false)") {{translate('btn.no')}}
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'
import { Sidebar } from 'src/services/sidebar'
</script>
