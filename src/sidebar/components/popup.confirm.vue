<template lang="pug">
.Confirm.popup-container(@click="Popups.finishConfirmation(false)")
  .popup(@click.stop)
    h2 {{translate('confirm.warn_title')}}
    .msg {{Popups.reactive.confirm?.msg}}
    .ctrls
      .btn(@click="Popups.finishConfirmation(true)") {{translate('btn.yes')}}
      .btn(@click="Popups.finishConfirmation(false)") {{translate('btn.no')}}
</template>

<script lang="ts" setup>
import { translate } from 'src/dict'
import * as Popups from 'src/services/popups'
</script>
