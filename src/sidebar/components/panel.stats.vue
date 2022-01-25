<template lang="pug">
.StatsPanel(:data-domain-selected="!!state.selectedDomain")

  .ctrls
    .info
      .date {{selectedRange?.fullDate}}
      .passed {{translate('time.passed_short', selectedRange?.passed)}}

  ScrollBox.-domains
    .domains(v-if="selectedRange")
      .domain(
        v-for="domain in selectedRange.domains"
        :key="domain.domain"
        :style="getStyleForDomain(domain)"
        :data-active="state.selectedDomain?.domain === domain.domain"
        :title="domain.domain"
        @click="selectDomain(domain)")
        .bar
        .fav(v-if="domain.favicon")
          svg(v-if="domain.favicon[0] === '#'")
            use(:xlink:href="domain.favicon")
          img(v-else :src="domain.favicon")
        .title {{domain.domain}}
        .info {{domain.passedStr}}

  .ctrls
    .scale
      .up-scale(@click="switchScale(-1)"): svg: use(xlink:href="#icon_expand")
      .title {{translate(`panel.stats.range_${scaleNames[state.scale]}`)}}
      .down-scale(@click="switchScale(1)"): svg: use(xlink:href="#icon_expand")
  .ctrls(v-if="state.selectedDomain")
    .info
      .fav(v-if="state.selectedDomain?.favicon")
        svg(v-if="state.selectedDomain.favicon[0] === '#'")
          use(:xlink:href="state.selectedDomain.favicon")
        img(v-else :src="state.selectedDomain.favicon")
      .fav(v-else): svg: use(xlink:href="#icon_web")
      .title {{state.selectedDomain?.domain ?? 'No filter'}}
      .reset
        svg(v-if="state.selectedDomain" @click="resetDomain"): use(xlink:href="#icon_remove")

  ScrollBox.-ranges
    .ranges
      .group(v-for="group in rangeGroups" :key="group.id")
        .title {{group.title}}
        .range(
          v-for="range in group.ranges"
          :key="range.id"
          :style="getStyleForRange(range)"
          :data-active="selectedRange?.id === range.id"
          :data-weekend="range.weekend"
          @click="selectRange(range)")
          .info
            .date {{range.title}}
            .passed {{translate('time.passed_short', range.passed)}}
          .bar

  PanelPlaceholder(
    :isLoading="!panel?.ready"
    :isMsg="!rangeGroups[0]?.ranges?.length"
    :msg="translate('panel.nothing')")
</template>

<script lang="ts" setup>
import { reactive, computed, nextTick } from 'vue'
import { translate } from 'src/dict'
import { StatsPanel, DomainsStats } from 'src/types'
import { NOID } from 'src/defaults'
import Utils from 'src/utils'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Favicons } from 'src/services/favicons'
import { Stats } from 'src/services/stats'
import { Search } from 'src/services/search'
import ScrollBox from './scroll-box.vue'
import PanelPlaceholder from './panel-placeholder.vue'

interface GroupInfo {
  id: ID
  title: string
  ranges: RangeInfo[]
}

interface RangeInfo {
  id: ID
  startMonth: number
  startYear: number
  endMonth: number
  endYear: number
  title: string
  passed: number
  maxPassed: number
  domains: DomainInfo[]
  weekend?: boolean
  fraction?: number
  fullDate?: string
}

interface DomainInfo {
  domain: string
  passed: number
  passedStr?: string
  favicon?: string
  fraction?: number
}

const enum Scale {
  Day = 1,
  Week = 2,
  Month = 3,
}
const scaleNames: { [k in Scale]: string } = {
  [Scale.Day]: 'day',
  [Scale.Week]: 'week',
  [Scale.Month]: 'month',
}

const DAY_MS = 86400000

const state = reactive({
  scale: Scale.Day,
  graphFolded: false,
  selectedRangeId: NOID,
  selectedDomain: null as DomainInfo | null,
})

Stats.onReady(() => {
  state.selectedRangeId = rangeGroups.value[0]?.ranges[0]?.id ?? NOID
})

const panel = Sidebar.reactive.panelsById.stats as StatsPanel

const isFiltering = computed<boolean>(() => !!Search.reactive.value)

