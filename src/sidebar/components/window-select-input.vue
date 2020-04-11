<template lang="pug">
.WindowSelectInput(:data-ready="isReady" @click="cancel")
  .title(v-if="$store.state.winChoosingTitle") {{$store.state.winChoosingTitle}}
  scroll-box(ref="scrollBox")
    .box(v-for="(w, i) in $store.state.winChoosing" :key="w.id" :data-no-screenshot="!w.screen")
      .win(@click.stop="w.choose")
        .window-title {{w.title}}
        img(v-if="w.screen" :src="w.screen" @load="onScreenLoad(i)")
</template>

<script>
import State from '../store/state'
import ScrollBox from './scroll-box'

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
      if (!State.winChoosing[0].screen) return true
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
