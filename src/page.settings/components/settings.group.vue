<template lang="pug">
  section
    h2 {{t('settings.group_title')}}
    select-field(
      label="settings.group_layout"
      optLabel="settings.group_layout_"
      :value="$store.state.groupLayout"
      :opts="$store.state.groupLayoutOpts"
      @input="setOpt('groupLayout', $event)")
</template>

<script>
import SelectField from '../../components/select-field'

export default {
  components: { SelectField },
}
</script>
