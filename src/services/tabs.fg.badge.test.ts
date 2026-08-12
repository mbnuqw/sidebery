import { afterEach, describe, expect, test } from 'vitest'
import * as D from 'src/defaults'
import * as Tabs from 'src/services/tabs.fg'
import * as TabsBadge from 'src/services/tabs.fg.badge'
import * as Settings from 'src/services/settings'

describe('Tabs.parseBadgeRegexpRules()', () => {
  afterEach(() => {
    Settings.resetSettings()
  })

  test('reHasValGroup', () => {
    const conf1 = String.raw`title:\((?<v>\d+)\)|\[(?<v>\d+)\]`
    const hasValGroup1 = TabsBadge.TESTING.reHasValGroup(conf1)
    expect(hasValGroup1).toBe(true)
    const conf2 = String.raw`title:\((\d+)\)|\[\d+\]`
    const hasValGroup2 = TabsBadge.TESTING.reHasValGroup(conf2)
    expect(hasValGroup2).toBe(false)
  })

  test('default notification rule', () => {
    Settings.state.tabsBadgeRules = String.raw`title:\((?<v>\d+)\)|\[(?<v>\d+)\]; urgent`
    Settings.state.tabsBadge = true
    Tabs.parseBadgeRegexpRules()
    const rules = TabsBadge.TESTING.badgeRules
    expect(rules.length).toBe(1)
    const rule = rules[0]
    expect(rule.urlRe).toBeInstanceOf(RegExp)
    expect(rule.urgent).toBe(true)
    expect(rule.urlAny).toBe(true)
    expect(rule.urlVal).toBe(false)
    expect(rule.titleRe).toBeInstanceOf(RegExp)
    expect(rule.titleAny).toBe(false)
    expect(rule.titleVal).toBe(true)
    expect(rule.bg).toBe(undefined)
    expect(rule.fg).toBe(undefined)
  })

  test('empty', () => {
    Settings.state.tabsBadgeRules = String.raw``
    Settings.state.tabsBadge = true
    Tabs.parseBadgeRegexpRules()
    const rules = TabsBadge.TESTING.badgeRules
    expect(rules.length).toBe(0)
  })

  test('rule with notification', () => {
    Settings.state.tabsBadgeRules = String.raw`url:.*; title:.*; urgent; notify`
    Settings.state.tabsBadge = true
    Tabs.parseBadgeRegexpRules()
    const rules = TabsBadge.TESTING.badgeRules
    expect(rules.length).toBe(1)
    const rule = rules[0]
    expect(rule.urgent).toBe(true)
    expect(rule.notify).toBe(true)
  })

  test('all blocks', () => {
    Settings.state.tabsBadgeRules = String.raw`url:abc; title:ABC; notify; urgent; pinned; normal; value:111; bg:222; fg:333`
    Settings.state.tabsBadge = true
    Tabs.parseBadgeRegexpRules()
    const rules = TabsBadge.TESTING.badgeRules
    expect(rules.length).toBe(1)
    const rule = rules[0]
    expect(rule.urgent).toBe(true)
    expect(rule.notify).toBe(true)
    expect(rule.excludePinned).toBe(false)
    expect(rule.excludeNormal).toBe(false)
    expect(rule.urlRe).toBeInstanceOf(RegExp)
    expect(rule.urlAny).toBe(false)
    expect(rule.urlVal).toBe(false)
    expect(rule.titleRe).toBeInstanceOf(RegExp)
    expect(rule.titleAny).toBe(false)
    expect(rule.titleVal).toBe(false)
    expect(rule.staticValue).toBe('111')
    expect(rule.bg).toBe('222')
    expect(rule.fg).toBe('333')
  })

  test('exclude pinned and normal', () => {
    Settings.state.tabsBadgeRules = String.raw`pinned
normal`
    Settings.state.tabsBadge = true
    Tabs.parseBadgeRegexpRules()
    const rules = TabsBadge.TESTING.badgeRules
    expect(rules.length).toBe(2)
    const rule1 = rules[0]
    const rule2 = rules[1]
    expect(rule1.excludeNormal).toBe(true)
    expect(rule2.excludePinned).toBe(true)
  })
})
