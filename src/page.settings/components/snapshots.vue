<template lang="pug">
.Snapshots
  .wrapper
    .timeline-box: .timeline(v-noise:300.g:12:af.a:0:42.s:0:9="")
      .ruler
      .snapshot-card(
        v-for="s in snapshots"
        :key="s.id"
        :data-type="s.type"
        :data-event="s.event"
        :data-active="activeSnapshot.id === s.id"
        @click="activeSnapshot = s")
        .point
        .event {{t('snapshot.event.' + s.event)}}: {{s.value}}
        .elapsed {{s.elapsed}} ({{s.time}})
    .snapshot-box: .snapshot(v-noise:300.g:12:af.a:0:42.s:0:9="").
      selected snapshot...
</template>


<script>
import Utils from '../../utils'

export default {
  data() {
    return {
      snapshots: [],
      activeSnapshot: null,
    }
  },

  async created() {
    const ans = await browser.storage.local.get(['snapshots', 'snapLayers'])
    if (!ans || !ans.snapshots || !ans.snapLayers) return

    // Add layers to the last base-snapshot
    const snapLayer = ans.snapLayers[0]
    if (snapLayer) {
      for (let i = ans.snapshots.length; i--;) {
        if (ans.snapshots[i].id === snapLayer[0]) {
          ans.snapshots[i].layers = ans.snapLayers
          break
        }
      }
    }

    // Normalize snapshots
    const snapshots = []
    const now = Math.trunc(Date.now() / 1000)
    for (let snapshot of ans.snapshots) {
      snapshots.push({
        id: snapshot.id,
        type: 'base',
        event: 'init',
        elapsed: Utils.uElapsed(snapshot.time, now)
      })

      if (snapshot.layers) {
        for (let i = 0; i < snapshot.layers.length; i++) {
          let layer = snapshot.layers[i]
          const targetId = layer[2]
          const targetType = typeof targetId === 'number' ? 'tab' : 'container'
          let event, value = ''
          if (targetType === 'tab') {
            if (layer.length === 8) event = 'tab-created'
            if (layer.length === 3) event = 'tab-removed'
            if (layer.length === 4) event = 'tab-moved'
            if (layer[3] === 'u') {
              event = 'tab-url-changed'
              value = layer[4]
            }
            if (layer[3] === 't') {
              event = 'tab-title-changed'
              value = layer[4]
            }
            if (layer[3] === 'l') event = 'tab-lvl-changed'
          } else {
            if (layer.length === 6) event = 'ctr-created'
            if (layer.length === 3) event = 'ctr-removed'
            if (layer[3] === 'c') event = 'ctr-color-changed'
            if (layer[3] === 'i') event = 'ctr-icon-changed'
            if (layer[3] === 'n') event = 'ctr-name-changed'
          }
          snapshots.push({
            id: layer[0] + i,
            type: 'layer',
            event,
            time: Utils.uDate(layer[1]),
            value,
            elapsed: Utils.uElapsed(layer[1], now)
          })
        }
      }
    }
    snapshots.reverse()

    this.snapshots = snapshots
    this.activeSnapshot = snapshots[0]
  },

  methods: {},
}
</script>
