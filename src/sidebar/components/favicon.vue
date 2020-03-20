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
  transition(name="tab-part")
    .placeholder(v-if="!props.tab.favIconUrl"): svg: use(:xlink:href="props.favPlaceholder")
  transition(name="tab-part"): img(v-if="props.tab.favIconUrl" :src="props.tab.favIconUrl")
  .exp(
    v-if="props.tab.isParent"
    @dblclick.prevent.stop=""
    @mousedown.stop="props.onExp"
    @mouseup.left.stop="")
    svg: use(xlink:href="#icon_expand")
  .update-badge
  transition(name="tab-part")
    .ok-badge(v-if="props.loading === 'ok'"): svg: use(xlink:href="#icon_ok")
  transition(name="tab-part")
    .err-badge(v-if="props.loading === 'err'"): svg: use(xlink:href="#icon_err")
  transition(name="tab-part"): .progress-spinner(v-if="props.loading === true")
  .child-count(v-if="props.childCount && props.tab.folded") {{props.childCount}}
</template>
