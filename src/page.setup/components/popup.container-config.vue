<template lang="pug">
.ConfigPopup(ref="rootEl" @wheel="onWheel")
  TextInput.title(
    ref="nameInput"
    :value="props.conf.name"
    :line="true"
    :or="translate('container.name_placeholder')"
    @update:value="onNameInput")

  SelectField.-no-separator(
    label="container.icon_label"
    :value="icon"
    :opts="CONTAINER_ICON_OPTS"
    :color="color"
    @update:value="updateIcon")

  SelectField(
    label="container.color_label"
    :value="color"
    :opts="COLOR_OPTS"
    :icon="icon"
    @update:value="updateColor")

  ToggleField(
    label="container.rules_include"
    :title="translate('container.rules_include_tooltip')"
    :value="props.conf.includeHostsActive"
    @update:value="toggleIncludeHosts")
  .sub-fields.-nosep(v-if="props.conf.includeHostsActive")
    .field
      TextInput.text(
        ref="includeHostsInput"
        or="---"
        :value="props.conf.includeHosts"
        :valid="includeHostsValid"
        @update:value="onIncludeHostsInput")

  ToggleField(
    label="container.rules_exclude"
    :title="translate('container.rules_exclude_tooltip')"
    :value="props.conf.excludeHostsActive"
    @update:value="toggleExcludeHosts")
  .sub-fields.-nosep(v-if="props.conf.excludeHostsActive")
    .field
      TextInput.text(
        ref="excludeHostsInput"
        or="---"
        :value="props.conf.excludeHosts"
        :valid="excludeHostsValid"
        @update:value="onExcludeHostsInput")

  SelectField(
    label="container.proxy_label"
    optLabel="container.proxy_"
    noneOpt="direct"
    :value="proxied"
    :opts="PROXY_OPTS"
    @update:value="switchProxy")
  .sub-fields(v-if="proxied !== 'direct'")
    TextField(
      ref="proxyHostInput"
      label="Host"
      :or="translate('container.proxy_host_placeholder')"
      :line="true"
      :value="proxyHost"
      :valid="proxyHostValid"
      @update:value="onProxyHostInput"
      @keydown="onFieldKeydown($event, proxyPortInput, nameInput)")
    TextField(
      ref="proxyPortInput"
      label="Port"
      :or="translate('container.proxy_port_placeholder')"
      :line="true"
      :value="proxyPort"
      :valid="proxyPortValid"
      @update:value="onProxyPortInput"
      @keydown="onFieldKeydown($event, proxyUsernameInput, proxyHostInput)")
    TextField(
      ref="proxyUsernameInput"
      label="Username"
      :or="translate('container.proxy_username_placeholder')"
      :line="true"
      :value="proxyUsername"
      @update:value="onProxyUsernameInput"
      @keydown="onFieldKeydown($event, proxyPasswordInput, proxyPortInput)")
    TextField(
      ref="proxyPasswordInput"
      label="Password"
      :or="translate('container.proxy_password_placeholder')"
      :line="true"
      :value="proxyPassword"
      :password="true"
      @update:value="onProxyPasswordInput"
      @keydown="onFieldKeydown($event, null, proxyUsernameInput)")
    ToggleField(
      v-if="isSomeSocks"
      label="container.proxy_dns_label"
      :value="proxyDNS"
      @update:value="toggleProxyDns")

  ToggleField(
    label="container.user_agent"
    :value="props.conf.userAgentActive"
    @update:value="toggleUserAgent")
  .sub-fields.-nosep(v-if="props.conf.userAgentActive")
    .field
      TextInput.text(
        ref="userAgentInput"
        or="---"
        :value="props.conf.userAgent"
        @update:value="onUserAgentInput")
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick, PropType } from 'vue'
import Utils from 'src/utils'
import { translate } from 'src/dict'
import { CONTAINER_ICON_OPTS, COLOR_OPTS, PROXY_OPTS } from 'src/defaults'
import { Container, TextInputComponent } from 'src/types'
import { Containers } from 'src/services/containers'
import { Permissions } from 'src/services/permissions'
import { SetupPage } from 'src/services/setup-page'
import TextField from '../../components/text-field.vue'
import TextInput from '../../components/text-input.vue'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'

