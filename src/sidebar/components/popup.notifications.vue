<template lang="pug">
.Notifications(
  @mouseenter="Notifications.resetTimers(), onMouseEnter()"
  @mouseleave="Notifications.restartTimers(), onMouseLeave()")
  TransitionGroup(name="notification" tag="div")
    .indicators(v-if="restNotifications.length && !restNotificationsVisible" :key="'ind'")
      .indicator(v-for="i of restNotifications.length" :key="i"): .ring

    NotificationContainer(
      v-if="restNotificationsVisible"
      v-for="(n, i) of restNotifications"
      :key="n.id"
      :notification="n"
      :index="i")

    NotificationContainer(
      v-if="activeNotif"
      :key="activeNotif.id"
      :notification="activeNotif"
      :index="activeNotificationIndex")

</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { Notification } from 'src/types'
import { Notifications } from 'src/services/notifications'
import NotificationContainer from './popup.notification.vue'

const activeNotificationIndex = ref(0)
const restNotificationsVisible = ref(false)

const activeNotif = computed<Notification | null>(() => {
  return Notifications.reactive.list[activeNotificationIndex.value] ?? null
})

const restNotifications = computed<Notification[]>(() => {
  const pre = Notifications.reactive.list.slice(0, activeNotificationIndex.value)
  const post = Notifications.reactive.list.slice(activeNotificationIndex.value + 1)
  return pre.concat(post)
})

watch(Notifications.reactive.list, () => {
  activeNotificationIndex.value = Notifications.reactive.list.length - 1
})

function onMouseEnter() {
  showRestNotifications()
}

function onMouseLeave() {
  hideRestNotifications()
}

function showRestNotifications() {
  clearTimeout(hideRestNotificationsTimeout)
  restNotificationsVisible.value = true
}

let hideRestNotificationsTimeout: number | undefined
function hideRestNotifications() {
  clearTimeout(hideRestNotificationsTimeout)
  hideRestNotificationsTimeout = setTimeout(() => {
    restNotificationsVisible.value = false
  }, 250)
}
</script>