const selectedRange = computed<RangeInfo | null>(() => {
  let result: RangeInfo | undefined

  if (state.selectedRangeId !== NOID) {
    for (const group of rangeGroups.value) {
      for (const range of group.ranges) {
        if (range.id === state.selectedRangeId) {
          result = range
          break
        }
      }
    }
  } else {
    result = rangeGroups.value[0]?.ranges[0]
  }

  if (!result && Search.reactive.value) return rangeGroups.value[0]?.ranges[0] ?? null

  return result ?? null
})

const rangeGroups = computed((): GroupInfo[] => {
  const groups: GroupInfo[] = []
  const groupsById: Record<ID, GroupInfo> = {}
  const ranges: RangeInfo[] = []
  const rangesById: Record<ID, RangeInfo> = {}
  const dayStart = Utils.getDayStartMS()
  let maxPassed = 0
  let range: RangeInfo | undefined
  let prevRange: RangeInfo | undefined

  for (let i = Stats.reactive.list.length; i--; ) {
    const stat = Stats.reactive.list[i]
    if (!stat) continue

    range = getRange(stat, rangesById, dayStart)

    for (const domain of Object.keys(stat.domains)) {
      const value = stat.domains[domain]
      if (value === 0) continue

      if (isFiltering.value) {
        const domainOk = Search.check(domain)
        if (!domainOk) continue
      }

      let domainInfo = range.domains.find(d => d.domain === domain)
      if (domainInfo) {
        domainInfo.passed += value
      } else {
        domainInfo = {
          domain: Utils.decodeUrlPunycode(domain),
          passed: value,
          favicon: Favicons.getIcon(domain),
        }
        range.domains.push(domainInfo)
      }

      if (state.selectedDomain) range.passed += state.selectedDomain.domain === domain ? value : 0
      else range.passed += value

      if (range.maxPassed < domainInfo.passed) range.maxPassed = domainInfo.passed
    }

    if (prevRange && range.id !== prevRange.id && prevRange.passed > 0) {
      maxPassed = Math.max(maxPassed, prevRange.passed)
      ranges.push(prevRange)
    }

    prevRange = range
  }

  if (range && range.passed > 0) {
    maxPassed = Math.max(maxPassed, range.passed)
    ranges.push(range)
  }

  let prevGroup: GroupInfo | undefined
  for (const range of ranges) {
    normalizeDomains(range)
    range.fraction = Math.round((range.passed / maxPassed) * 100)

    const endGroup = getGroup(range.endMonth, range.endYear, groupsById)
    const startGroup = getGroup(range.startMonth, range.startYear, groupsById)

    endGroup.ranges.push(range)
    if (prevGroup !== endGroup) groups.push(endGroup)

    if (endGroup.id !== startGroup.id) {
      startGroup.ranges.push(range)
      if (prevGroup !== startGroup) groups.push(startGroup)
    }

    prevGroup = startGroup
  }

  return groups
})