const HOSTS_RULE_RE = /^.+$/m
const PROXY_HOST_RE = /^.{3,65536}$/
const PROXY_PORT_RE = /^\d{2,5}$/

const props = defineProps({
  conf: { type: Object as PropType<Container>, default: () => ({}) },
})

const rootEl = ref<HTMLElement | null>(null)
const nameInput = ref<TextInputComponent | null>(null)
const includeHostsInput = ref<TextInputComponent | null>(null)
const excludeHostsInput = ref<TextInputComponent | null>(null)
const proxyHostInput = ref<TextInputComponent | null>(null)
const proxyPortInput = ref<TextInputComponent | null>(null)
const proxyUsernameInput = ref<TextInputComponent | null>(null)
const proxyPasswordInput = ref<TextInputComponent | null>(null)
const userAgentInput = ref<TextInputComponent | null>(null)

const name = computed((): string => props.conf.name || '')
const icon = computed((): string => props.conf.icon || 'fingerprint')
const color = computed((): string => props.conf.color || 'blue')
const proxied = computed((): string => props.conf.proxy?.type ?? 'direct')
const isSomeSocks = computed((): boolean => proxied.value === 'socks' || proxied.value === 'socks4')
const includeHostsValid = computed((): '' | 'valid' | 'invalid' => {
  if (!props.conf.includeHosts) return ''
  if (HOSTS_RULE_RE.test(props.conf.includeHosts)) return 'valid'
  else return 'invalid'
})
const excludeHostsValid = computed((): '' | 'valid' | 'invalid' => {
  if (!props.conf.excludeHosts) return ''
  if (HOSTS_RULE_RE.test(props.conf.excludeHosts)) return 'valid'
  else return 'invalid'
})
const proxyHost = computed((): string => {
  if (!props.conf.id || !props.conf.proxy?.host) return ''
  return props.conf.proxy.host
})
const proxyPort = computed((): string => {
  if (!props.conf.id || !props.conf.proxy?.port) return ''
  return props.conf.proxy.port
})
const proxyHostValid = computed((): '' | 'valid' | 'invalid' => {
  if (!proxyHost.value) return ''
  if (PROXY_HOST_RE.test(proxyHost.value)) return 'valid'
  else return 'invalid'
})
const proxyPortValid = computed((): '' | 'valid' | 'invalid' => {
  if (!proxyPort.value) return ''
  if (PROXY_PORT_RE.test(proxyPort.value)) return 'valid'
  else return 'invalid'
})
const proxyUsername = computed((): string => {
  if (!props.conf.id || !props.conf.proxy) return ''
  return props.conf.proxy.username ?? ''
})

const proxyPassword = computed((): string => {
  if (!props.conf.id || !props.conf.proxy) return ''
  return props.conf.proxy.password ?? ''
})

const proxyDNS = computed((): boolean => {
  if (!props.conf.id || !props.conf.proxy) return false
  return props.conf.proxy.proxyDNS ?? false
})

onMounted(() => init())

function onWheel(e: WheelEvent): void {
  if (!rootEl.value) return
  let scrollOffset = rootEl.value.scrollTop
  let maxScrollOffset = rootEl.value.scrollHeight - rootEl.value.offsetHeight
  if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
  if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
}

let updateNameTimeout: number
function onNameInput(value: string): void {
  props.conf.name = value
  updateNameTimeout = Utils.wait(updateNameTimeout, 321, () => updateName())
}

function updateContainer(): void {
  if (!props.conf.name || !props.conf.id) return
  browser.contextualIdentities.update(props.conf.id, {
    name: props.conf.name,
    icon: props.conf.icon,
    color: props.conf.color,
  })
}

function updateName(): void {
  if (!name.value) return
  updateContainer()
}

function updateIcon(icon: string): void {
  props.conf.icon = icon
  updateContainer()
}

function updateColor(color: browser.ColorName): void {
  props.conf.color = color
  updateContainer()
}

