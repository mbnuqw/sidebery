<template lang="pug">
.WinInput(:data-ready="isReady" @click="cancel")
  scroll-box(ref="scrollBox")
    .box(v-for="(w, i) in $store.state.winChoosing", :key="w.id")
      .win(@click.stop="w.choose")
        .title {{w.title}}
        img(:src="w.screen", @load="onScreenLoad(i)")
</template>


<script>
import State from '../../store/state'
import ScrollBox from '../scroll-box'

export default {
  components: {
    ScrollBox,
  },

  data() {
    return {}
  },

  computed: {
    isReady() {
      if (!State.winChoosing || !State.winChoosing.length) return false
      return State.winChoosing.reduce((o, w) => o && w.loaded, true)
    },
  },

  methods: {
    onScreenLoad(index) {
      let win = State.winChoosing[index]
      State.winChoosing.splice(index, 1, { ...win, loaded: true })
    },

    cancel() {
      State.winChoosing = State.winChoosing.map(w => {
        return { ...w, loaded: false }
      })
      setTimeout(() => {
        State.winChoosing = null
        State.panelIndex = State.lastPanelIndex
      }, 120)
    },
  },
}
</script>
