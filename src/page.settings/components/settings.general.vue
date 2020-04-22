<template lang="pug">
section
  h2 {{t('settings.general_title')}}
  ToggleField(
    label="settings.native_scrollbars"
    :value="$store.state.nativeScrollbars"
    @input="setOpt('nativeScrollbars', $event)")
  ToggleField(
    label="settings.sel_win_screenshots"
    :value="$store.state.selWinScreenshots"
    @input="setOpt('selWinScreenshots', $event)")
</template>

<script>
import ToggleField from '../../components/toggle-field'

export default {
  components: { ToggleField },
}
</script>
