<template lang="pug">
.WindowSelectInput(:data-ready="isReady" @click="cancel")
  .title(v-if="$store.state.winChoosingTitle") {{$store.state.winChoosingTitle}}
  ScrollBox(ref="scrollBox")
    .box(
      v-for="(w, i) in $store.state.winChoosing"
      :key="w.id"
      :data-no-screenshot="!w.screen"
      :data-selected="selected === i")
      .win(@click.stop="w.choose")
        .window-title {{w.title}}
        img(v-if="w.screen" :src="w.screen" @load="onScreenLoad(i)")
</template>

<script>
import EventBus from '../../event-bus'
import State from '../store/state'
import ScrollBox from './scroll-box'

export default {
  components: {
    ScrollBox,
  },

  data() {
    return {
      selected: -1,
    }
  },

  computed: {
    isReady() {
      if (!State.winChoosing || !State.winChoosing.length) return false
      if (!State.winChoosing[0].screen) return true
      return State.winChoosing.reduce((o, w) => o && w.loaded, true)
    },
  },

  created() {
    EventBus.$on('selectWindow', dir => {
      if (this.selected === -1) {
        if (dir > 0) this.selected = 0
        else this.selected = State.winChoosing.length - 1
      } else {
        this.selected += dir
        if (this.selected < 0) this.selected = 0
        if (this.selected >= State.winChoosing.length) this.selected = State.winChoosing.length - 1
      }
    })

    EventBus.$on('chooseWindow', () => {
      if (State.winChoosing[this.selected]) State.winChoosing[this.selected].choose()
    })
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