function getRange(stat: DomainsStats, ranges: Record<ID, RangeInfo>, dayStart: number): RangeInfo {
  let title = ''
  let startMonth = 0
  let startYear = 0
  let endMonth = 0
  let endYear = 0
  let id = NOID
  let weekend = false
  let fullDate = ''
  const dt = new Date(stat.date)

  if (state.scale === Scale.Day) {
    if (stat.date > dayStart) title = translate('time.today')
    else if (stat.date > dayStart - DAY_MS) title = translate('time.yesterday')
    else title = dt.getDate().toString().padStart(2, '0')
    fullDate = dayRangeDate(dt, dayStart)
    const wd = dt.getDay()
    weekend = wd === 0 || wd === 6
    id = dt.setHours(0, 0, 0, 0)
    startYear = dt.getFullYear()
    startMonth = dt.getMonth()
    endYear = startYear
    endMonth = startMonth
  } else if (state.scale === Scale.Week) {
    let weekStartMS: number, weekEndMS: number
    let startWeekOffset = Settings.reactive.statsWeekStart === 'm' ? 1 : 0
    const wd = dt.getDay()
    if (Settings.reactive.statsWeekStart === 'm' && wd === 0) {
      weekEndMS = stat.date
      weekStartMS = weekEndMS - 6 * DAY_MS
    } else {
      weekStartMS = stat.date - (wd - startWeekOffset) * DAY_MS
      weekEndMS = weekStartMS + 6 * DAY_MS
    }

    const wsd = new Date(weekStartMS)
    const wed = new Date(weekEndMS)
    const wsdStr = wsd.getDate().toString().padStart(2, '0')
    const wedStr = wed.getDate().toString().padStart(2, '0')
    if (dayStart + DAY_MS > weekStartMS && dayStart < weekEndMS) title = translate('time.this_week')
    else title = `${wsdStr} - ${wedStr}`
    fullDate = title
    id = wsd.setHours(0, 0, 0, 0)
    startYear = wsd.getFullYear()
    startMonth = wsd.getMonth()
    endYear = wed.getFullYear()
    endMonth = wed.getMonth()
  } else if (state.scale === Scale.Month) {
    title = translate(`time.month_${dt.getMonth()}`)
    fullDate = title
    dt.setDate(1)
    id = dt.setHours(0, 0, 0, 0)
    startYear = dt.getFullYear()
    startMonth = dt.getMonth()
    endYear = startYear
    endMonth = startMonth
  }

  let range: RangeInfo = ranges[id]
  if (!range) {
    range = {
      id,
      startYear,
      startMonth,
      endYear,
      endMonth,
      title,
      fullDate,
      domains: [],
      passed: 0,
      maxPassed: 0,
    }
    ranges[id] = range
  }

  if (weekend) range.weekend = weekend

  return range
}

function getGroup(month: number, year: number, groups: Record<ID, GroupInfo>): GroupInfo {
  let title = ''
  let id = NOID

  if (state.scale === Scale.Day) {
    title = `${translate(`time.month_${month}`)}, ${year}`
    id = year * 100 + month
  } else if (state.scale === Scale.Week) {
    title = `${translate(`time.month_${month}`)}, ${year}`
    id = year * 100 + month
  } else {
    title = `${year}`
    id = year
  }

  let group: GroupInfo = groups[id]
  if (!group) {
    group = { id, title, ranges: [] }
    groups[id] = group
  }

  return group
}

function dayRangeDate(dt: Date, dayStart: number): string {
  if (!dt) return ''

  const ms = dt.getTime()
  if (dayStart) {
    if (ms > dayStart) return translate('time.today')
    if (ms > dayStart - DAY_MS) return translate('time.yesterday')
  }

  const dtday = dt.getDate().toString().padStart(2, '0')
  const dtmth = (dt.getMonth() + 1).toString().padStart(2, '0')
  return `${dt.getFullYear()}.${dtmth}.${dtday}`
}

function normalizeDomains(range: RangeInfo): void {
  range.domains.sort((a, b) => b.passed - a.passed)
  range.domains.forEach(d => {
    d.fraction = d.passed / range.maxPassed
    d.passedStr = translate('time.passed_short', d.passed)
  })
}

function getStyleForDomain(domain: DomainInfo): Record<string, string> {
  const fraction = domain.fraction ? `${domain.fraction * 100}%` : '0%'
  return { '--fraction': fraction }
}

function getStyleForRange(range: RangeInfo): Record<string, string> | undefined {
  return { '--fraction': `${range.fraction ?? '0'}%` }
}

function switchScale(dir: number): void {
  state.selectedRangeId = NOID
  if (dir > 0) {
    if (state.scale === Scale.Day) state.scale = Scale.Week
    else if (state.scale === Scale.Week) state.scale = Scale.Month
    else state.scale = Scale.Day
  }
  if (dir < 0) {
    if (state.scale === Scale.Month) state.scale = Scale.Week
    else if (state.scale === Scale.Week) state.scale = Scale.Day
    else state.scale = Scale.Month
  }
  nextTick(() => {
    state.selectedRangeId = rangeGroups.value[0]?.ranges[0]?.id ?? NOID
  })
}

function selectRange(range: RangeInfo): void {
  if (state.selectedRangeId !== range.id) state.selectedRangeId = range.id
}

function selectDomain(domain: DomainInfo): void {
  if (state.selectedDomain?.domain === domain.domain) state.selectedDomain = null
  else state.selectedDomain = domain
}

function resetDomain(): void {
  state.selectedDomain = null
}
</script>