async function init(): Promise<void> {
  await nextTick()
  if (nameInput.value) nameInput.value.recalcTextHeight()
  if (includeHostsInput.value) includeHostsInput.value.recalcTextHeight()
  if (excludeHostsInput.value) excludeHostsInput.value.recalcTextHeight()
  if (userAgentInput.value) userAgentInput.value.recalcTextHeight()
}

function checkWebDataPerm(): boolean {
  if (!Permissions.reactive.webData) {
    if (props.conf.proxified) {
      props.conf.proxified = false
      if (props.conf.proxy) props.conf.proxy.type = 'direct'
    }
    props.conf.includeHostsActive = false
    props.conf.excludeHostsActive = false
    props.conf.userAgentActive = false
    Containers.saveContainers()
    window.location.hash = 'all-urls'
    return false
  }
  return true
}

async function toggleIncludeHosts(): Promise<void> {
  if (!props.conf.includeHostsActive && !checkWebDataPerm()) return

  props.conf.includeHostsActive = !props.conf.includeHostsActive
  Containers.saveContainers()
  await nextTick()

  includeHostsInput.value?.focus()
}

function onIncludeHostsInput(value: string): void {
  props.conf.includeHosts = value
  Containers.saveContainers(500)
}

async function toggleExcludeHosts(): Promise<void> {
  if (!props.conf.excludeHostsActive && !checkWebDataPerm()) return

  props.conf.excludeHostsActive = !props.conf.excludeHostsActive
  Containers.saveContainers()
  await nextTick()

  excludeHostsInput.value?.focus()
}

function onExcludeHostsInput(value: string): void {
  props.conf.excludeHosts = value
  Containers.saveContainers(500)
}

function switchProxy(type: browser.proxy.ProxyType): void {
  if (type !== 'direct' && !checkWebDataPerm()) return

  props.conf.proxy = {
    type,
    host: proxyHost.value,
    port: proxyPort.value,
    username: proxyUsername.value,
    password: proxyPassword.value,
    proxyDNS: proxyDNS.value,
  }

  if (type === 'direct') props.conf.proxified = false
  else props.conf.proxified = proxyHostValid.value === 'valid' && proxyPortValid.value === 'valid'

  Containers.saveContainers()
}

function onProxyHostInput(value: string): void {
  if (!props.conf.id || !props.conf.proxy) return
  props.conf.proxy.host = value
  props.conf.proxified = proxyHostValid.value === 'valid' && proxyPortValid.value === 'valid'

  Containers.saveContainers(500)
}

function onProxyPortInput(value: string): void {
  if (!props.conf.id || !props.conf.proxy) return
  props.conf.proxy.port = value
  props.conf.proxified = proxyHostValid.value === 'valid' && proxyPortValid.value === 'valid'

  Containers.saveContainers(500)
}

function onProxyUsernameInput(value: string): void {
  if (!props.conf.id || !props.conf.proxy) return
  props.conf.proxy.username = value

  Containers.saveContainers(500)
}

function onProxyPasswordInput(value: string): void {
  if (!props.conf.id || !props.conf.proxy) return
  props.conf.proxy.password = value

  Containers.saveContainers(500)
}

function toggleProxyDns(): void {
  if (!props.conf.id || !props.conf.proxy) return
  props.conf.proxy.proxyDNS = !props.conf.proxy.proxyDNS

  Containers.saveContainers()
}

function onFieldKeydown(
  e: KeyboardEvent,
  nextInput: TextInputComponent | null,
  prevInput: TextInputComponent | null
): void {
  if (e.code === 'Enter' || e.code === 'Tab') {
    if (e.shiftKey) prevInput?.focus()
    else nextInput?.focus()
    e.preventDefault()
  }
}

async function toggleUserAgent(): Promise<void> {
  if (!props.conf.userAgentActive && !checkWebDataPerm()) return

  props.conf.userAgentActive = !props.conf.userAgentActive
  Containers.saveContainers()
  await nextTick()

  userAgentInput.value?.focus()
}

function onUserAgentInput(value: string): void {
  props.conf.userAgent = value
  Containers.saveContainers(500)
}
</script>
