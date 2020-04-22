<docs>
## Props
- tab: Object,
- favPlaceholder: String,
- childCount: Number,
- loading: Boolean,
- onExp: Function,
</docs>

<template lang="pug" functional>
.fav(@dragstart.stop.prevent="")
  Transition(name="tab-part")
    .placeholder(v-if="!props.tab.favIconUrl"): svg: use(:xlink:href="props.favPlaceholder")
  Transition(name="tab-part"): img(v-if="props.tab.favIconUrl" :src="props.tab.favIconUrl")
  .exp(
    v-if="props.tab.isParent"
    @dblclick.prevent.stop=""
    @mousedown.stop="props.onExp"
    @mouseup.left.stop="")
    svg: use(xlink:href="#icon_expand")
  .update-badge
  Transition(name="tab-part")
    .ok-badge(v-if="props.loading === 'ok'"): svg: use(xlink:href="#icon_ok")
  Transition(name="tab-part")
    .err-badge(v-if="props.loading === 'err'"): svg: use(xlink:href="#icon_err")
  Transition(name="tab-part"): .progress-spinner(v-if="props.loading === true")
  .child-count(v-if="props.childCount && props.tab.folded") {{props.childCount}}
</template>
